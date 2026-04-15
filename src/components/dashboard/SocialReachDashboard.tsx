import { useState, useMemo, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import RefreshIndicator from "@/components/dashboard/RefreshIndicator";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Users,
  MousePointerClick,
  Mail,
  ShoppingCart,
  Eye,
  BarChart3,
  Lightbulb,
  ExternalLink,
  Plus,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────── */

interface FunnelStage {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  prevPeriod: number;
}

interface PlatformData {
  name: string;
  icon: string;
  color: string;
  reach: number;
  profileVisits: number;
  ctr: number;
  emailSignups: number;
  revenue: number;
  active: boolean;
}

interface ContentRow {
  id: string;
  type: string;
  title: string;
  date: string;
  platform: string;
  reach: number;
  engRate: number;
  emailSignups: number;
  revenue: number;
  roiScore: number;
  caption?: string;
  mediaUrl?: string;
}

/* ── Mock Data ─────────────────────────────────── */

const FUNNEL_STAGES: FunnelStage[] = [
  { label: "Total Reach", value: 124300, icon: Eye, color: "hsl(var(--primary))", prevPeriod: 108200 },
  { label: "Profile Visits", value: 18640, icon: Users, color: "#0EA5E9", prevPeriod: 16100 },
  { label: "Site Clicks", value: 4280, icon: MousePointerClick, color: "#8B5CF6", prevPeriod: 3900 },
  { label: "Email Signups", value: 842, icon: Mail, color: "#F59E0B", prevPeriod: 710 },
  { label: "Purchases", value: 156, icon: ShoppingCart, color: "#B54165", prevPeriod: 134 },
];

const PLATFORMS: PlatformData[] = [
  { name: "Instagram", icon: "📸", color: "#E1306C", reach: 52400, profileVisits: 8200, ctr: 4.2, emailSignups: 340, revenue: 4200, active: true },
  { name: "TikTok", icon: "🎵", color: "#00F2EA", reach: 41200, profileVisits: 6100, ctr: 3.8, emailSignups: 280, revenue: 6800, active: true },
  { name: "Facebook", icon: "📘", color: "#1877F2", reach: 18700, profileVisits: 2800, ctr: 2.1, emailSignups: 142, revenue: 1800, active: true },
  { name: "Pinterest", icon: "📌", color: "#E60023", reach: 12000, profileVisits: 1540, ctr: 5.6, emailSignups: 80, revenue: 920, active: true },
];

const TREND_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  reach: 3500 + Math.floor(Math.random() * 2000),
  visits: 500 + Math.floor(Math.random() * 300),
  clicks: 100 + Math.floor(Math.random() * 80),
  signups: 20 + Math.floor(Math.random() * 15),
  purchases: 3 + Math.floor(Math.random() * 5),
}));

const CONTENT_DATA: ContentRow[] = [
  { id: "c1", type: "Reel", title: "Behind the scenes: Ginger Beer bottling day", date: "2026-04-12", platform: "Instagram", reach: 18400, engRate: 8.2, emailSignups: 64, revenue: 1420, roiScore: 92, caption: "Ever wonder how we bottle 2,000 units in a day? Here's the magic behind our ginger beer production…" },
  { id: "c2", type: "TikTok", title: "What $5 ingredients become a $24 product", date: "2026-04-10", platform: "TikTok", reach: 34200, engRate: 12.4, emailSignups: 128, revenue: 3200, roiScore: 97, caption: "The markup isn't the scam you think it is. Here's why…" },
  { id: "c3", type: "Carousel", title: "5 cocktail recipes using our ginger beer", date: "2026-04-08", platform: "Instagram", reach: 12800, engRate: 6.1, emailSignups: 42, revenue: 840, roiScore: 78 },
  { id: "c4", type: "Story", title: "Q&A: Your top shipping questions answered", date: "2026-04-07", platform: "Instagram", reach: 8400, engRate: 3.2, emailSignups: 12, revenue: 120, roiScore: 45 },
  { id: "c5", type: "YouTube", title: "Full factory tour — From recipe to retail", date: "2026-04-05", platform: "YouTube", reach: 6200, engRate: 9.8, emailSignups: 86, revenue: 1640, roiScore: 88 },
  { id: "c6", type: "Blog", title: "The story behind Top Hat Provisions", date: "2026-04-03", platform: "Website", reach: 2400, engRate: 14.2, emailSignups: 98, revenue: 2100, roiScore: 94 },
  { id: "c7", type: "Reel", title: "Packing orders at 6am — founder life", date: "2026-04-01", platform: "Instagram", reach: 22100, engRate: 7.6, emailSignups: 38, revenue: 680, roiScore: 62 },
];

