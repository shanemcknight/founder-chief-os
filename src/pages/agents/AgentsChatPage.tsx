import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Search, Download, Send, Paperclip, PlusCircle, ChevronRight, ChevronDown, X, Zap, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AGENTS, type AgentName } from "@/lib/agents";
import { streamAgentChat, type ChatWarning, type ChatBlocked } from "@/lib/agentChat";
import { toast } from "sonner";

type ConversationListItem = {
  id: string;
  title: string;
  status: string;
  agentId: string;
  lastMessage: string;
  updatedAt: string;
};

type ProposedAction = {
  id: string;
  action_type: string;
  draft_content: { summary?: string; draft?: string; agentName?: string };
  status: "pending" | "approved" | "rejected" | "executed";
};

type ThreadMessage = {
  id: string;
  sender: "user" | "agent" | "system";
  type: "text" | "proposal" | "system" | "thinking";
  content: string;
  metadata?: { proposalType?: string; summary?: string } | null;
  created_at: string;
  proposedAction?: ProposedAction | null;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatusDot({ status }: { status: "online" | "offline" }) {
  return (
    <span className={cn("w-2 h-2 rounded-full shrink-0", status === "online" ? "bg-success animate-pulse" : "bg-muted-foreground/40")} />
  );
}

export default function AgentsChatPage() {
  const [activeAgentName, setActiveAgentName] = useState<AgentName>("My HQ Agent");
  const activeAgent = AGENTS.find((a) => a.name === activeAgentName)!;
  const isClaudeDirect = activeAgent.isSpecial === true;

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");

  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [rejectingActionId, setRejectingActionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [openSections, setOpenSections] = useState({ data: true, reasoning: false, confidence: true });
  const [search, setSearch] = useState("");

  // Token-gating UI state. BYOK users never receive these signals so they stay null.
  const [warning, setWarning] = useState<ChatWarning | null>(null);
  const [blocked, setBlocked] = useState<ChatBlocked | null>(null);
  const [lowDismissed, setLowDismissed] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-conversations?agentId=${activeAgent.id}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      console.error("conversations load failed", await resp.text());
      return;
    }
    const list: ConversationListItem[] = await resp.json();
    setConversations(list);
    if (!activeConvId && list.length > 0) setActiveConvId(list[0].id);
  }, [activeAgent.id, activeConvId]);

  const fetchThread = useCallback(async (convId: string) => {
    setLoadingThread(true);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) {
      setLoadingThread(false);
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-conversation?id=${convId}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      console.error("thread load failed", await resp.text());
      setLoadingThread(false);
      return;
    }
    const data = await resp.json();
    setThread(data.messages || []);
    setLoadingThread(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConvId) fetchThread(activeConvId);
    else setThread([]);
  }, [activeConvId, fetchThread]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [thread, streamBuffer]);

  const handleNewChat = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("Please sign in first");
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userData.user.id, agent_id: activeAgent.id, title: "New Conversation" })
      .select("id, title, status, agent_id, updated_at")
      .single();
    if (error || !data) {
      toast.error("Could not start conversation");
      return;
    }
    setConversations((prev) => [
      { id: data.id, title: data.title, status: data.status, agentId: data.agent_id, lastMessage: "", updatedAt: data.updated_at },
      ...prev,
    ]);
    setActiveConvId(data.id);
    setThread([]);
  };

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    let convId = activeConvId;

    // Auto-create conversation on first message
    if (!convId) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error("Please sign in first");
        return;
      }
      const title = input.trim().slice(0, 60);
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userData.user.id, agent_id: activeAgent.id, title })
        .select("id, title, status, agent_id, updated_at")
        .single();
      if (error || !data) {
        toast.error("Could not start conversation");
        return;
      }
      convId = data.id;
      setActiveConvId(data.id);
      setConversations((prev) => [
        { id: data.id, title: data.title, status: data.status, agentId: data.agent_id, lastMessage: "", updatedAt: data.updated_at },
        ...prev,
      ]);
    }

    const userMsgText = input.trim();
    setInput("");
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    setThread((prev) => [
      ...prev,
      { id: tempId, sender: "user", type: "text", content: userMsgText, created_at: nowIso },
    ]);
    setStreaming(true);
    setStreamBuffer("");

    await streamAgentChat(
      { conversationId: convId!, agentId: activeAgent.id, agentName: activeAgent.name, message: userMsgText },
      {
        onDelta: (chunk) => setStreamBuffer((prev) => prev + chunk),
        onWarning: (w) => {
          setWarning(w);
          if (w.level === "low") setLowDismissed(false);
        },
        onBlocked: (b) => setBlocked(b),
        onError: (err) => {
          toast.error(err.message);
          setStreaming(false);
          setStreamBuffer("");
        },
        onDone: async () => {
          setStreaming(false);
          setStreamBuffer("");
          if (convId) await fetchThread(convId);
          fetchConversations();
        },
      },
    );
  };

  const handleApprove = async (actionId: string, edited?: string) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) return;
    const decision = edited ? "edited_and_approved" : "approved";
    const editedContent = edited ? { draft: edited } : undefined;
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ actionId, decision, editedContent }),
    });
    if (!resp.ok) {
      toast.error("Approval failed");
      return;
    }
    toast.success("Approved");
    setEditingActionId(null);
    if (activeConvId) fetchThread(activeConvId);
  };

  const handleReject = async (actionId: string) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) return;
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ actionId, decision: "rejected", notes: rejectReason || undefined }),
    });
    if (!resp.ok) {
      toast.error("Reject failed");
      return;
    }
    toast.success("Rejected");
    setRejectingActionId(null);
    setRejectReason("");
    if (activeConvId) fetchThread(activeConvId);
  };

  const filteredConvs = conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex h-full min-h-0 -m-4 md:-m-6">
      {/* COL 1 — Agents + Conversations */}
      <div className="w-[240px] shrink-0 border-r border-border flex flex-col bg-background">
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Agents</p>
        </div>
        <div className="px-2 space-y-0.5">
          {AGENTS.map((a) => {
            const isActive = activeAgentName === a.name;
            const special = a.isSpecial === true;
            return (
              <button
                key={a.id}
                onClick={() => {
                  setActiveAgentName(a.name);
                  setActiveConvId(null);
                  setThread([]);
                }}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md transition-colors duration-150 cursor-pointer text-left",
                  special && !isActive && "border border-primary/20 bg-primary/5",
                  isActive ? "bg-primary/10 border-l-2 border-primary text-primary -ml-[2px] pl-[10px]" : !special && "hover:bg-muted/30",
                )}
              >
                {special ? (
                  <Sparkles size={10} className="text-primary mt-1 shrink-0" />
                ) : (
                  <StatusDot status={a.status} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>{a.name}</span>
                  </div>
                  <p className={cn(
                    "text-[10px] truncate mt-0.5",
                    special ? "text-muted-foreground italic" : "text-muted-foreground",
                  )}>
                    {special ? "Direct AI · No agent layer" : a.preview}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button className="text-[11px] text-primary flex items-center gap-1.5 px-3 py-2 mx-2 mt-1 hover:bg-muted/30 rounded-md transition-colors duration-150">
          <PlusCircle size={14} /> Deploy New Agent
        </button>

        <div className="border-t border-border my-2" />

        <div className="px-3 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conversations</p>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-background border border-border rounded-md pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleNewChat}
            className="w-full text-[11px] font-semibold bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors duration-150 mb-2"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filteredConvs.length === 0 && (
            <p className="text-[11px] text-muted-foreground px-3 py-2">No conversations yet. Start one →</p>
          )}
          {filteredConvs.map((c) => {
            const isActive = activeConvId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={cn(
                  "w-full text-left px-2.5 py-2.5 rounded-md transition-colors duration-150",
                  isActive ? "bg-primary/10 border-l-2 border-primary -ml-[2px] pl-[10px]" : "hover:bg-muted/30",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate flex-1">{c.title}</p>
                  {c.status === "archived" && (
                    <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Archived</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.lastMessage || "No messages yet"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{relativeTime(c.updatedAt)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* COL 2 — Thread */}
      <div className="flex-1 flex flex-col border-r border-border min-w-0">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{activeAgent.name[0]}</span>
            </div>
            <h2 className="text-base font-bold text-foreground mt-4">{activeAgent.name} is ready.</h2>
            <p className="text-sm text-muted-foreground mt-1">Ask anything or start from a recent conversation.</p>
            <button
              onClick={handleNewChat}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold mt-5 hover:bg-primary/90 transition-colors duration-150"
            >
              + New Conversation
            </button>
          </div>
        ) : (
          <>
            <div className="sticky top-0 border-b border-border px-4 py-3 flex items-center bg-background z-10">
              <h2 className="text-sm font-bold text-foreground flex-1 truncate">{activeConv?.title || "Conversation"}</h2>
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-foreground transition-colors duration-150"><Search size={15} /></button>
                <button className="text-muted-foreground hover:text-foreground transition-colors duration-150"><Download size={15} /></button>
              </div>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Critical token banner — pinned at top of thread, not dismissable */}
              {warning?.level === "critical" && !blocked && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 text-xs text-warning flex items-center gap-2 flex-wrap">
                  <span className="flex-1 min-w-[180px]">Running low on tokens this month. Upgrade or connect your API key to keep going.</span>
                  <Link to="/pricing" className="font-semibold underline hover:no-underline">Upgrade →</Link>
                  <Link to="/settings" className="font-semibold underline hover:no-underline">Connect Key →</Link>
                </div>
              )}
              {/* Low usage system message — dismissable, shown once per session */}
              {warning?.level === "low" && !lowDismissed && !blocked && (
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground italic">
                  <span>You've used {Math.round(warning.percent)}% of your monthly tokens.</span>
                  <Link to="/settings" className="text-primary not-italic font-medium hover:underline">Connect key →</Link>
                  <button
                    onClick={() => setLowDismissed(true)}
                    className="text-muted-foreground hover:text-foreground ml-1"
                    aria-label="Dismiss"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {loadingThread && <p className="text-xs text-muted-foreground italic text-center">Loading...</p>}
              {!loadingThread && thread.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center">No messages yet. Say hi to {activeAgent.name}.</p>
              )}

              {thread.map((m) => {
                if (m.sender === "user") {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div>
                        <div className="max-w-[72%] bg-primary/15 border border-primary/30 rounded-xl rounded-tr-sm px-3 py-2.5">
                          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">{formatTime(m.created_at)}</p>
                      </div>
                    </div>
                  );
                }
                if (m.sender === "system") {
                  return <p key={m.id} className="text-center py-1 text-[10px] text-muted-foreground italic">{m.content}</p>;
                }
                // agent
                if (m.type === "proposal" && m.proposedAction && !isClaudeDirect) {
                  const action = m.proposedAction;
                  const draftText = (action.draft_content?.draft as string) || "";
                  const summary = (action.draft_content?.summary as string) || m.content;
                  const isEditing = editingActionId === action.id;
                  const isRejecting = rejectingActionId === action.id;
                  const isApproved = action.status === "approved" || action.status === "executed";
                  const isRejected = action.status === "rejected";
                  const borderClass = isApproved
                    ? "border-l-4 border-l-success"
                    : isRejected
                    ? "border-l-4 border-l-destructive"
                    : "border-l-4 border-l-warning";
                  const headerLabel = isApproved
                    ? { text: "✓ APPROVED", color: "text-success" }
                    : isRejected
                    ? { text: "✗ REJECTED", color: "text-destructive" }
                    : { text: "⚡ ACTION REQUIRED", color: "text-warning" };
                  const actionTypeLabel = action.action_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

                  return (
                    <div key={m.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{activeAgent.name[0]}</span>
                      </div>
                      <div className={cn("max-w-[85%] bg-card border border-border rounded-xl p-3", borderClass)}>
                        <div className="flex items-center">
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", headerLabel.color)}>{headerLabel.text}</span>
                          <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded ml-2">{actionTypeLabel}</span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed mt-1.5">{summary}</p>
                        <div className="bg-background border border-border rounded-lg p-3 mt-2 max-h-[160px] overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                          {draftText}
                        </div>

                        {!isApproved && !isRejected && !isEditing && !isRejecting && (
                          <div className="mt-2.5 flex gap-2">
                            <button
                              onClick={() => handleApprove(action.id)}
                              className="bg-[#B54165] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors duration-150"
                            >Approve</button>
                            <button
                              onClick={() => { setEditingActionId(action.id); setEditDraft(draftText); }}
                              className="border border-border text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-muted/30 text-foreground transition-colors duration-150"
                            >Edit</button>
                            <button
                              onClick={() => setRejectingActionId(action.id)}
                              className="text-destructive text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors duration-150"
                            >Reject</button>
                          </div>
                        )}

                        {isEditing && (
                          <div className="animate-fade-in">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              className="w-full bg-background border border-primary/40 rounded-lg p-3 text-xs min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-primary mt-2 text-foreground"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleApprove(action.id, editDraft)}
                                className="bg-[#B54165] text-white text-[11px] px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors duration-150"
                              >Save & Approve</button>
                              <button
                                onClick={() => setEditingActionId(null)}
                                className="text-muted-foreground hover:text-foreground text-[11px] px-3 py-1.5 transition-colors duration-150"
                              >Cancel</button>
                            </div>
                          </div>
                        )}

                        {isRejecting && (
                          <div className="animate-fade-in mt-2">
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason?"
                              className="w-full bg-background border border-destructive/40 rounded-lg p-3 text-xs min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-destructive text-foreground"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleReject(action.id)}
                                className="bg-destructive text-destructive-foreground text-[11px] px-3 py-1.5 rounded-md hover:bg-destructive/90 transition-colors duration-150"
                              >Confirm</button>
                              <button
                                onClick={() => { setRejectingActionId(null); setRejectReason(""); }}
                                className="text-muted-foreground hover:text-foreground text-[11px] px-3 py-1.5 transition-colors duration-150"
                              >Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // text agent message (or Claude Direct response — proposals fall through to here too)
                return (
                  <div key={m.id} className="flex items-start gap-2.5">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isClaudeDirect ? "bg-primary/10 border border-primary/30" : "bg-primary/20",
                    )}>
                      {isClaudeDirect ? (
                        <Sparkles size={11} className="text-primary" />
                      ) : (
                        <span className="text-[10px] font-bold text-primary">{activeAgent.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="max-w-[78%] bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-[10px] font-semibold text-primary">{activeAgent.name}</p>
                          {isClaudeDirect && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Claude Direct
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Live streaming bubble */}
              {streaming && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{activeAgent.name[0]}</span>
                  </div>
                  <div>
                    <div className="max-w-[78%] bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-primary mb-1">{activeAgent.name}</p>
                      {streamBuffer ? (
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                          {streamBuffer}
                          <span className="inline-block w-[6px] h-[12px] bg-primary ml-0.5 align-middle animate-pulse" />
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0s" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.4s" }} />
                          <span className="text-xs text-muted-foreground italic ml-1">Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input — replaced with friendly block when token budget exceeded */}
            {blocked ? (
              <div className="border-t border-border px-4 py-4">
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Zap size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    You've used all your tokens for {new Date().toLocaleString("en-US", { month: "long" })}.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your tokens reset next month. Upgrade your plan or connect your own API key to keep chatting.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Link
                      to={blocked.upgrade_url || "/pricing"}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors duration-150"
                    >
                      Upgrade Plan
                    </Link>
                    <Link
                      to={blocked.byok_url || "/settings"}
                      className="border border-border text-foreground px-4 py-2 rounded-lg text-xs hover:bg-muted/30 transition-colors duration-150"
                    >
                      Connect API Key
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-border px-4 py-3">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Message ${activeAgent.name}...`}
                    disabled={streaming}
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-xs placeholder:text-muted-foreground resize-none min-h-[40px] max-h-[120px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-60"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={streaming || !input.trim()}
                    className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 transition-colors duration-150 disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Paperclip size={11} />
                    <span className="text-[10px]">Attach context</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {streaming ? "Streaming..." : `${thread.length} message${thread.length === 1 ? "" : "s"}`}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* COL 3 — Context */}
      <div className="w-[240px] shrink-0 hidden lg:flex flex-col overflow-y-auto px-3 py-3 bg-background">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Context</p>
          <button className="text-muted-foreground hover:text-foreground transition-colors duration-150"><X size={13} /></button>
        </div>

        <div className="mb-3">
          <button
            onClick={() => setOpenSections((s) => ({ ...s, data: !s.data }))}
            className="w-full flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2"
          >
            {openSections.data ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Data Sources
          </button>
          {openSections.data && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { name: "Shopify", active: true }, { name: "Gmail", active: true },
                { name: "Klaviyo", active: false }, { name: "HubSpot", active: false },
              ].map((s) => (
                <span key={s.name} className={cn(
                  "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md",
                  s.active ? "bg-primary/10 border border-primary/30 text-primary font-medium" : "bg-muted/30 border border-border text-muted-foreground",
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.active ? "bg-success" : "bg-muted-foreground/40")} />
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-3">
          <button
            onClick={() => setOpenSections((s) => ({ ...s, reasoning: !s.reasoning }))}
            className="w-full flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2"
          >
            {openSections.reasoning ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Agent Reasoning
          </button>
          {openSections.reasoning ? (
            <div className="bg-muted/20 rounded-lg p-3 text-[11px] text-muted-foreground leading-relaxed mt-2">
              The agent uses your conversation history (last 20 messages) and its system instructions to draft replies. High-stakes actions are surfaced for your approval before execution.
            </div>
          ) : (
            <button onClick={() => setOpenSections((s) => ({ ...s, reasoning: true }))} className="text-[11px] text-primary hover:underline cursor-pointer">
              Why this?
            </button>
          )}
        </div>

        <div>
          <button
            onClick={() => setOpenSections((s) => ({ ...s, confidence: !s.confidence }))}
            className="w-full flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2"
          >
            {openSections.confidence ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Confidence
          </button>
          {openSections.confidence && (
            <>
              <div className="w-full bg-success/25 h-1.5 rounded-full" />
              <p className="text-[10px] text-success mt-1">High confidence — acting on verified data</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
