import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart2, TrendingUp, Phone, Mail, Calendar, Video, MessageCircle,
  CheckSquare, FileText, Sparkles, ArrowRight,
} from "lucide-react";
import { useCrm, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type Range = "7d" | "30d" | "90d" | "year" | "all";
const ALL = "__all__";

const RANGES: { v: Range; l: string }[] = [
  { v: "7d", l: "Last 7 days" },
  { v: "30d", l: "Last 30 days" },
  { v: "90d", l: "Last 90 days" },
  { v: "year", l: "This year" },
  { v: "all", l: "All time" },
];

const ACTIVITY_ICONS: Record<string, { icon: typeof Phone; className: string }> = {
  call: { icon: Phone, className: "text-blue-500 bg-blue-500/10" },
  "email sent": { icon: Mail, className: "text-emerald-500 bg-emerald-500/10" },
  "email received": { icon: Mail, className: "text-emerald-500 bg-emerald-500/10" },
  meeting: { icon: Calendar, className: "text-purple-500 bg-purple-500/10" },
  demo: { icon: Video, className: "text-amber-500 bg-amber-500/10" },
  "follow-up": { icon: CheckSquare, className: "text-primary bg-primary/10" },
  note: { icon: FileText, className: "text-muted-foreground bg-muted" },
  other: { icon: Sparkles, className: "text-muted-foreground bg-muted" },
};

function getActivityMeta(type: string) {
  const k = type.toLowerCase();
  return ACTIVITY_ICONS[k] || ACTIVITY_ICONS.other;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function pipelineHex(color: string) {
  return PIPELINE_COLORS.find((c) => c.key === color)?.hex || "hsl(var(--primary))";
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { contacts, activities, pipelines, companies, setSelectedContactId, loading } = useCrm();
  const [pipelineFilter, setPipelineFilter] = useState<string>(ALL);
  const [range, setRange] = useState<Range>("30d");

  const startDate = useMemo(() => {
    const now = new Date();
    if (range === "7d") return new Date(now.getTime() - 7 * 86400000);
    if (range === "30d") return new Date(now.getTime() - 30 * 86400000);
    if (range === "90d") return new Date(now.getTime() - 90 * 86400000);
    if (range === "year") return new Date(now.getFullYear(), 0, 1);
    return new Date(0);
  }, [range]);

  const previousStart = useMemo(() => {
    const span = Date.now() - startDate.getTime();
    return new Date(startDate.getTime() - span);
  }, [startDate]);

  // Filter contacts by pipeline
  const pipelineContacts = useMemo(() => {
    return contacts.filter((c) => pipelineFilter === ALL || c.pipeline_id === pipelineFilter);
  }, [contacts, pipelineFilter]);

  // Contacts created within the range
  const rangeContacts = useMemo(() => {
    return pipelineContacts.filter((c) => new Date(c.created_at) >= startDate);
  }, [pipelineContacts, startDate]);

  const previousContacts = useMemo(() => {
    return pipelineContacts.filter((c) => {
      const d = new Date(c.created_at);
      return d >= previousStart && d < startDate;
    });
  }, [pipelineContacts, previousStart, startDate]);

  const isWon = (stage: string) => stage.toLowerCase().includes("won");
  const isLost = (stage: string) => stage.toLowerCase().includes("lost");

  const wonContacts = pipelineContacts.filter((c) => isWon(c.stage));
  const totalValue = pipelineContacts.reduce((s, c) => s + (c.value || 0), 0);
  const wonValue = wonContacts.reduce((s, c) => s + (c.value || 0), 0);

  const trendDelta = rangeContacts.length - previousContacts.length;

  // Pipeline funnel data
  const funnelPipelines = useMemo(() => {
    const list = pipelineFilter === ALL ? pipelines : pipelines.filter((p) => p.id === pipelineFilter);
    return list.map((p) => {
      const pContacts = pipelineContacts.filter((c) => c.pipeline_id === p.id);
      const total = pContacts.length;
      const stages = p.stages.map((stage, idx) => {
        const count = pContacts.filter((c) => c.stage === stage).length;
        const prevCount = idx > 0 ? pContacts.filter((c) => c.stage === p.stages[idx - 1]).length : null;
        const conversion = prevCount && prevCount > 0 ? Math.round((count / prevCount) * 100) : null;
        return { stage, count, conversion, prev: idx > 0 ? p.stages[idx - 1] : null };
      });
      return { pipeline: p, total, stages };
    });
  }, [pipelines, pipelineContacts, pipelineFilter]);

  // Activities filtered by pipeline + range
  const filteredActivities = useMemo(() => {
    const contactIds = new Set(pipelineContacts.map((c) => c.id));
    return activities.filter((a) => {
      if (a.contact_id && !contactIds.has(a.contact_id)) return false;
      return new Date(a.created_at) >= startDate;
    });
  }, [activities, pipelineContacts, startDate]);

  const activityByType = useMemo(() => {
    const map = new Map<string, number>();
    filteredActivities.forEach((a) => {
      const k = a.type.toLowerCase();
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredActivities]);

  const maxActivityCount = activityByType[0]?.count || 1;

  // Activity over time (daily)
  const activityOverTime = useMemo(() => {
    const days: Record<string, number> = {};
    const dayMs = 86400000;
    const start = startDate.getTime();
    const end = Date.now();
    // Bucket size: daily for <=90d, weekly otherwise
    const useWeek = range === "year" || range === "all";
    const bucketMs = useWeek ? 7 * dayMs : dayMs;
    for (let t = start; t <= end; t += bucketMs) {
      const key = new Date(t).toISOString().slice(0, 10);
      days[key] = 0;
    }
    filteredActivities.forEach((a) => {
      const d = new Date(a.created_at);
      if (useWeek) {
        const week = new Date(d);
        week.setDate(d.getDate() - d.getDay());
        const key = week.toISOString().slice(0, 10);
        if (key in days) days[key]++;
      } else {
        const key = d.toISOString().slice(0, 10);
        if (key in days) days[key]++;
      }
    });
    return Object.entries(days).map(([date, count]) => ({
      date: useWeek
        ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    }));
  }, [filteredActivities, startDate, range]);

  const topContacts = useMemo(() => {
    return [...pipelineContacts]
      .filter((c) => (c.value || 0) > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 10);
  }, [pipelineContacts]);

  const recentActivity = useMemo(() => filteredActivities.slice(0, 20), [filteredActivities]);

  const lastActivityFor = (contactId: string) => {
    return activities.find((a) => a.contact_id === contactId);
  };

  // Empty state
  if (!loading && contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart2 size={48} className="text-primary/30 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No data yet</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Add contacts to your pipeline to start tracking performance.
        </p>
        <button
          onClick={() => navigate("/sales/pipeline")}
          className="mt-6 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 flex items-center gap-1.5"
        >
          Go to Pipeline <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-foreground">Pipeline Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your pipeline performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value={ALL}>All Pipelines</option>
            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            {RANGES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </div>
      </div>

      {/* SECTION 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="total leads"
          value={pipelineContacts.length}
          trend={
            trendDelta !== 0
              ? { value: trendDelta, label: `${trendDelta > 0 ? "+" : ""}${trendDelta} this period` }
              : null
          }
          title="Total contacts"
        />
        <KpiCard
          label="deals closed"
          value={wonContacts.length}
          title="Won deals"
          accent="emerald"
        />
        <KpiCard
          label="pipeline value"
          value={formatCurrency(totalValue)}
          title="Pipeline value"
        />
        <KpiCard
          label="closed revenue"
          value={formatCurrency(wonValue)}
          title="Won revenue"
          accent="emerald"
        />
      </div>

      {/* SECTION 2 — Funnel */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Stage Breakdown</h2>
        {funnelPipelines.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground">No pipelines yet. Create one to see the breakdown.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {funnelPipelines.map(({ pipeline, total, stages }) => (
              <div key={pipeline.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: pipelineHex(pipeline.color) }}
                  />
                  <h3 className="text-sm font-semibold text-foreground">{pipeline.name}</h3>
                  <span className="text-[11px] text-muted-foreground ml-auto">{total} contacts</span>
                </div>

                <div className="space-y-3">
                  {stages.map((s, i) => {
                    const pct = total > 0 ? (s.count / total) * 100 : 0;
                    const won = isWon(s.stage);
                    const lost = isLost(s.stage);
                    const lightness = 50 + i * 4;
                    const barStyle = won
                      ? { background: "hsl(142 71% 45%)" }
                      : lost
                      ? { background: "hsl(var(--muted-foreground) / 0.3)" }
                      : { background: pipelineHex(pipeline.color), opacity: 1 - i * 0.08 };
                    return (
                      <div key={s.stage}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-foreground">{s.stage}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {s.count} · {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-7 bg-muted/40 rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md transition-all"
                            style={{ width: `${Math.max(pct, total > 0 && s.count > 0 ? 2 : 0)}%`, ...barStyle }}
                          />
                        </div>
                        {s.conversion !== null && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            ↓ {s.conversion}% from {s.prev}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3 — Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity by type */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Activity by Type</h3>
          {activityByType.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No activity in this period.</p>
          ) : (
            <div className="space-y-3">
              {activityByType.map((a) => {
                const meta = getActivityMeta(a.type);
                const Icon = meta.icon;
                const pct = (a.count / maxActivityCount) * 100;
                return (
                  <div key={a.type} className="flex items-center gap-3">
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", meta.className)}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground capitalize">{a.type}</span>
                        <span className="text-muted-foreground tabular-nums">{a.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity over time */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Activity volume</h3>
          {filteredActivities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No activity in this period.</p>
          ) : (
            <div className="h-[200px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4 — Top contacts */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Contacts by deal value</h3>
          <Link to="/sales/contacts" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {topContacts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No contacts with deal value yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Name</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Company</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Pipeline</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Stage</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Deal Value</th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2 px-2">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {topContacts.map((c) => {
                  const company = c.company_id ? companies.find((co) => co.id === c.company_id) : null;
                  const pipeline = c.pipeline_id ? pipelines.find((p) => p.id === c.pipeline_id) : null;
                  const last = lastActivityFor(c.id);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-2">
                        <p className="text-xs font-semibold text-foreground">{c.name}</p>
                        {c.title && <p className="text-[10px] text-muted-foreground">{c.title}</p>}
                      </td>
                      <td className="py-2.5 px-2 text-[11px] text-muted-foreground">{company?.name || "—"}</td>
                      <td className="py-2.5 px-2 text-[11px] text-muted-foreground">
                        {pipeline ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pipelineHex(pipeline.color) }} />
                            {pipeline.name}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={cn(
                          "text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider",
                          isWon(c.stage) && "bg-emerald-500/15 text-emerald-500",
                          isLost(c.stage) && "bg-rose-500/15 text-rose-500",
                          !isWon(c.stage) && !isLost(c.stage) && "bg-muted text-muted-foreground"
                        )}>
                          {c.stage || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-xs font-semibold text-warning tabular-nums">
                        {formatCurrency(c.value || 0)}
                      </td>
                      <td className="py-2.5 px-2 text-[11px] text-muted-foreground">
                        {last ? relativeTime(last.created_at) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 5 — Recent activity */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
          <Link to="/sales/contacts" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No recent activity in this period.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((a) => {
              const contact = a.contact_id ? contacts.find((c) => c.id === a.contact_id) : null;
              const meta = getActivityMeta(a.type);
              const Icon = meta.icon;
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5", meta.className)}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {contact ? (
                        <button
                          onClick={() => setSelectedContactId(contact.id)}
                          className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {contact.name}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">Unknown contact</span>
                      )}
                      <span className="text-[11px] text-muted-foreground capitalize">· {a.type}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{relativeTime(a.created_at)}</span>
                    </div>
                    {a.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  title, label, value, trend, accent,
}: {
  title: string;
  label: string;
  value: number | string;
  trend?: { value: number; label: string } | null;
  accent?: "emerald";
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <p className={cn(
        "text-2xl font-bold mt-1 tabular-nums",
        accent === "emerald" ? "text-emerald-500" : "text-foreground"
      )}>
        {value}
      </p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {trend && (
          <span className={cn(
            "text-[10px] font-medium ml-auto inline-flex items-center gap-0.5",
            trend.value > 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            <TrendingUp size={10} className={trend.value < 0 ? "rotate-180" : ""} />
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
