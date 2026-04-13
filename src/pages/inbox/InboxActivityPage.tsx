import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, Download, Send, CheckCircle2, Pencil, XCircle, Sparkles } from "lucide-react";

const actionColors: Record<string, { color: string; icon: any }> = {
  published: { color: "text-[hsl(var(--success))]", icon: CheckCircle2 },
  sent: { color: "text-[hsl(var(--success))]", icon: Send },
  approved: { color: "text-[hsl(var(--success))]", icon: CheckCircle2 },
  edited: { color: "text-[#3B82F6]", icon: Pencil },
  rescheduled: { color: "text-[#3B82F6]", icon: Pencil },
  failed: { color: "text-destructive", icon: XCircle },
  rejected: { color: "text-destructive", icon: XCircle },
  chief_draft: { color: "text-[hsl(var(--warning))]", icon: Sparkles },
  chief_triage: { color: "text-[hsl(var(--warning))]", icon: Sparkles },
};

// Demo activity
const demoActivity = [
  { id: "a1", action_type: "chief_triage", description: "CHIEF triaged 12 new emails — 2 marked urgent, 3 leads identified", metadata: { emails_processed: 12, urgent: 2, leads: 3 }, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "a2", action_type: "approved", description: "Approved Instagram Reel 'Moscow Mule Monday' for publishing", metadata: { platform: "instagram", post_title: "Moscow Mule Monday" }, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: "a3", action_type: "sent", description: "Email sent to Mike Brennan — Wholesale BIB pricing reply", metadata: { recipient: "mike@barandspiritco.com" }, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: "a4", action_type: "published", description: "LinkedIn carousel 'Q2 Mixer Trends' published successfully", metadata: { platform: "linkedin", reach: 1200 }, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: "a5", action_type: "chief_draft", description: "CHIEF drafted reply for overdue invoice follow-up — Barrel & Oak", metadata: { draft_type: "invoice_followup" }, created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
  { id: "a6", action_type: "rescheduled", description: "Rescheduled TikTok video from April 12 to April 15", metadata: { from: "2026-04-12", to: "2026-04-15" }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() },
  { id: "a7", action_type: "failed", description: "Instagram Story failed to publish — token expired", metadata: { error: "Token expired" }, created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() },
];

function groupByDay(items: any[]) {
  const groups: Record<string, any[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  items.forEach((item) => {
    const d = new Date(item.created_at);
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let label: string;
    if (itemDay.getTime() === today.getTime()) label = "TODAY";
    else if (itemDay.getTime() === yesterday.getTime()) label = "YESTERDAY";
    else label = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });
  return groups;
}

export default function InboxActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setActivities(data && data.length > 0 ? data : demoActivity);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = searchQuery
    ? activities.filter((a) => a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : activities;

  const grouped = groupByDay(filtered);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const csv = ["Timestamp,Action,Description", ...activities.map((a) => `${a.created_at},${a.action_type},"${a.description}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity_log.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 -m-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Activity</h1>
        <button
          onClick={handleExport}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search activity..."
          className="pl-8 h-8 text-xs bg-card border-border"
        />
      </div>

      {Object.entries(grouped).map(([dayLabel, items]) => (
        <div key={dayLabel}>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{dayLabel}</h2>
          <div className="space-y-1">
            {(items as any[]).map((item) => {
              const config = actionColors[item.action_type] || actionColors.edited;
              const Icon = config.icon;
              const isExpanded = expandedIds.has(item.id);
              const time = new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/20 transition-colors text-left"
                  >
                    <Icon size={14} className={config.color} />
                    <span className="text-xs text-foreground flex-1">{item.description}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
                    {item.metadata && (
                      isExpanded ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronRight size={12} className="text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && item.metadata && (
                    <div className="ml-8 mr-3 mb-2 p-2.5 bg-muted/10 rounded text-[11px] text-muted-foreground">
                      <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(item.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
