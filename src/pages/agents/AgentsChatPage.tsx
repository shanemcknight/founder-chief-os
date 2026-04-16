import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Download,
  Send,
  Paperclip,
  PlusCircle,
  ChevronRight,
  ChevronDown,
  X,
  Check,
} from "lucide-react";

type AgentId = "CHIEF" | "ORACLE" | "FORGE";

const agents = [
  { id: "CHIEF" as AgentId, name: "CHIEF", status: "online" as const, preview: "Approve the Austin draft...", unread: 2 },
  { id: "ORACLE" as AgentId, name: "ORACLE", status: "online" as const, preview: "Inbox scanned, 3 flagged", unread: 0 },
  { id: "FORGE" as AgentId, name: "FORGE", status: "offline" as const, preview: "Last active yesterday", unread: 0 },
];

type Conversation = {
  id: string;
  title: string;
  preview: string;
  time: string;
  archived?: boolean;
};

const conversationsByAgent: Record<AgentId, Conversation[]> = {
  CHIEF: [
    { id: "c1", title: "Wholesale Outreach — Whole Foods", preview: "Approve the Austin draft...", time: "2m ago" },
    { id: "c2", title: "Q2 Content Strategy", preview: "Here's the editorial calendar...", time: "Yesterday" },
    { id: "c3", title: "Invoice Follow-ups", preview: "I've drafted reminder emails...", time: "3 days ago", archived: true },
  ],
  ORACLE: [
    { id: "o1", title: "Inbox Triage", preview: "3 high-priority emails flagged", time: "5m ago" },
  ],
  FORGE: [
    { id: "f1", title: "Shopify Sync", preview: "Last sync: 18 hours ago", time: "Yesterday", archived: true },
  ],
};

type Msg =
  | { kind: "user"; text: string; time: string }
  | { kind: "agent"; agent: AgentId; text: string; time: string }
  | { kind: "system"; text: string }
  | {
      kind: "approval";
      agent: AgentId;
      actionType: string;
      summary: string;
      draft: string;
      state: "pending" | "approved" | "rejected";
    };

const seedThread: Msg[] = [
  { kind: "user", text: "What's the status on the Whole Foods Austin lead?", time: "10:32" },
  {
    kind: "agent",
    agent: "CHIEF",
    text: "Mike Brennan from Bar & Spirits Co. asked about BIB pricing for their cocktail program. I've drafted a reply — covers pricing, lead time, and offers a free Tonic sample. Ready for your approval.",
    time: "10:33",
  },
  {
    kind: "approval",
    agent: "CHIEF",
    actionType: "Send Email",
    summary: "Reply to Mike Brennan re: 3-gal BIB pricing for Bar & Spirits Co.",
    draft:
      "Hey Mike — thanks for reaching out, and glad to hear the Ginger Beer has been working well in your Mules.\n\nFor the 3-gallon BIB format, we're at $135 per unit with a 6-unit minimum on first orders. Lead time is typically 5–7 business days from order confirmation.\n\nI'd love to send you a free sample of our Tonic Water BIB as well — it pairs great with the gin programs most Austin bars are running right now. Let me know where to ship and I'll get it out this week.\n\nHave the best day of your life,\nShane McKnight · Top Hat Provisions",
    state: "pending",
  },
];

function StatusDot({ status }: { status: "online" | "offline" }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full shrink-0",
        status === "online" ? "bg-success animate-pulse" : "bg-muted-foreground/40"
      )}
    />
  );
}

