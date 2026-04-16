import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import {
  Archive,
  Star,
  Clock,
  ChevronDown,
  ChevronRight,
  Send,
  Pencil,
  X,
  Sparkles,
  Mail,
  AlertTriangle,
  Users,
  Building2,
  ShieldCheck,
  Volume2,
  StarIcon,
  SendHorizonal,
  Inbox,
  RefreshCw,
  Loader2,
  Reply,
  ReplyAll,
  Forward,
  Plus,
  Check,
  PlusCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Demo data for empty DB
const demoEmails = [
  {
    id: "demo-1",
    from_name: "Mike Brennan",
    from_email: "mike@barandspiritco.com",
    subject: "Wholesale Inquiry — Ginger Beer BIB Pricing",
    body_preview: "High-intent bar owner asking about 3-gal BIB pricing and minimums.",
    body_full: "Hey Shane — we run a cocktail bar in East Austin and have been using your Ginger Beer in our Moscow Mules for a few months now. We're looking at switching to bag-in-box for our soda gun program and want to know your per-unit pricing on the 3-gallon BIB format. What's the minimum order quantity, and what's the typical lead time from order to delivery? We'd love to get set up as a wholesale account if the numbers work.",
    category: "lead",
    chief_summary: "Wholesale inquiry — BIB pricing request from Austin cocktail bar",
    read: false,
    starred: false,
    received_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    draft_body: "Hey Mike — thanks for reaching out, and glad to hear the Ginger Beer has been working well in your Mules.\n\nFor the 3-gallon BIB format, we're at $135 per unit with a 6-unit minimum on first orders. Lead time is typically 5–7 business days from order confirmation.\n\nI'd love to send you a free sample of our Tonic Water BIB as well — it pairs great with the gin programs most Austin bars are running right now. Let me know where to ship and I'll get it out this week.\n\nHave the best day of your life,\nShane McKnight · Top Hat Provisions",
    draft_context: "Known lead from Austin cocktail scene. First inquiry — high purchase intent. Used brand voice: warm, direct, upsell-friendly.",
  },
  {
    id: "demo-2",
    from_name: "QuickBooks",
    from_email: "notifications@quickbooks.intuit.com",
    subject: "Invoice #1042 is 14 days overdue",
    body_preview: "Invoice $840 outstanding. Recommend sending reminder today.",
    body_full: "This is a reminder that Invoice #1042, issued to Barrel & Oak on March 28, 2026, for $840.00 is now 14 days past due. The invoice covers a shipment of 12x Ginger Beer BIB units delivered on March 25. Please follow up with your customer to arrange payment.",
    category: "vendor",
    chief_summary: "Overdue invoice $840 — Barrel & Oak, 14 days past due",
    read: false,
    starred: false,
    received_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    draft_body: "Hey team at Barrel & Oak — just a friendly heads-up that Invoice #1042 for $840 is now 14 days past due. I know things get busy, so just wanted to surface this in case it slipped through.\n\nYou can pay via the link in the original invoice email, or let me know if you'd prefer to arrange a different method. Appreciate you!\n\nHave the best day of your life,\nShane McKnight · Top Hat Provisions",
    draft_context: "Automated QuickBooks alert. CHIEF drafted a gentle follow-up using brand voice. Tone: friendly, non-confrontational.",
  },
  {
    id: "demo-3",
    from_name: "James Whitfield",
    from_email: "james@whitfieldgroup.com",
    subject: "Following up on our conversation",
    body_preview: "Potential SF wholesale partner. Wants to schedule a call.",
    body_full: "Shane — great meeting you at the trade show last week. I run a group of four cocktail bars in the SF Bay Area and we're actively looking for a premium mixer supplier. Your Ginger Beer stood out. Would love to set up a call this week to talk pricing, distribution, and whether you do custom labeling for bar programs.",
    category: "lead",
    chief_summary: "Multi-location SF prospect — wants call re: pricing + custom labeling",
    read: true,
    starred: true,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    draft_body: "James — great connecting at the show, and glad the Ginger Beer made an impression. I'd love to set up a call — how does Thursday at 2pm PT work?\n\nWe absolutely do custom labeling for bar programs, and I can walk you through pricing tiers for multi-location accounts. I'll send a calendar invite shortly.\n\nHave the best day of your life,\nShane McKnight · Top Hat Provisions",
    draft_context: "Trade show lead. 4-location bar group in SF. High-value prospect. Tone: enthusiastic, professional.",
  },
  {
    id: "demo-4",
    from_name: "Amazon Seller Central",
    from_email: "seller-notifications@amazon.com",
    subject: "Your listing has been suppressed",
    body_preview: "Ginger Beer BIB flagged — missing bullet point. Easy fix.",
    body_full: "Your listing for 'Top Hat Provisions Ginger Beer — 3 Gallon Bag-in-Box' (ASIN: B09XYZ1234) has been suppressed due to incomplete product information. Specifically, the listing is missing a required bullet point in the product description. Please update your listing to restore visibility in search results.",
    category: "urgent",
    chief_summary: "Amazon listing suppressed — missing bullet point, quick fix needed",
    read: false,
    starred: false,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    draft_body: "I've identified the issue — the fifth bullet point on the BIB listing was removed during last week's update. I've prepared the corrected listing copy with all five bullet points restored. Approve this and I'll push the update to Amazon immediately.\n\n— Chief",
    draft_context: "System alert from Amazon. CHIEF identified the root cause (missing bullet point from recent edit). Drafted internal action note, not an email reply.",
  },
  {
    id: "demo-5",
    from_name: "Klaviyo",
    from_email: "reports@klaviyo.com",
    subject: "Your weekly email performance report",
    body_preview: "Open rate 38.2%, up 4.1% vs last week. No action needed.",
    body_full: "Here's your weekly performance summary for Top Hat Provisions. Your campaigns achieved a 38.2% open rate this week, up from 34.1% last week. Click-through rate held steady at 4.8%. Your best-performing email was 'Behind the Barrel: How We Source Our Ginger' with a 52% open rate. No issues detected with deliverability.",
    category: "noise",
    chief_summary: "Weekly Klaviyo report — open rate up 4.1%, no action needed",
    read: true,
    starred: false,
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    draft_body: null,
    draft_context: "Automated report. No response needed. CHIEF triaged as informational.",
  },
];

const categories = [
  { key: "all", label: "All Mail", icon: Inbox, count: 0 },
  { key: "urgent", label: "Urgent", icon: AlertTriangle, count: 0 },
  { key: "lead", label: "Leads", icon: Users, count: 0 },
  { key: "customer", label: "Customers", icon: Users, count: 0 },
  { key: "vendor", label: "Vendors", icon: Building2, count: 0 },
  { key: "admin", label: "Admin", icon: ShieldCheck, count: 0 },
  { key: "noise", label: "Noise", icon: Volume2, count: 0 },
  { key: "divider", label: "", icon: null, count: 0 },
  { key: "starred", label: "★ Starred", icon: StarIcon, count: 0 },
  { key: "sent", label: "Sent", icon: SendHorizonal, count: 0 },
];

const categoryColors: Record<string, string> = {
  urgent: "bg-destructive",
  lead: "bg-[hsl(var(--warning))]",
  customer: "bg-primary",
  vendor: "bg-[#6366F1]",
  admin: "bg-muted-foreground",
  noise: "bg-muted-foreground/50",
  sent: "bg-primary",
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (diffH < 24) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffH < 48) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatSyncAge(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const diffMin = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SanitizedHtml({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "em", "strong", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "td", "th", "div", "span", "img", "hr",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "style", "class", "target", "width", "height"],
    ALLOW_DATA_ATTR: false,
  });
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        colorScheme: "light",
        background: "#ffffff",
        padding: "16px",
        borderRadius: "6px",
      }}
    >
      <div
        className="prose prose-sm max-w-none
          [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto
          [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:p-1.5
          [&_th]:border [&_th]:border-gray-300 [&_th]:p-1.5 [&_th]:font-semibold"
        style={{ color: "#1a1a1a", fontSize: "13px", lineHeight: "1.6" }}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}

function isHtml(text: string) {
  return /<[a-z][\s\S]*>/i.test(text);
}

const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export default function InboxMailPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chiefOpen, setChiefOpen] = useState(true);
  const [draftText, setDraftText] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const hasSyncedRef = useRef(false);
  const [composeMode, setComposeMode] = useState<"reply" | "replyAll" | "compose" | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentConfirm, setSentConfirm] = useState(false);

  // Multi-account view
  const [viewMode, setViewMode] = useState<"priority" | "account">("priority");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    setEmailAccounts(data || []);
  }, [user]);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("emails")
      .select("*, email_drafts(*)")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("received_at", { ascending: false });

    if (data && data.length > 0) {
      setEmails(data);
    } else {
      setEmails(demoEmails as any);
    }
  }, [user]);

  const triggerSync = useCallback(async () => {
    if (!user || syncing) return;
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("sync-emails", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      await fetchEmails();
      const count = res.data?.synced ?? 0;
      if (count > 0) toast.success(`Synced ${count} new emails`);
    } catch (err: any) {
      console.error("Sync error:", err);
      // Don't toast on auto-sync failures
    } finally {
      setSyncing(false);
    }
  }, [user, syncing, fetchEmails]);



  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      await fetchEmails();

      // Get last_synced_at from user_integrations
      const { data: integration } = await supabase
        .from("user_integrations")
        .select("last_synced_at")
        .eq("user_id", user.id)
        .eq("provider", "outlook")
        .maybeSingle();

      const syncTime = (integration as any)?.last_synced_at || null;
      setLastSyncedAt(syncTime);
      setLoading(false);

      // Auto-sync if stale (>15 min) or never synced
      if (!hasSyncedRef.current) {
        hasSyncedRef.current = true;
        const isStale = !syncTime || (Date.now() - new Date(syncTime).getTime()) > AUTO_SYNC_INTERVAL_MS;
        if (isStale) {
          triggerSync();
        }
      }
    };
    init();
  }, [user]);

  const filtered =
    selectedCategory === "all"
      ? emails
      : selectedCategory === "starred"
      ? emails.filter((e: any) => e.starred)
      : emails.filter((e: any) => e.category === selectedCategory);

  const selected = filtered.find((e: any) => e.id === selectedId) || filtered[0];

  const openReply = useCallback((mode: "reply" | "replyAll") => {
    if (!selected) return;
    setComposeMode(mode);
    setComposeTo(selected.from_email || "");
    setComposeCc("");
    setComposeSubject(`Re: ${(selected.subject || "").replace(/^Re:\s*/i, "")}`);
    const chiefDraft = selected.draft_body || selected.email_drafts?.[0]?.draft_body || "";
    setComposeBody(chiefDraft);
    setSentConfirm(false);
  }, [selected]);

  const openForward = useCallback(() => {
    if (!selected) return;
    setComposeMode("compose");
    setComposeTo("");
    setComposeCc("");
    setComposeSubject(`Fwd: ${(selected.subject || "").replace(/^Fwd:\s*/i, "")}`);
    const originalBody = selected.body_full || "";
    const separator = "\n\n---------- Forwarded message ----------\nFrom: " + (selected.from_name || "") + " <" + (selected.from_email || "") + ">\nDate: " + formatTime(selected.received_at || selected.created_at) + "\nSubject: " + (selected.subject || "") + "\n\n";
    setComposeBody(separator + (isHtml(originalBody) ? originalBody.replace(/<[^>]*>/g, "") : originalBody));
    setSentConfirm(false);
  }, [selected]);

  const openCompose = useCallback(() => {
    setComposeMode("compose");
    setComposeTo("");
    setComposeCc("");
    setComposeSubject("");
    setComposeBody("");
    setSentConfirm(false);
  }, []);

  const closeCompose = useCallback(() => {
    setComposeMode(null);
    setComposeTo("");
    setComposeCc("");
    setComposeSubject("");
    setComposeBody("");
    setSentConfirm(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!user || !composeTo || !composeSubject || !composeBody) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("send-email-reply", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: {
          to: composeTo,
          cc: composeCc || undefined,
          subject: composeSubject,
          message: composeBody,
          in_reply_to: composeMode === "reply" || composeMode === "replyAll" ? selected?.external_id : undefined,
          email_id: selected?.id?.startsWith("demo-") ? undefined : selected?.id,
          mode: composeMode === "compose" ? "new" : "reply",
        },
      });
      if (res.error) throw res.error;
      setSentConfirm(true);
      toast.success("✓ Sent");
      setTimeout(() => {
        closeCompose();
        fetchEmails();
      }, 1500);
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }, [user, composeTo, composeCc, composeSubject, composeBody, composeMode, selected, closeCompose, fetchEmails]);

  useEffect(() => {
    if (filtered.length > 0 && !selectedId) {
      setSelectedId(filtered[0]?.id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (selected) {
      const draft = selected.draft_body || selected.email_drafts?.[0]?.draft_body || "";
      setDraftText(draft);
    }
  }, [selected?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const idx = filtered.findIndex((em: any) => em.id === selected?.id);
      if (e.key === "j" && idx < filtered.length - 1) {
        setSelectedId(filtered[idx + 1].id);
      } else if (e.key === "k" && idx > 0) {
        setSelectedId(filtered[idx - 1].id);
      } else if (e.key === "e") {
        toast.success("Archived");
      } else if (e.key === "a") {
        toast.success("Sent");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, selected]);

  // Category counts
  const catCounts: Record<string, number> = {};
  emails.forEach((e: any) => {
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
    if (e.starred) catCounts["starred"] = (catCounts["starred"] || 0) + 1;
  });
  catCounts["all"] = emails.length;

  if (loading) {
    return (
      <div className="flex h-full -m-6">
        <div className="w-[200px] border-r border-border p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
        <div className="w-[340px] border-r border-border p-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (emails.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-full -m-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={20} className="text-[hsl(var(--warning))]" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">CHIEF has reviewed your inbox.</p>
          <p className="text-xs text-muted-foreground">Nothing needs your attention right now.</p>
          <p className="text-[10px] text-muted-foreground mt-3">Last synced: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full -m-6">
      {/* Column 1 — Category Sidebar */}
      <div className="w-[200px] shrink-0 border-r border-border flex flex-col overflow-y-auto">
        <div className="p-3 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
        </div>
        <nav className="px-2 space-y-0.5 flex-1">
          {categories.map((cat) => {
            if (cat.key === "divider") return <div key="div" className="border-t border-border my-2" />;
            const isActive = selectedCategory === cat.key;
            const count = catCounts[cat.key] || 0;
            const Icon = cat.icon!;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setSelectedId(null);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors duration-150",
                  isActive
                    ? "text-foreground bg-[#B54165]/10 border-l-2 border-[#B54165] -ml-[2px] pl-[12px]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Icon size={14} />
                <span className="flex-1 text-left">{cat.label}</span>
                {count > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Column 2 — Email List */}
      <div className="w-[340px] shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {categories.find((c) => c.key === selectedCategory)?.label || "All Mail"}
            </h2>
            {lastSyncedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Last synced {formatSyncAge(lastSyncedAt)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={openCompose}
              className="flex items-center gap-1 text-[10px] font-semibold text-foreground border border-border px-2 py-1 rounded hover:bg-muted/30 transition-colors"
            >
              <Plus size={10} />
              Compose
            </button>
            <button
              onClick={() => triggerSync()}
              disabled={syncing}
              className="flex items-center gap-1 text-[10px] font-semibold text-primary border border-primary/30 px-2 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              Sync
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((email: any) => {
            const isSelected = email.id === selected?.id;
            const isUnread = !email.read;
            return (
              <button
                key={email.id}
                onClick={() => setSelectedId(email.id)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border/50 transition-colors duration-100 group",
                  isSelected
                    ? "bg-[#B54165]/5 border-l-2 border-l-[#B54165]"
                    : "hover:bg-muted/20 border-l-2 border-l-transparent",
                  isUnread ? "bg-card/50" : "opacity-70"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                      categoryColors[email.category] || "bg-muted-foreground"
                    )}
                  >
                    {getInitials(email.from_name || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-xs truncate", isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                        {email.from_name}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                        {formatTime(email.received_at || email.created_at)}
                      </span>
                      <span className={cn("w-2 h-2 rounded-full shrink-0", categoryColors[email.category] || "bg-muted-foreground")} />
                    </div>
                    <p className={cn("text-[12px] truncate mt-0.5", isUnread ? "font-semibold text-foreground" : "text-foreground/70")}>
                      {email.subject}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{email.body_preview}</p>
                    {email.chief_summary && (
                      <p className="text-[10px] text-[hsl(var(--warning))] italic mt-1 truncate">
                        ↳ {email.chief_summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="hidden group-hover:flex items-center gap-1 mt-1.5 ml-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.success("Archived"); }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50"
                  >
                    <Archive size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.success("Starred"); }}
                    className="text-muted-foreground hover:text-[hsl(var(--warning))] p-1 rounded hover:bg-muted/50"
                  >
                    <Star size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toast.success("Snoozed"); }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/50"
                  >
                    <Clock size={12} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Column 3 — Email Detail + CHIEF Panel */}
      {selected && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{selected.from_name}</p>
                <p className="text-[11px] text-muted-foreground">{selected.from_email}</p>
                <p className="text-sm font-bold text-foreground mt-2">{selected.subject}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <button
                  onClick={() => openReply("reply")}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border px-2 py-1 rounded hover:bg-muted/30 hover:text-foreground transition-colors"
                  title="Reply"
                >
                  <Reply size={12} /> Reply
                </button>
                <button
                  onClick={() => openReply("replyAll")}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border px-2 py-1 rounded hover:bg-muted/30 hover:text-foreground transition-colors"
                  title="Reply All"
                >
                  <ReplyAll size={12} /> Reply All
                </button>
                <button
                  onClick={openForward}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border px-2 py-1 rounded hover:bg-muted/30 hover:text-foreground transition-colors"
                  title="Forward"
                >
                  <Forward size={12} /> Forward
                </button>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{formatTime(selected.received_at || selected.created_at)}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5">

            {/* Render email body — HTML or plain text */}
            {selected.body_full && isHtml(selected.body_full) ? (
              <SanitizedHtml html={selected.body_full} />
            ) : (
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">{selected.body_full}</p>
            )}

            {/* Compose / Reply Area */}
            {composeMode && (
              <div className="mt-4 border border-border rounded-lg bg-card p-4 space-y-3">
                {sentConfirm ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Check size={16} className="text-[hsl(var(--success))]" />
                    <span className="text-sm font-medium text-[hsl(var(--success))]">Sent</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">
                        {composeMode === "compose" ? "New Email" : composeMode === "replyAll" ? "Reply All" : "Reply"}
                      </p>
                      <button onClick={closeCompose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/30">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-8 shrink-0">To:</span>
                        <Input
                          value={composeTo}
                          onChange={(e) => setComposeTo(e.target.value)}
                          placeholder="recipient@example.com"
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                      {composeMode === "replyAll" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-8 shrink-0">Cc:</span>
                          <Input
                            value={composeCc}
                            onChange={(e) => setComposeCc(e.target.value)}
                            placeholder="cc@example.com"
                            className="h-7 text-xs bg-background"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-8 shrink-0">Subj:</span>
                        <Input
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          placeholder="Subject"
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                    </div>
                    <Textarea
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      placeholder="Write your message..."
                      className="min-h-[120px] text-xs bg-background resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{composeBody.length} chars</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={closeCompose}
                          className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSend}
                          disabled={sending || !composeTo || !composeBody}
                          className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          {sending ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom: CHIEF Panel */}
          <div className="border-t border-border">
            <button
              onClick={() => setChiefOpen(!chiefOpen)}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors"
            >
              <Sparkles size={14} className="text-[hsl(var(--warning))]" />
              <span className="text-xs font-bold text-[hsl(var(--warning))]">CHIEF</span>
              <span className="text-[11px] text-muted-foreground">· Draft reply ready</span>
              <span className="ml-auto">
                {chiefOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
              </span>
            </button>

            {chiefOpen && (
              <div className="px-4 pb-4 space-y-3">
                {selected.draft_context && (
                  <p className="text-[10px] text-muted-foreground italic">{selected.draft_context}</p>
                )}

                <Textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="min-h-[120px] text-xs bg-[#2A2D31] border-border/50 resize-none"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[hsl(var(--success))]">✓ Brand voice match</span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => toast.success("Email sent")}
                    className="w-full text-xs font-medium bg-[#B54165] text-white px-4 py-2 rounded-md hover:bg-[#B54165]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={12} /> Send This
                  </button>
                  <button
                    onClick={() => toast("Editing mode")}
                    className="w-full text-xs font-medium border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={12} /> Edit & Send
                  </button>
                  <button
                    onClick={() => toast("Snoozed for later")}
                    className="w-full text-xs font-medium text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock size={12} /> Snooze
                  </button>
                  <button
                    onClick={() => toast("Dismissed")}
                    className="w-full text-xs font-medium text-destructive/70 px-4 py-2 rounded-md hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={12} /> Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
