import { useState, useMemo, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import RefreshIndicator from "@/components/dashboard/RefreshIndicator";
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Calculator,
  ExternalLink,
  AlertTriangle,
  Download,
  Target,
  ArrowLeft,
  BarChart3,
  FileText,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────── */

interface ChannelData {
  name: string;
  icon: React.ElementType;
  color: string;
  revenueMTD: number;
  vsLastMonth: number;
  link: string;
  metrics: { label: string; value: string }[];
  dailyTrend: { day: string; revenue: number }[];
  topSKUs: { sku: string; units: number; revenue: number; margin: number }[];
  extra?: { label: string; value: string }[];
  invoiceData?: { name: string; value: number; color: string }[];
}

/* ── Mock Data ─────────────────────────────────── */

const genDailyTrend = (base: number, variance: number) =>
  Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    revenue: base + Math.floor(Math.random() * variance - variance / 2),
  }));

const CHANNELS: ChannelData[] = [
  {
    name: "Shopify",
    icon: ShoppingCart,
    color: "#96BF48",
    revenueMTD: 18420,
    vsLastMonth: 15,
    link: "https://admin.shopify.com/store/top-hat-provisions",
    metrics: [
      { label: "Orders", value: "342" },
      { label: "AOV", value: "$53.86" },
      { label: "Conv Rate", value: "3.2%" },
      { label: "Traffic", value: "10.7K" },
    ],
    dailyTrend: genDailyTrend(600, 200),
    topSKUs: [
      { sku: "Ginger Beer 4-Pack", units: 128, revenue: 5120, margin: 62 },
      { sku: "Variety Box (12)", units: 64, revenue: 4480, margin: 58 },
      { sku: "Spicy Ginger Syrup", units: 96, revenue: 2880, margin: 71 },
      { sku: "Gift Set Premium", units: 42, revenue: 2940, margin: 55 },
      { sku: "Mixer Bundle", units: 38, revenue: 1900, margin: 64 },
    ],
    extra: [
      { label: "Discount Orders", value: "28%" },
      { label: "Avg Discount Depth", value: "12%" },
    ],
  },
  {
    name: "Amazon",
    icon: Package,
    color: "#FF9900",
    revenueMTD: 12840,
    vsLastMonth: 8,
    link: "https://sellercentral.amazon.com/home",
    metrics: [
      { label: "Orders", value: "218" },
      { label: "ACOS", value: "22%" },
      { label: "BSR", value: "#1,842" },
      { label: "Fees", value: "$3,210" },
    ],
    dailyTrend: genDailyTrend(420, 150),
    topSKUs: [
      { sku: "Ginger Beer 4-Pack", units: 94, revenue: 3760, margin: 38 },
      { sku: "Ginger Beer 12-Pack", units: 48, revenue: 3360, margin: 34 },
      { sku: "Spicy Ginger Syrup", units: 62, revenue: 1860, margin: 42 },
      { sku: "Classic Tonic Water", units: 44, revenue: 1320, margin: 36 },
      { sku: "Mixer Sample Pack", units: 36, revenue: 1080, margin: 40 },
    ],
    extra: [
      { label: "Ad Spend", value: "$2,825" },
      { label: "Ad Revenue", value: "$8,420" },
    ],
  },
  {
    name: "QuickBooks",
    icon: Calculator,
    color: "#2CA01C",
    revenueMTD: 8600,
    vsLastMonth: 22,
    link: "https://qbo.intuit.com/app/get-things-done",
    metrics: [
      { label: "Invoices", value: "14" },
      { label: "Avg Invoice", value: "$614" },
      { label: "Collection", value: "91%" },
      { label: "Days Out", value: "18" },
    ],
    dailyTrend: genDailyTrend(280, 180),
    topSKUs: [
      { sku: "Barrel & Oak Wholesale", units: 200, revenue: 3200, margin: 42 },
      { sku: "Farmers Market Events", units: 1, revenue: 1800, margin: 68 },
      { sku: "Restaurant Supply Co.", units: 120, revenue: 1440, margin: 38 },
      { sku: "Consulting (Beverage)", units: 1, revenue: 1200, margin: 92 },
      { sku: "Local Grocery Chain", units: 80, revenue: 960, margin: 44 },
    ],
    invoiceData: [
      { name: "Paid", value: 10, color: "hsl(var(--success))" },
      { name: "Pending", value: 3, color: "hsl(var(--warning))" },
      { name: "Overdue", value: 1, color: "hsl(var(--destructive))" },
    ],
    extra: [
      { label: "Recognized Rev", value: "$7,200" },
      { label: "Unrecognized", value: "$1,400" },
    ],
  },
];

