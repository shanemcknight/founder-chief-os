import { useState, useMemo, useCallback } from "react";
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
  X,
  Sparkles,
  TrendingUp,
  Users,
  BarChart3,
  Heart,
  Filter,
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
  inbox_source: string; // inbox id
  folder: string;
  segment?: string;
  segment_size?: number;
  previous_emails?: number;
  draft_response?: string;
  predicted_open_rate?: number;
  predicted_revenue?: string;
  suggested_send_time?: string;
  related_campaigns?: { name: string; status: string }[];
}

/* ── Mock Data ─────────────────────────────────── */

const MOCK_EMAILS: PendingEmail[] = [
  {
    id: "e1",
    from_name: "Austin Reed",
    from_email: "austin@barreloak.com",
    from_company: "Barrel & Oak",
    subject: "Re: Wholesale Partnership — Spring 2026 Order",
    body: "Hey Shane,\n\nFollowing up on our conversation last week. We'd love to place an initial order of 200 units across 4 SKUs for our spring launch. Can you send over the wholesale price sheet and lead times?\n\nAlso — do you offer co-branded packaging? That would be huge for our retail locations.\n\nLooking forward to hearing from you.\n\nBest,\nAustin",
    priority: "HIGH",
    priority_score: 9,
    status: "DRAFTED",
    received_at: "2026-04-15T08:30:00Z",
    inbox_source: "tophat",
    folder: "Leads",
    segment: "Wholesale Leads",
    segment_size: 340,
    previous_emails: 3,
    draft_response: "Hi Austin,\n\nGreat to hear from you! I'm excited about the partnership opportunity with Barrel & Oak.\n\nHere's what I can confirm:\n• Wholesale pricing: I've attached our Q2 2026 price sheet with tiered discounts for orders of 200+ units\n• Lead times: Currently 2-3 weeks from PO confirmation\n• Co-branded packaging: Yes, we offer this for orders of 500+ units — happy to discuss a phased approach\n\nI'd love to jump on a quick call this week to finalize details. Would Thursday at 2pm CT work?\n\nBest,\nShane",
    predicted_open_rate: 94,
    predicted_revenue: "$12,400",
    suggested_send_time: "Today, 10:30 AM CT",
    related_campaigns: [
      { name: "Wholesale Welcome Sequence", status: "Active" },
      { name: "Q2 Product Launch", status: "Scheduled" },
    ],
  },
  {
    id: "e2",
    from_name: "Sarah Chen",
    from_email: "sarah@gourmetdistro.com",
    from_company: "Gourmet Distribution Co.",
    subject: "Urgent: Amazon Listing Issue — Ginger Beer BIB",
    body: "Shane,\n\nJust a heads up — your Ginger Beer BIB listing on Amazon was suppressed this morning due to a compliance flag. It looks like the ingredient label image doesn't meet their new requirements.\n\nYou'll need to re-upload with the updated template by EOD tomorrow or the listing stays down.\n\nLet me know if you need the spec sheet.\n\nSarah",
    priority: "HIGH",
    priority_score: 10,
    status: "NEEDS_RESPONSE",
    received_at: "2026-04-15T07:15:00Z",
    inbox_source: "tophat",
    folder: "Urgent",
    segment: "Distributors",
    segment_size: 85,
    previous_emails: 12,
    predicted_open_rate: 98,
    predicted_revenue: "$0",
    suggested_send_time: "ASAP",
    related_campaigns: [],
  },
  {
    id: "e3",
    from_name: "Klaviyo System",
    from_email: "noreply@klaviyo.com",
    from_company: "Klaviyo",
    subject: "Campaign Ready: Weekend Flash Sale — 2,400 recipients",
    body: "Your campaign 'Weekend Flash Sale — 20% Off Ginger Collection' is ready to send.\n\nSegment: Active Buyers (last 90 days)\nRecipients: 2,412\nEstimated open rate: 42%\nEstimated revenue: $3,200\n\nReview and approve to send.",
    priority: "HIGH",
    priority_score: 8,
    status: "DRAFTED",
    received_at: "2026-04-15T06:00:00Z",
    inbox_source: "culture",
    folder: "Inbox",
    segment: "Active Buyers (90d)",
    segment_size: 2412,
    previous_emails: 0,
    draft_response: "Campaign content is pre-built in Klaviyo. Ready for one-click approval to send to 2,412 recipients with 20% discount on Ginger Collection products.",
    predicted_open_rate: 42,
    predicted_revenue: "$3,200",
    suggested_send_time: "Friday, 11:00 AM CT",
    related_campaigns: [
      { name: "Abandoned Cart Flow", status: "Active" },
      { name: "Post-Purchase Upsell", status: "Active" },
    ],
  },
  {
    id: "e4",
    from_name: "Mike Torres",
    from_email: "mike@shipstation.com",
    from_company: "ShipStation",
    subject: "Rate increase notification — effective May 1",
    body: "Hi Shane,\n\nThis is to inform you that our shipping rates will increase by 4.2% effective May 1, 2026. This affects USPS Priority and UPS Ground tiers.\n\nPlease review the updated rate card attached and reach out if you'd like to discuss volume discounts.\n\nThanks,\nMike",
    priority: "MEDIUM",
    priority_score: 5,
    status: "NEEDS_RESPONSE",
    received_at: "2026-04-14T16:00:00Z",
    inbox_source: "tophat",
    folder: "Vendors",
    segment: "Vendors",
    segment_size: 0,
    previous_emails: 5,
    predicted_open_rate: 100,
    predicted_revenue: "-$840/mo impact",
    suggested_send_time: "Tomorrow, 9:00 AM CT",
    related_campaigns: [],
  },
  {
    id: "e5",
    from_name: "Newsletter Bot",
    from_email: "digest@company.com",
    from_company: "Internal",
    subject: "Weekly digest — 14 Apr 2026",
    body: "Here's your weekly summary:\n\n• 342 orders processed\n• Revenue: $28,400\n• 3 support tickets open\n• Social reach: +18% WoW",
    priority: "LOW",
    priority_score: 2,
    status: "QUEUED",
    received_at: "2026-04-14T12:00:00Z",
    inbox_source: "personal",
    folder: "Noise",
    segment: "Internal",
    segment_size: 5,
    previous_emails: 52,
    predicted_open_rate: 80,
    predicted_revenue: "$0",
    suggested_send_time: "Monday, 8:00 AM CT",
    related_campaigns: [],
  },
];

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
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">Chief</Badge>
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
                {email.from_name.charAt(0)}
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
                <p className="text-[10px] text-muted-foreground">Segment</p>
                <p className="text-sm font-medium text-foreground">{email.segment || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Stats */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Predictions</h4>
          <div className="bg-background rounded-lg p-3 border border-border space-y-3">
            {email.segment_size != null && email.segment_size > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Segment Size</span>
                <span className="text-xs font-medium text-foreground">{email.segment_size.toLocaleString()}</span>
              </div>
            )}
            {email.segment_size != null && email.segment_size > 0 && email.segment_size < 100 && (
              <div className="flex items-center gap-1.5 p-2 rounded bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20">
                <AlertTriangle size={12} className="text-[hsl(var(--warning))]" />
                <span className="text-[10px] text-[hsl(var(--warning))]">Small segment — verify targeting</span>
              </div>
            )}
            {email.predicted_open_rate != null && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Predicted Open Rate</span>
                  <span className="text-xs font-medium text-foreground">{email.predicted_open_rate}%</span>
                </div>
                <Progress value={email.predicted_open_rate} className="h-1.5" />
              </div>
            )}
            {email.predicted_revenue && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Revenue Impact</span>
                <span className={cn("text-xs font-medium", email.predicted_revenue.startsWith("-") ? "text-destructive" : "text-[hsl(var(--success))]")}>{email.predicted_revenue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Send Time */}
        {email.suggested_send_time && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Best Send Time</h4>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
              <Clock size={14} className="text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{email.suggested_send_time}</span>
            </div>
          </div>
        )}

        {/* Related Campaigns */}
        {email.related_campaigns && email.related_campaigns.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Campaigns</h4>
            <div className="space-y-1.5">
              {email.related_campaigns.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2">
                  <span className="text-xs text-foreground">{c.name}</span>
                  <Badge variant="secondary" className="text-[9px]">{c.status}</Badge>
                </div>
              ))}
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