const CONTENT_TYPE_SUMMARY = [
  { type: "Reels", reach: 40500, engRate: 7.9, revenue: 2100, reachPct: 33, revenuePct: 15 },
  { type: "TikTok", reach: 34200, engRate: 12.4, revenue: 9800, reachPct: 28, revenuePct: 70 },
  { type: "Carousel", reach: 12800, engRate: 6.1, revenue: 840, reachPct: 10, revenuePct: 6 },
  { type: "YouTube", reach: 6200, engRate: 9.8, revenue: 1640, reachPct: 5, revenuePct: 12 },
  { type: "Stories", reach: 8400, engRate: 3.2, revenue: 120, reachPct: 7, revenuePct: 1 },
  { type: "Blog", reach: 2400, engRate: 14.2, revenue: 2100, reachPct: 2, revenuePct: 15 },
];

/* ── Helpers ───────────────────────────────────── */

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function pctChange(curr: number, prev: number): { text: string; positive: boolean } {
  const pct = ((curr - prev) / prev * 100).toFixed(1);
  return { text: `${Number(pct) >= 0 ? "+" : ""}${pct}%`, positive: Number(pct) >= 0 };
}

/* ── Stat Tile ─────────────────────────────────── */

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-lg font-bold leading-tight", accent ? "text-[#B54165]" : "text-foreground")}>{value}</p>
      {sub && <p className={cn("text-[10px] mt-0.5", sub.startsWith("+") ? "text-[hsl(var(--success))]" : sub.startsWith("-") ? "text-destructive" : "text-muted-foreground")}>{sub}</p>}
    </div>
  );
}

