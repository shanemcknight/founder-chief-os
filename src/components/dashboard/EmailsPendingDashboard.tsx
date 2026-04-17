import { useState, useMemo, useCallback, useEffect } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import RefreshIndicator from "@/components/dashboard/RefreshIndicator";
import {
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  CalendarIcon,
  Edit3,
  RotateCcw,
  Flag,
  Forward,
  Reply,
  Plus,
  ChevronDown,
  ChevronRight,
  Filter,
  Sparkles,
  TrendingUp,
  Heart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Types ─────────────────────────────────────── */

type Priority = "HIGH" | "MEDIUM" | "LOW";
type EmailStatus = "NEEDS_RESPONSE" | "DRAFTED" | "SCHEDULED" | "QUEUED";

interface InboxSource {
  id: string;
  email: string;
  label: string;
}

const INBOX_SOURCES: InboxSource[] = [
  { id: "tophat", email: "shane@tophatprovisions.com", label: "Top Hat" },
  { id: "culture", email: "shane@culturecocktails.co", label: "Culture" },
  { id: "personal", email: "shane@gmail.com", label: "Personal" },
];

interface PendingEmail {
  id: string;
  from_name: string;
  from_email: string;
  from_company: string;
  subject: string;
  body: string;
  priority: Priority;
  priority_score: number;
  status: EmailStatus;
  received_at: string;
  inbox_source: string;
  folder: string;
  category: string;
  segment?: string;
  segment_size?: number;
  previous_emails?: number;
  draft_response?: string;
  predicted_open_rate?: number;
  predicted_revenue?: string;
  suggested_send_time?: string;
  related_campaigns?: { name: string; status: string }[];
}

/* ── Category → Priority mapping ──────────────── */

const URGENT_KEYWORDS = ["urgent", "asap", "help", "issue", "payment", "invoice", "suppressed", "overdue"];

function categoryToPriority(category: string, subject: string, bodyPreview: string): { priority: Priority; score: number } {
  const text = `${subject} ${bodyPreview}`.toLowerCase();
  const hasUrgentKeyword = URGENT_KEYWORDS.some((kw) => text.includes(kw));

  if (category === "urgent" || hasUrgentKeyword) return { priority: "HIGH", score: 9 };
  if (category === "lead") return { priority: "HIGH", score: 8 };
  if (category === "customer") return { priority: "HIGH", score: 7 };
  if (category === "vendor") return { priority: "MEDIUM", score: 5 };
  if (category === "admin") return { priority: "MEDIUM", score: 4 };
  return { priority: "LOW", score: 2 };
}

function inferInboxSource(fromEmail: string): string {
  // This is a heuristic — in production, emails table would have a mailbox column
  // For now, distribute based on the user's connected account
  return "tophat";
}

function extractCompany(email: string, name: string): string {
  if (!email) return name || "Unknown";
  const domain = email.split("@")[1] || "";
  if (domain.includes("gmail") || domain.includes("outlook") || domain.includes("yahoo")) return name || "Personal";
  return domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
}

/* ── Helpers ───────────────────────────────────── */

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  HIGH: { label: "HIGH", className: "bg-destructive/15 text-destructive border-destructive/30" },
  MEDIUM: { label: "MED", className: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" },
  LOW: { label: "LOW", className: "bg-muted text-muted-foreground border-border" },
};

const statusConfig: Record<EmailStatus, { label: string; className: string }> = {
  NEEDS_RESPONSE: { label: "Needs Response", className: "bg-destructive/10 text-destructive" },
  DRAFTED: { label: "Drafted", className: "bg-primary/10 text-primary" },
  SCHEDULED: { label: "Scheduled", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
  QUEUED: { label: "Queued", className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Stat Tile ─────────────────────────────────── */

function StatTile({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", accent || "bg-primary/10")}>
        <Icon size={16} className={accent ? "text-card" : "text-primary"} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

/* ── Reject Modal ──────────────────────────────── */

function RejectModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (reason: string, feedback: string) => void }) {
  const [reason, setReason] = useState("tone");
  const [feedback, setFeedback] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject & Request Redraft</DialogTitle>
          <DialogDescription>Why are you rejecting this draft?</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tone">Tone issue</SelectItem>
              <SelectItem value="factual">Factual error</SelectItem>
              <SelectItem value="segment">Wrong segment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="Additional feedback…" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onSubmit(reason, feedback); onClose(); }}>Submit & Redraft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Email Queue Row ───────────────────────────── */

function EmailRow({ email, selected, onClick }: { email: PendingEmail; selected: boolean; onClick: () => void }) {
  const pCfg = priorityConfig[email.priority];
  const sCfg = statusConfig[email.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all",
        selected
          ? "bg-primary/5 border-primary/40"
          : "bg-card border-border hover:bg-accent/5 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-foreground truncate">{email.from_name}</span>
            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 shrink-0", pCfg.className)}>{pCfg.label}</Badge>
          </div>
          <p className="text-xs font-medium text-foreground truncate">{email.subject}</p>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{relativeTime(email.received_at)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={cn("text-[9px] px-1.5 py-0", sCfg.className)}>{sCfg.label}</Badge>
        <span className="text-[10px] text-muted-foreground truncate">{email.from_company}</span>
        {(() => {
          const inbox = INBOX_SOURCES.find(i => i.id === email.inbox_source);
          return inbox ? (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/50 text-muted-foreground border-border shrink-0 ml-auto">
              {inbox.label}
            </Badge>
          ) : null;
        })()}
      </div>
    </button>
  );
}

/* ── Email Detail Panel ────────────────────────── */

function EmailDetail({ email, onApprove, onSchedule, onReject, onFlag }: {
  email: PendingEmail;
  onApprove: () => void;
  onSchedule: (date: Date) => void;
  onReject: () => void;
  onFlag: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(email.draft_response || "");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();

  useEffect(() => {
    setDraftText(email.draft_response || "");
    setEditing(false);
  }, [email.id, email.draft_response]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-1">{email.subject}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>From: <span className="text-foreground font-medium">{email.from_name}</span></span>
            <span>·</span>
            <span>{email.from_email}</span>
            <span>·</span>
            <span>{relativeTime(email.received_at)}</span>
          </div>
        </div>

        {/* Original email */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Original Message</p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{email.body}</p>
        </div>

        {/* AI Draft */}
        {email.draft_response && (
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-semibold text-primary">AI Draft Response</span>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">My HQ Agent</Badge>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={8}
                  className="text-sm bg-background"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditing(false)}>Save Edits</Button>
                  <Button size="sm" variant="outline" onClick={() => { setDraftText(email.draft_response || ""); setEditing(false); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{draftText}</p>
            )}
          </div>
        )}

        {/* No draft */}
        {!email.draft_response && email.status === "NEEDS_RESPONSE" && (
          <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
            <Mail size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No AI-drafted response yet</p>
            <Button size="sm" variant="outline" className="mt-2 gap-1.5"><Edit3 size={12} /> Compose Manually</Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {email.draft_response && (
            <>
              <Button size="sm" className="gap-1.5" onClick={onApprove}>
                <Send size={12} /> Approve & Send
              </Button>
              <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <CalendarIcon size={12} /> Schedule
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={(d) => { setScheduleDate(d); if (d) { onSchedule(d); setScheduleOpen(false); } }}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {!editing && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
                  <Edit3 size={12} /> Edit Draft
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={onReject}>
                <RotateCcw size={12} /> Reject & Redraft
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 text-[hsl(var(--warning))]" onClick={onFlag}>
            <Flag size={12} /> Flag for Later
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

/* ── Context Panel ─────────────────────────────── */

function ContextPanel({ email }: { email: PendingEmail }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Sender Profile */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sender Profile</h4>
          <div className="bg-background rounded-lg p-3 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {email.from_name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{email.from_name}</p>
                <p className="text-[11px] text-muted-foreground">{email.from_company}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <p className="text-[10px] text-muted-foreground">Previous Emails</p>
                <p className="text-sm font-medium text-foreground">{email.previous_emails ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground capitalize">{email.category || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Stats */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Analysis</h4>
          <div className="bg-background rounded-lg p-3 border border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Priority Score</span>
              <span className="text-xs font-medium text-foreground">{email.priority_score}/10</span>
            </div>
            <Progress value={email.priority_score * 10} className="h-1.5" />
            {email.predicted_revenue && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Revenue Impact</span>
                <span className={cn("text-xs font-medium", email.predicted_revenue.startsWith("-") ? "text-destructive" : "text-[hsl(var(--success))]")}>{email.predicted_revenue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Agent Summary */}
        {email.segment && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">My HQ Agent Summary</h4>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-foreground">{email.segment}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</h4>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7"><Reply size={11} /> Reply</Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7"><Forward size={11} /> Forward</Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs h-7"><Plus size={11} /> Add to Sequence</Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

/* ── Loading skeleton ──────────────────────────── */

function EmailQueueSkeleton() {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border border-border space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ────────────────────────────── */

export default function EmailsPendingDashboard() {
  const [emails, setEmails] = useState<PendingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const emailsRefresh = useAutoRefresh({ intervalMs: 2 * 60 * 1000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedInbox, setSelectedInbox] = useState<string>("agentic");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | Priority>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmailStatus>("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "date" | "status">("priority");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  /* ── Fetch real emails from DB ───────────────── */
  const fetchEmails = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Fetch emails
      const { data: dbEmails, error: emailErr } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("received_at", { ascending: false })
        .limit(100);

      if (emailErr) throw emailErr;

      if (!dbEmails || dbEmails.length === 0) {
        setEmails([]);
        setLoading(false);
        return;
      }

      // Fetch drafts for these emails
      const emailIds = dbEmails.map((e) => e.id);
      const { data: drafts } = await supabase
        .from("email_drafts")
        .select("*")
        .eq("user_id", user.id)
        .in("email_id", emailIds);

      const draftMap = new Map((drafts || []).map((d) => [d.email_id, d]));

      // Map DB rows to PendingEmail
      const mapped: PendingEmail[] = dbEmails.map((e) => {
        const { priority, score } = categoryToPriority(e.category, e.subject || "", e.body_preview || "");
        const draft = draftMap.get(e.id);
        const hasDraft = draft && draft.status === "pending";

        return {
          id: e.id,
          from_name: e.from_name || "Unknown",
          from_email: e.from_email || "",
          from_company: extractCompany(e.from_email || "", e.from_name || ""),
          subject: e.subject || "(No subject)",
          body: e.body_full || e.body_preview || "",
          priority,
          priority_score: score,
          status: hasDraft ? "DRAFTED" : "NEEDS_RESPONSE",
          received_at: e.received_at || e.created_at,
          inbox_source: inferInboxSource(e.from_email || ""),
          folder: e.category || "admin",
          category: e.category,
          segment: e.chief_summary || undefined,
          draft_response: hasDraft ? (draft.draft_body || undefined) : undefined,
        };
      });

      setEmails(mapped);
      if (mapped.length > 0 && !selectedId) {
        setSelectedId(mapped[0].id);
      }
    } catch (err: any) {
      console.error("Failed to fetch emails:", err);
      setError(err.message || "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchEmails();
  }, []);

  // Re-fetch on auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchEmails, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  /* ── Inbox counts ────────────────────────────── */
  const inboxCounts = useMemo(() => {
    const highPriority = emails.filter((e) => e.priority === "HIGH" || e.priority_score >= 7);
    const counts: Record<string, number> = {
      agentic: highPriority.length,
      all: emails.length,
    };
    INBOX_SOURCES.forEach((inbox) => {
      counts[inbox.id] = emails.filter((e) => e.inbox_source === inbox.id).length;
    });
    return counts;
  }, [emails]);

  /* ── Filtered emails ─────────────────────────── */
  const filteredEmails = useMemo(() => {
    let list = emails.filter((e) => {
      // AGENTIC INBOX: only high-priority
      if (selectedInbox === "agentic" && e.priority_score < 7) return false;
      // Specific inbox filter
      if (selectedInbox !== "agentic" && selectedInbox !== "all" && e.inbox_source !== selectedInbox) return false;
      if (priorityFilter !== "ALL" && e.priority !== priorityFilter) return false;
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      return true;
    });

    const priorityOrder: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (sortBy === "priority") list.sort((a, b) => b.priority_score - a.priority_score);
    else if (sortBy === "date") list.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
    else list.sort((a, b) => a.status.localeCompare(b.status));

    return list;
  }, [emails, selectedInbox, priorityFilter, statusFilter, sortBy]);

  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  // Stats
  const stats = useMemo(() => {
    const pending = emails.length;
    const high = emails.filter((e) => e.priority === "HIGH").length;
    const awaiting = emails.filter((e) => e.status === "DRAFTED").length;
    const dueSoon = emails.filter((e) => {
      const diff = Date.now() - new Date(e.received_at).getTime();
      return diff < 86400000;
    }).length;
    return { pending, high, awaiting, dueSoon };
  }, [emails]);

  const handleApprove = async () => {
    if (!selectedEmail) return;
    // Call send-email-reply edge function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("send-email-reply", {
        body: { emailId: selectedEmail.id },
      });
      if (res.error) throw res.error;
      setEmails((prev) => prev.filter((e) => e.id !== selectedEmail.id));
      setSelectedId(null);
      toast.success(`Email sent to ${selectedEmail.from_name}`);
    } catch (err: any) {
      toast.error("Failed to send email: " + (err.message || "Unknown error"));
    }
  };

  const handleSchedule = (date: Date) => {
    if (!selectedEmail) return;
    setEmails((prev) => prev.map((e) => e.id === selectedEmail.id ? { ...e, status: "SCHEDULED" as EmailStatus } : e));
    toast.success(`Scheduled for ${format(date, "PPP")}`);
  };

  const handleReject = (reason: string, feedback: string) => {
    if (!selectedEmail) return;
    setEmails((prev) => prev.map((e) => e.id === selectedEmail.id ? { ...e, status: "NEEDS_RESPONSE" as EmailStatus, draft_response: undefined } : e));
    toast.info("Redraft queued — will notify when ready");
  };

  const handleFlag = () => {
    if (!selectedEmail) return;
    toast("Flagged for later", { icon: "🚩" });
  };

  const inboxTabs = [
    { id: "agentic", label: "AGENTIC INBOX" },
    { id: "all", label: "All Inboxes" },
    ...INBOX_SOURCES.map((s) => ({ id: s.id, label: s.label })),
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 group">
          {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
          <Mail size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">AGENTIC EMAIL INBOX</h2>
          <Badge variant="secondary" className="text-[10px]">{stats.pending}</Badge>
        </button>
        <RefreshIndicator agoLabel={emailsRefresh.agoLabel} isRefreshing={emailsRefresh.isRefreshing} onRefresh={() => { emailsRefresh.refresh(); fetchEmails(); }} intervalLabel="2 min" />
      </div>

      {!expanded && <div />}

      {/* Inbox Selector Tabs */}
      {expanded && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {inboxTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedInbox(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                selectedInbox === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label} ({inboxCounts[tab.id] ?? 0})
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <>
          {/* Stat Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatTile label="Total Emails" value={stats.pending} icon={Mail} />
            <StatTile label="High Priority" value={stats.high} icon={AlertTriangle} accent="bg-destructive" />
            <StatTile label="Awaiting Approval" value={stats.awaiting} icon={CheckCircle2} />
            <StatTile label="Due Soon (<24h)" value={stats.dueSoon} icon={Clock} accent="bg-[hsl(var(--warning))]" />
            <StatTile label="Agentic Queue" value={inboxCounts.agentic} icon={Sparkles} />
            <StatTile label="Drafts Ready" value={stats.awaiting} icon={Edit3} />
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={fetchEmails}>Retry</Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && emails.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Mail size={32} className="text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">No emails synced yet</h3>
              <p className="text-xs text-muted-foreground mb-3">Connect your Outlook account and sync emails to see them here.</p>
              <Button size="sm" variant="outline" onClick={fetchEmails}>
                <Loader2 size={12} className="mr-1.5" /> Check Again
              </Button>
            </div>
          )}

          {/* 3-Column Layout */}
          {(loading || filteredEmails.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-3 min-h-[500px]">
              {/* LEFT: Queue */}
              <div className="bg-card border border-border rounded-xl flex flex-col">
                <div className="p-3 border-b border-border space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Filter size={12} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Filters</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
                      <SelectTrigger className="h-7 text-[11px] w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Priority</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                      <SelectTrigger className="h-7 text-[11px] w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="NEEDS_RESPONSE">Needs Response</SelectItem>
                        <SelectItem value="DRAFTED">Drafted</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="QUEUED">Queued</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger className="h-7 text-[11px] w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <EmailQueueSkeleton />
                  ) : (
                    <div className="p-2 space-y-1.5">
                      {filteredEmails.length === 0 && (
                        <div className="text-center py-8">
                          <Sparkles size={20} className="text-primary mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">
                            {selectedInbox === "agentic" ? "All caught up! No urgent emails." : "No emails match filters"}
                          </p>
                        </div>
                      )}
                      {filteredEmails.map((e) => (
                        <EmailRow key={e.id} email={e} selected={e.id === selectedId} onClick={() => setSelectedId(e.id)} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* CENTER: Detail */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {selectedEmail ? (
                  <EmailDetail
                    email={selectedEmail}
                    onApprove={handleApprove}
                    onSchedule={handleSchedule}
                    onReject={() => setRejectOpen(true)}
                    onFlag={handleFlag}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Select an email to view details
                  </div>
                )}
              </div>

              {/* RIGHT: Context */}
              <div className="bg-card border border-border rounded-xl overflow-hidden hidden lg:block">
                {selectedEmail ? (
                  <ContextPanel email={selectedEmail} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    No email selected
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={handleReject} />
    </div>
  );
}