/* ── Main Component ────────────────────────────── */

export default function EmailsPendingDashboard() {
  const [emails, setEmails] = useState(MOCK_EMAILS);
  const emailsRefresh = useAutoRefresh({ intervalMs: 2 * 60 * 1000 });
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_EMAILS[0]?.id ?? null);
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | Priority>("HIGH");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmailStatus>("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "date" | "status">("priority");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const filteredEmails = useMemo(() => {
    let list = emails.filter((e) => {
      if (priorityFilter !== "ALL" && e.priority !== priorityFilter) return false;
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      return true;
    });

    const priorityOrder: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (sortBy === "priority") list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    else if (sortBy === "date") list.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
    else list.sort((a, b) => a.status.localeCompare(b.status));

    return list;
  }, [emails, priorityFilter, statusFilter, sortBy]);

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

  const handleApprove = () => {
    if (!selectedEmail) return;
    setEmails((prev) => prev.filter((e) => e.id !== selectedEmail.id));
    setSelectedId(null);
    toast.success(`Email sent to ${selectedEmail.from_name}`);
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

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 group">
          {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
          <Mail size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Emails Pending</h2>
          <Badge variant="secondary" className="text-[10px]">{stats.pending}</Badge>
        </button>
        <RefreshIndicator agoLabel={emailsRefresh.agoLabel} isRefreshing={emailsRefresh.isRefreshing} onRefresh={emailsRefresh.refresh} intervalLabel="30 sec" />
      </div>

      {!expanded && <div />}

      {expanded && (
        <>
          {/* Stat Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatTile label="Total Pending" value={stats.pending} icon={Mail} />
            <StatTile label="High Priority" value={stats.high} icon={AlertTriangle} accent="bg-destructive" />
            <StatTile label="Awaiting Approval" value={stats.awaiting} icon={CheckCircle2} />
            <StatTile label="Due Soon (<24h)" value={stats.dueSoon} icon={Clock} accent="bg-[hsl(var(--warning))]" />
            <StatTile label="Avg Open Rate" value="38%" icon={TrendingUp} />
            <StatTile label="List Health" value="94" icon={Heart} />
          </div>

          {/* 3-Column Layout */}
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
                <div className="p-2 space-y-1.5">
                  {filteredEmails.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No emails match filters</p>
                  )}
                  {filteredEmails.map((e) => (
                    <EmailRow key={e.id} email={e} selected={e.id === selectedId} onClick={() => setSelectedId(e.id)} />
                  ))}
                </div>
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
        </>
      )}

      {/* Reject modal */}
      <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onSubmit={handleReject} />
    </div>
  );
}