/* ── Funnel Chart ──────────────────────────────── */

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const maxValue = stages[0].value;

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-1.5 py-4">
        {stages.map((stage, i) => {
          const widthPct = Math.max(20, (stage.value / maxValue) * 100);
          const dropPct = i > 0 ? ((1 - stage.value / stages[i - 1].value) * 100).toFixed(1) : null;
          const change = pctChange(stage.value, stage.prevPeriod);
          const Icon = stage.icon;

          return (
            <Tooltip key={stage.label}>
              <TooltipTrigger asChild>
                <div
                  className="relative rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:brightness-110"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: 200,
                    background: `linear-gradient(135deg, ${stage.color}, ${stage.color}88)`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-white/80" />
                    <span className="text-xs font-semibold text-white">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{fmt(stage.value)}</span>
                    {dropPct && (
                      <span className="text-[10px] text-white/60">↓{dropPct}%</span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs space-y-1">
                <p className="font-semibold">{stage.label}: {stage.value.toLocaleString()}</p>
                {dropPct && <p>Drop from previous: {dropPct}%</p>}
                <p className={change.positive ? "text-[hsl(var(--success))]" : "text-destructive"}>vs. last 30d: {change.text}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="text-center mt-2">
          <p className="text-[11px] text-muted-foreground">Overall Conversion</p>
          <p className="text-lg font-bold text-[#B54165]">{((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(2)}%</p>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ── Platform Card ─────────────────────────────── */

function PlatformCard({ p, best }: { p: PlatformData; best: boolean }) {
  return (
    <div className={cn("bg-card border rounded-lg p-3", best ? "border-primary/40 bg-primary/5" : "border-border")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{p.icon}</span>
          <span className="text-xs font-semibold text-foreground">{p.name}</span>
        </div>
        {best && <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30">Top Funnel</Badge>}
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between"><span className="text-muted-foreground">Reach</span><span className="text-foreground font-medium">{fmt(p.reach)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Profile Visits</span><span className="text-foreground font-medium">{fmt(p.profileVisits)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">CTR</span><span className="text-foreground font-medium">{p.ctr}%</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Email Signups</span><span className="text-foreground font-medium">{p.emailSignups}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="text-foreground font-medium">${fmt(p.revenue)}</span></div>
      </div>
    </div>
  );
}

/* ── Content ROI View ──────────────────────────── */

function ContentROIView() {
  const [sortKey, setSortKey] = useState<"reach" | "engRate" | "emailSignups" | "revenue">("revenue");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => [...CONTENT_DATA].sort((a, b) => b[sortKey] - a[sortKey]), [sortKey]);

  return (
    <div className="space-y-4">
      {/* Content Type Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Content Type Performance</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CONTENT_TYPE_SUMMARY} layout="vertical" margin={{ left: 60, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={55} />
              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="reach" name="Reach" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="revenue" name="Revenue $" fill="#B54165" radius={[0, 4, 4, 0]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Performance</h4>
          <div className="flex gap-1">
            {(["reach", "engRate", "emailSignups", "revenue"] as const).map((k) => (
              <Button key={k} size="sm" variant={sortKey === k ? "default" : "outline"} className="h-6 text-[10px] px-2" onClick={() => setSortKey(k)}>
                {k === "engRate" ? "Eng %" : k === "emailSignups" ? "Signups" : k.charAt(0).toUpperCase() + k.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y divide-border">
            {sorted.map((c) => (
              <div key={c.id}>
                <button
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">{c.type}</Badge>
                    <span className="text-xs font-medium text-foreground truncate flex-1">{c.title}</span>
                    <div className="flex items-center gap-4 shrink-0 text-[11px]">
                      <span className="text-muted-foreground w-12 text-right">{fmt(c.reach)}</span>
                      <span className="text-muted-foreground w-10 text-right">{c.engRate}%</span>
                      <span className="text-muted-foreground w-8 text-right">{c.emailSignups}</span>
                      <span className="text-foreground font-medium w-14 text-right">${fmt(c.revenue)}</span>
                      <div className="w-10">
                        <Badge className={cn("text-[9px] px-1 py-0", c.roiScore >= 80 ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" : c.roiScore >= 50 ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]" : "bg-muted text-muted-foreground")}>{c.roiScore}</Badge>
                      </div>
                    </div>
                  </div>
                </button>
                {expandedId === c.id && (
                  <div className="px-4 pb-3 pt-1 bg-background/50 border-t border-border space-y-2">
                    {c.caption && <p className="text-xs text-muted-foreground italic">"{c.caption}"</p>}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{c.platform}</span><span>·</span><span>{c.date}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1"><ExternalLink size={10} /> View on {c.platform}</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1"><Plus size={10} /> Use Format Again</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Opportunity Gaps */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-[hsl(var(--warning))]" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content Opportunity Gaps</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/20 rounded-lg p-3">
            <Sparkles size={14} className="text-[hsl(var(--success))] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Increase TikTok production</p>
              <p className="text-[11px] text-muted-foreground">High ROI ({CONTENT_TYPE_SUMMARY[1].revenuePct}% of revenue from {CONTENT_TYPE_SUMMARY[1].reachPct}% of reach)</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20 rounded-lg p-3">
            <Sparkles size={14} className="text-[hsl(var(--warning))] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Optimize Reel CTAs</p>
              <p className="text-[11px] text-muted-foreground">High reach ({CONTENT_TYPE_SUMMARY[0].reachPct}%) but only {CONTENT_TYPE_SUMMARY[0].revenuePct}% of revenue — add stronger calls-to-action</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Scale Blog content</p>
              <p className="text-[11px] text-muted-foreground">Highest engagement rate (14.2%) and strong revenue per view — produce more SEO-driven articles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────── */

export default function SocialReachDashboard() {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"funnel" | "roi">("funnel");

  const bestPlatformIdx = PLATFORMS.reduce((best, p, i) => (p.revenue / p.reach > PLATFORMS[best].revenue / PLATFORMS[best].reach ? i : best), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
          <TrendingUp size={16} className="text-[hsl(var(--success))]" />
          <h2 className="text-sm font-semibold text-foreground">Social Reach</h2>
          <Badge variant="secondary" className="text-[10px]">12.4K reach</Badge>
        </button>
        <RefreshIndicator agoLabel={socialRefresh.agoLabel} isRefreshing={socialRefresh.isRefreshing} onRefresh={socialRefresh.refresh} intervalLabel="2 min" />
      </div>

      {expanded && (
        <>
          {/* Stat Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatTile label="30D Reach" value="124.3K" sub="+14.9%" />
            <StatTile label="Follower Growth" value="+2,840" sub="+8.2%" />
            <StatTile label="Avg Eng Rate" value="7.4%" sub="+1.2%" />
            <StatTile label="Social → Email" value="842" sub="+18.6%" />
            <StatTile label="Social → Revenue" value="$13,720" sub="+22%" accent />
            <StatTile label="Best Content" value="TikTok" sub="97 ROI score" />
          </div>

          {/* Tab Toggle */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="funnel" className="gap-1.5"><Users size={12} /> Audience Funnel</TabsTrigger>
              <TabsTrigger value="roi" className="gap-1.5"><BarChart3 size={12} /> Content ROI</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "funnel" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,2fr)_1fr] gap-3">
              {/* LEFT: Platform Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Platform Breakdown</h4>
                {PLATFORMS.filter((p) => p.active).map((p, i) => (
                  <PlatformCard key={p.name} p={p} best={i === bestPlatformIdx} />
                ))}
              </div>

              {/* CENTER: Funnel */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Audience Funnel (30 Days)</h4>
                <FunnelChart stages={FUNNEL_STAGES} />
              </div>

              {/* RIGHT: Trend */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">30-Day Trend</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={TREND_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={6} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
                      <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="Reach" />
                      <Line type="monotone" dataKey="visits" stroke="#0EA5E9" strokeWidth={1.5} dot={false} name="Visits" />
                      <Line type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="Clicks" />
                      <Line type="monotone" dataKey="signups" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Signups" />
                      <Line type="monotone" dataKey="purchases" stroke="#B54165" strokeWidth={1.5} dot={false} name="Purchases" />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "roi" && <ContentROIView />}
        </>
      )}
    </div>
  );
}
