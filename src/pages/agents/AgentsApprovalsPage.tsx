import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { agentById } from "@/lib/agents";
import { toast } from "sonner";

const filterOptions = ["All", "Send Email", "Post Social", "Update CRM"] as const;
type FilterKey = (typeof filterOptions)[number];

const filterToType: Record<FilterKey, string | null> = {
  All: null,
  "Send Email": "send_email",
  "Post Social": "post_social",
  "Update CRM": "update_crm",
};

type Approval = {
  id: string;
  action_type: string;
  draft_content: { summary?: string; draft?: string; agentName?: string };
  status: "pending" | "approved" | "rejected" | "executed";
  created_at: string;
  message_id: string;
  agentName?: string;
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function actionTypeLabel(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AgentsApprovalsPage() {
  const [filter, setFilter] = useState<FilterKey>("All");
  const [showFull, setShowFull] = useState<string | null>(null);
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    const { data: actions, error } = await supabase
      .from("proposed_actions")
      .select("id, action_type, draft_content, status, created_at, message_id, messages!inner(conversation_id, conversations!inner(agent_id))")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const enriched: Approval[] = (actions || []).map((a: any) => ({
      id: a.id,
      action_type: a.action_type,
      draft_content: a.draft_content || {},
      status: a.status,
      created_at: a.created_at,
      message_id: a.message_id,
      agentName: agentById(a.messages?.conversations?.agent_id)?.name || "AGENT",
    }));
    setItems(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const visible = items.filter((i) => {
    const t = filterToType[filter];
    return !t ? true : i.action_type === t;
  });
  const pendingCount = items.filter((i) => i.status === "pending").length;

  const handleAction = async (id: string, decision: "approved" | "rejected" | "edited_and_approved", editedContent?: object) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) return;
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ actionId: id, decision, editedContent }),
    });
    if (!resp.ok) {
      toast.error("Action failed");
      return;
    }
    toast.success(decision === "rejected" ? "Rejected" : "Approved");
    setEditingId(null);
    fetchApprovals();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-foreground">Pending Approvals</h1>
        <span className="bg-destructive/15 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
      </div>

      <div className="bg-muted/40 rounded-lg p-0.5 flex gap-0.5 w-fit">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "transition-colors duration-150",
              filter === f
                ? "bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-semibold"
                : "text-muted-foreground text-xs px-3 py-1.5 hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="text-xs text-muted-foreground italic">Loading approvals...</p>}
      {!loading && visible.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No approvals match this filter.</p>
      )}

      <div className="space-y-3">
        {visible.map((item) => {
          const isShowingFull = showFull === item.id;
          const isEditing = editingId === item.id;
          const draft = (item.draft_content?.draft as string) || "";
          const summary = (item.draft_content?.summary as string) || "(no summary)";
          const isResolved = item.status !== "pending";

          return (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded">{item.agentName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{actionTypeLabel(item.action_type)}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{relativeTime(item.created_at)}</span>
              </div>
              <p className="text-sm text-foreground font-medium mt-1">{summary}</p>

              {isEditing ? (
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="w-full bg-background border border-primary/40 rounded-lg p-3 text-xs min-h-[120px] mt-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <div className={cn(
                  "bg-background border border-border rounded-lg p-3 mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap",
                  !isShowingFull && "line-clamp-3",
                )}>
                  {draft || "(no draft body)"}
                </div>
              )}

              {!isEditing && draft && (
                <button
                  onClick={() => setShowFull((prev) => (prev === item.id ? null : item.id))}
                  className="text-[11px] text-primary hover:underline mt-1.5"
                >
                  {isShowingFull ? "Hide draft" : "Show full draft"}
                </button>
              )}

              <div className="flex gap-2 mt-3">
                {item.status === "approved" || item.status === "executed" ? (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-3 py-1.5 rounded-md">✓ Approved</span>
                ) : item.status === "rejected" ? (
                  <span className="bg-destructive/10 border border-destructive/30 text-destructive text-[11px] font-semibold px-3 py-1.5 rounded-md">✗ Rejected</span>
                ) : isEditing ? (
                  <>
                    <button
                      onClick={() => handleAction(item.id, "edited_and_approved", { ...item.draft_content, draft: editDraft })}
                      className="bg-[#B54165] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors duration-150"
                    >Save & Approve</button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-muted-foreground hover:text-foreground text-[11px] px-3 py-1.5 transition-colors duration-150"
                    >Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction(item.id, "approved")}
                      className="bg-[#B54165] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors duration-150"
                      disabled={isResolved}
                    >Approve</button>
                    <button
                      onClick={() => { setEditingId(item.id); setEditDraft(draft); }}
                      className="border border-border text-foreground text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors duration-150"
                    >Edit</button>
                    <button
                      onClick={() => handleAction(item.id, "rejected")}
                      className="text-destructive text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors duration-150"
                    >Reject</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