const REVENUE_MIX = CHANNELS.map((c) => ({
  name: c.name,
  value: c.revenueMTD,
  color: c.color,
}));

const MARGIN_DATA = [
  { channel: "Shopify", margin: 62 },
  { channel: "Amazon", margin: 38 },
  { channel: "QuickBooks", margin: 52 },
];

const TOP_SKUS_ALL = [
  { sku: "Ginger Beer 4-Pack", shopify: 5120, amazon: 3760, qb: 0, total: 8880, margin: 48 },
  { sku: "Variety Box (12)", shopify: 4480, amazon: 0, qb: 0, total: 4480, margin: 58 },
  { sku: "Ginger Beer 12-Pack", shopify: 0, amazon: 3360, qb: 0, total: 3360, margin: 34 },
  { sku: "Barrel & Oak Wholesale", shopify: 0, amazon: 0, qb: 3200, total: 3200, margin: 42 },
  { sku: "Gift Set Premium", shopify: 2940, amazon: 0, qb: 0, total: 2940, margin: 55 },
  { sku: "Spicy Ginger Syrup", shopify: 2880, amazon: 1860, qb: 0, total: 4740, margin: 58 },
  { sku: "Farmers Market Events", shopify: 0, amazon: 0, qb: 1800, total: 1800, margin: 68 },
  { sku: "Mixer Bundle", shopify: 1900, amazon: 0, qb: 0, total: 1900, margin: 64 },
  { sku: "Restaurant Supply Co.", shopify: 0, amazon: 0, qb: 1440, total: 1440, margin: 38 },
  { sku: "Classic Tonic Water", shopify: 0, amazon: 1320, qb: 0, total: 1320, margin: 36 },
];

const ALERTS = [
  { severity: "high", text: "Amazon ACOS trending up — 22% this week vs 18% target", action: "Review Ads" },
  { severity: "medium", text: "Classic Tonic Water sales declining 15% WoW", action: "View SKU" },
  { severity: "low", text: "Mixer Sample Pack inventory < 50 units", action: "Reorder" },
];

const MONTHLY_TARGET = 48000;
const TOTAL_MTD = CHANNELS.reduce((s, c) => s + c.revenueMTD, 0);
const DAY_OF_MONTH = 15;
const PACE_PCT = (TOTAL_MTD / MONTHLY_TARGET) * 100;

/* ── Helpers ───────────────────────────────────── */

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
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

/* ── Channel Card ──────────────────────────────── */