export default function AgentsChatPage() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("CHIEF");
  const [activeConvId, setActiveConvId] = useState<string | null>("c1");
  const [thread, setThread] = useState<Msg[]>(seedThread);
  const [input, setInput] = useState("");
  const [editingApprovalIdx, setEditingApprovalIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [rejectingIdx, setRejectingIdx] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  const [openSections, setOpenSections] = useState({ data: true, reasoning: false, confidence: true });
  const [search, setSearch] = useState("");

  const threadRef = useRef<HTMLDivElement>(null);
  const conversations = conversationsByAgent[activeAgent] || [];
  const activeConv = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [thread]);

  const handleApprove = (idx: number) => {
    setThread((prev) => {
      const next = [...prev];
      const m = next[idx];
      if (m.kind === "approval") (next[idx] as any) = { ...m, state: "approved" };
      next.splice(idx + 1, 0, { kind: "system", text: "✓ Email sent to mike@barandspiritco.com" });
      return next;
    });
    setEditingApprovalIdx(null);
  };

  const handleReject = (idx: number) => {
    setThread((prev) => {
      const next = [...prev];
      const m = next[idx];
      if (m.kind === "approval") (next[idx] as any) = { ...m, state: "rejected" };
      return next;
    });
    setRejectingIdx(null);
    setRejectReason("");
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setThread((prev) => [...prev, { kind: "user", text: input, time }]);
    setInput("");
  };

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full min-h-0 -m-4 md:-m-6">
      {/* COL 1 — Agent + Conversation selector */}
      <div className="w-[240px] shrink-0 border-r border-border flex flex-col bg-background">
        {/* Agents */}
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0">
            Your Agents
          </p>
        </div>
        <div className="px-2 space-y-0.5">
          {agents.map((a) => {
            const isActive = activeAgent === a.id;
            return (
              <button
                key={a.id}
                onClick={() => {
                  setActiveAgent(a.id);
                  const first = conversationsByAgent[a.id]?.[0];
                  setActiveConvId(first?.id || null);
                }}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md transition-colors duration-150 cursor-pointer text-left",
                  isActive
                    ? "bg-primary/10 border-l-2 border-primary text-primary -ml-[2px] pl-[10px]"
                    : "hover:bg-muted/30"
                )}
              >
                <StatusDot status={a.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                      {a.name}
                    </span>
                    {a.unread > 0 && (
                      <span className="bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                        {a.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{a.preview}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button className="text-[11px] text-primary flex items-center gap-1.5 px-3 py-2 mx-2 mt-1 hover:bg-muted/30 rounded-md transition-colors duration-150">
          <PlusCircle size={14} /> Deploy New Agent
        </button>

        <div className="border-t border-border my-2" />

        {/* Conversations */}
        <div className="px-3 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Conversations
          </p>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-background border border-border rounded-md pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="w-full text-[11px] font-semibold bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors duration-150 mb-2">
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filteredConvs.map((c) => {
            const isActive = activeConvId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={cn(
                  "w-full text-left px-2.5 py-2.5 rounded-md transition-colors duration-150",
                  isActive
                    ? "bg-primary/10 border-l-2 border-primary -ml-[2px] pl-[10px]"
                    : "hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate flex-1">{c.title}</p>
                  {c.archived && (
                    <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.preview}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{c.time}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* COL 2 — Message Thread */}
      <div className="flex-1 flex flex-col border-r border-border min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">M</span>
            </div>
            <h2 className="text-base font-bold text-foreground mt-4">{activeAgent} is ready.</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ask anything or start from a recent conversation.
            </p>
            <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold mt-5 hover:bg-primary/90 transition-colors duration-150">
              + New Conversation
            </button>
            <p className="text-[10px] text-muted-foreground mt-6 mb-3">── Recent ──</p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {conversations.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className="bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors duration-150 text-left"
                >
                  <p className="text-xs font-semibold text-foreground truncate">{c.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.preview}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="sticky top-0 border-b border-border px-4 py-3 flex items-center bg-background z-10">
              <h2 className="text-sm font-bold text-foreground flex-1 truncate">{activeConv.title}</h2>
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                  <Search size={15} />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                  <Download size={15} />
                </button>
              </div>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {thread.map((m, i) => {
                if (m.kind === "user") {
                  return (
                    <div key={i} className="flex justify-end">
                      <div>
                        <div className="max-w-[72%] bg-primary/15 border border-primary/30 rounded-xl rounded-tr-sm px-3 py-2.5">
                          <p className="text-xs text-foreground leading-relaxed">{m.text}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1">{m.time}</p>
                      </div>
                    </div>
                  );
                }
                if (m.kind === "agent") {
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{m.agent[0]}</span>
                      </div>
                      <div>
                        <div className="max-w-[78%] bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-primary mb-1">{m.agent}</p>
                          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{m.time}</p>
                      </div>
                    </div>
                  );
                }
                if (m.kind === "system") {
                  return (
                    <p key={i} className="text-center py-1 text-[10px] text-muted-foreground italic">
                      {m.text}
                    </p>
                  );
                }
                // approval
                const isEditing = editingApprovalIdx === i;
                const isRejecting = rejectingIdx === i;
                const borderClass =
                  m.state === "approved"
                    ? "border-l-4 border-l-success"
                    : m.state === "rejected"
                    ? "border-l-4 border-l-destructive"
                    : "border-l-4 border-l-warning";
                const headerLabel =
                  m.state === "approved"
                    ? { text: "✓ APPROVED", color: "text-success" }
                    : m.state === "rejected"
                    ? { text: "✗ REJECTED", color: "text-destructive" }
                    : { text: "⚡ ACTION REQUIRED", color: "text-warning" };

                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{m.agent[0]}</span>
                    </div>
                    <div className={cn("max-w-[85%] bg-card border border-border rounded-xl p-3", borderClass)}>
                      <div className="flex items-center">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", headerLabel.color)}>
                          {headerLabel.text}
                        </span>
                        <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded ml-2">
                          {m.actionType}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed mt-1.5">{m.summary}</p>
                      <div className="bg-background border border-border rounded-lg p-3 mt-2 max-h-[160px] overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {m.draft}
                      </div>

                      {m.state === "pending" && !isEditing && !isRejecting && (
                        <div className="mt-2.5 flex gap-2">
                          <button
                            onClick={() => handleApprove(i)}
                            className="bg-[#B54165] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors duration-150"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setEditingApprovalIdx(i);
                              setEditDraft(m.draft);
                            }}
                            className="border border-border text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-muted/30 text-foreground transition-colors duration-150"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setRejectingIdx(i)}
                            className="text-destructive text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors duration-150"
                          >
                            Reject
                          </button>
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
                              onClick={() => handleApprove(i)}
                              className="bg-[#B54165] text-white text-[11px] px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors duration-150"
                            >
                              Save & Approve
                            </button>
                            <button
                              onClick={() => setEditingApprovalIdx(null)}
                              className="text-muted-foreground hover:text-foreground text-[11px] px-3 py-1.5 transition-colors duration-150"
                            >
                              Cancel
                            </button>
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
                              onClick={() => handleReject(i)}
                              className="bg-destructive text-destructive-foreground text-[11px] px-3 py-1.5 rounded-md hover:bg-destructive/90 transition-colors duration-150"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setRejectingIdx(null)}
                              className="text-muted-foreground hover:text-foreground text-[11px] px-3 py-1.5 transition-colors duration-150"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
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
                  placeholder="Message your agent..."
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-xs placeholder:text-muted-foreground resize-none min-h-[40px] max-h-[120px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 transition-colors duration-150"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Paperclip size={11} />
                  <span className="text-[10px]">Attach context</span>
                </div>
                <span className="text-[10px] text-muted-foreground">~2,400 tokens</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* COL 3 — Context Panel */}
      <div className="w-[240px] shrink-0 hidden lg:flex flex-col overflow-y-auto px-3 py-3 bg-background">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Context</p>
          <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
            <X size={13} />
          </button>
        </div>

        {/* Data Sources */}
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
                { name: "Shopify", active: true },
                { name: "Gmail", active: true },
                { name: "Klaviyo", active: false },
                { name: "HubSpot", active: false },
              ].map((s) => (
                <span
                  key={s.name}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md",
                    s.active
                      ? "bg-primary/10 border border-primary/30 text-primary font-medium"
                      : "bg-muted/30 border border-border text-muted-foreground"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.active ? "bg-success" : "bg-muted-foreground/40")} />
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Agent Reasoning */}
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
              Lead identified as high-intent based on prior trade-show contact, specific product mention (3-gal BIB), and explicit pricing question. Drafted in brand voice with sample upsell to maximize conversion probability.
            </div>
          ) : (
            <button
              onClick={() => setOpenSections((s) => ({ ...s, reasoning: true }))}
              className="text-[11px] text-primary hover:underline cursor-pointer"
            >
              Why this?
            </button>
          )}
        </div>

        {/* Confidence */}
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