function ChannelCard({ ch, onDrill }: { ch: ChannelData; onDrill: () => void }) {
  const Icon = ch.icon;
  const changePositive = ch.vsLastMonth >= 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${ch.color}22` }}>
              <Icon size={16} style={{ color: ch.color }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{ch.name} Revenue</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-foreground">{fmt(ch.revenueMTD)}</span>
                <span className="text-[10px]">MTD</span>
                <span className={cn("text-[10px] font-medium", changePositive ? "text-[hsl(var(--success))]" : "text-destructive")}>
                  {changePositive ? "↑" : "↓"}{Math.abs(ch.vsLastMonth)}% vs LM
                </span>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => window.open(ch.link, "_blank")}>
            <ExternalLink size={10} /> Open
          </Button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-2">
          {ch.metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className="text-xs font-semibold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-3 h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          {ch.invoiceData ? (
            <PieChart>
              <Pie data={ch.invoiceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} innerRadius={20}>
                {ch.invoiceData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          ) : (
            <LineChart data={ch.dailyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={6} />
              <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} />
              <Line type="monotone" dataKey="revenue" stroke={ch.color} strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Top SKUs */}
      <div className="border-t border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">Top SKUs</p>
        <div className="divide-y divide-border">
          {ch.topSKUs.slice(0, 5).map((s) => (
            <div key={s.sku} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
              <span className="text-foreground truncate flex-1">{s.sku}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-muted-foreground">{s.units}u</span>
                <span className="text-foreground font-medium w-14 text-right">{fmt(s.revenue)}</span>
                <span className={cn("w-8 text-right", s.margin >= 50 ? "text-[hsl(var(--success))]" : s.margin >= 35 ? "text-[hsl(var(--warning))]" : "text-destructive")}>{s.margin}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extra Metrics */}
      {ch.extra && (
        <div className="border-t border-border px-3 py-2 grid grid-cols-2 gap-2">
          {ch.extra.map((e) => (
            <div key={e.label} className="text-[11px]">
              <span className="text-muted-foreground">{e.label}: </span>
              <span className="text-foreground font-medium">{e.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border p-2">
        <Button size="sm" variant="ghost" className="w-full h-7 text-[10px] text-primary" onClick={onDrill}>View Full Detail</Button>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────── */

export default function RevenueDashboard() {
  const [expanded, setExpanded] = useState(true);
  const [drillChannel, setDrillChannel] = useState<string | null>(null);
  const revenueRefresh = useAutoRefresh({ intervalMs: 5 * 60 * 1000 });

  const totalRevenue = CHANNELS.reduce((s, c) => s + c.revenueMTD, 0);
  const grossMargin = 51;
  const netMargin = 28;

  const drillData = drillChannel ? CHANNELS.find((c) => c.name === drillChannel) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
          <DollarSign size={16} className="text-[hsl(var(--success))]" />
          <h2 className="text-sm font-semibold text-foreground">Revenue Overview</h2>
          <Badge variant="secondary" className="text-[10px]">{fmt(totalRevenue)} MTD</Badge>
        </button>
        <RefreshIndicator agoLabel={revenueRefresh.agoLabel} isRefreshing={revenueRefresh.isRefreshing} onRefresh={revenueRefresh.refresh} intervalLabel="5 min" />
      </div>

      {expanded && (
        <>
          {/* Stat Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <StatTile label="Revenue MTD" value={fmt(totalRevenue)} sub="+14%" />
            <StatTile label="vs Last Month" value="+14%" sub="+$4,860" />
            <StatTile label="vs Last Year" value="+32%" sub="+$9,420" />
            <StatTile label="Gross Margin" value={`${grossMargin}%`} sub="+2pp" />
            <StatTile label="Net Margin" value={`${netMargin}%`} sub="+1pp" />
            <StatTile label="Ad Spend %" value="7.1%" sub="-0.8pp" />
            <StatTile label="Refund Rate" value="1.2%" sub="-0.3pp" />
            <StatTile label="AOV" value="$48.20" sub="+$3.40" />
          </div>

          {/* Drill view */}
          {drillData ? (
            <div className="space-y-3">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDrillChannel(null)}>
                <ArrowLeft size={12} /> Back to Overview
              </Button>
              <div className="max-w-2xl">
                <ChannelCard ch={drillData} onDrill={() => {}} />
              </div>
            </div>
          ) : (
            <>
              {/* 3 Channel Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {CHANNELS.map((ch) => (
                  <ChannelCard key={ch.name} ch={ch} onDrill={() => setDrillChannel(ch.name)} />
                ))}
              </div>

              {/* Consolidated Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px] gap-3">
                {/* Revenue Mix */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue by Channel</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={REVENUE_MIX} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2}>
                          {REVENUE_MIX.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} formatter={(v: number) => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-2">
                    {REVENUE_MIX.map((r) => (
                      <div key={r.name} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                          <span className="text-foreground">{r.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{((r.value / totalRevenue) * 100).toFixed(0)}%</span>
                          <span className="font-medium text-foreground">{fmt(r.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Margin Analysis */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Margin by Channel</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MARGIN_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="channel" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }} formatter={(v: number) => `${v}%`} />
                        <Bar dataKey="margin" name="Gross Margin %">
                          {MARGIN_DATA.map((entry, i) => (
                            <Cell key={i} fill={CHANNELS[i].color} radius={[4, 4, 0, 0] as any} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Shopify leads margin at 62% — Amazon lowest due to marketplace fees + ACOS
                  </p>
                </div>

                {/* Alerts & Actions */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alerts</h4>
                    <div className="space-y-1.5">
                      {ALERTS.map((a, i) => (
                        <div key={i} className={cn("flex items-start gap-2 rounded-lg p-2 border text-[11px]",
                          a.severity === "high" ? "bg-destructive/5 border-destructive/20" : a.severity === "medium" ? "bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/20" : "bg-muted/50 border-border"
                        )}>
                          <AlertTriangle size={12} className={cn("mt-0.5 shrink-0", a.severity === "high" ? "text-destructive" : a.severity === "medium" ? "text-[hsl(var(--warning))]" : "text-muted-foreground")} />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground">{a.text}</p>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[10px] text-primary">{a.action}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</h4>
                    <div className="space-y-1">
                      <Button size="sm" variant="outline" className="w-full justify-start gap-1.5 h-7 text-[10px]"><FileText size={10} /> View P&L Summary</Button>
                      <Button size="sm" variant="outline" className="w-full justify-start gap-1.5 h-7 text-[10px]"><Zap size={10} /> Run Forecast (90d)</Button>
                      <Button size="sm" variant="outline" className="w-full justify-start gap-1.5 h-7 text-[10px]" onClick={() => toast.success("Revenue report exported")}><Download size={10} /> Export Report</Button>
                      <Button size="sm" variant="outline" className="w-full justify-start gap-1.5 h-7 text-[10px]"><Target size={10} /> Set Monthly Goal</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Pacing */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Pacing</h4>
                  <span className="text-[11px] text-muted-foreground">Day {DAY_OF_MONTH}/30 · Target: {fmt(MONTHLY_TARGET)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={PACE_PCT} className="h-3 flex-1" />
                  <span className={cn("text-sm font-bold", PACE_PCT >= 45 ? "text-[hsl(var(--success))]" : PACE_PCT >= 35 ? "text-[hsl(var(--warning))]" : "text-destructive")}>
                    {PACE_PCT.toFixed(0)}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {fmt(TOTAL_MTD)} of {fmt(MONTHLY_TARGET)} · {PACE_PCT >= 45 ? "On pace ✓" : "Slightly behind target"}
                </p>
              </div>

              {/* Top SKUs Across Channels */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-3 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top SKUs Across All Channels</h4>
                </div>
                <ScrollArea className="max-h-[350px]">
                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-[1fr_70px_70px_70px_80px_50px] px-3 py-1.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>SKU</span><span className="text-right">Shopify</span><span className="text-right">Amazon</span><span className="text-right">QB</span><span className="text-right">Total</span><span className="text-right">Margin</span>
                    </div>
                    {TOP_SKUS_ALL.sort((a, b) => b.total - a.total).map((s) => (
                      <div key={s.sku} className="grid grid-cols-[1fr_70px_70px_70px_80px_50px] px-3 py-2 text-[11px] hover:bg-accent/5">
                        <span className="text-foreground truncate">{s.sku}</span>
                        <span className="text-right text-muted-foreground">{s.shopify ? fmt(s.shopify) : "—"}</span>
                        <span className="text-right text-muted-foreground">{s.amazon ? fmt(s.amazon) : "—"}</span>
                        <span className="text-right text-muted-foreground">{s.qb ? fmt(s.qb) : "—"}</span>
                        <span className="text-right font-medium text-foreground">{fmt(s.total)}</span>
                        <span className={cn("text-right", s.margin >= 50 ? "text-[hsl(var(--success))]" : s.margin >= 35 ? "text-[hsl(var(--warning))]" : "text-destructive")}>{s.margin}%</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
