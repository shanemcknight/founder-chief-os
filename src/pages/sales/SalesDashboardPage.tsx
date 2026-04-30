import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LayoutGrid, UserPlus, Search, ListChecks, Clock, Activity as ActivityIcon } from "lucide-react";
import { useCrm, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";
import PipelineSelector from "@/components/sales/PipelineSelector";
import AddContactDialog from "@/components/sales/AddContactDialog";

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function colorDot(color: string) {
  return PIPELINE_COLORS.find((c) => c.key === color)?.className || "bg-primary";
}

const ALL = "__all__";

export default function SalesDashboardPage() {
  const navigate = useNavigate();
  const { contacts, activities, tasks, loading, setSelectedContactId, pipelines, activePipelineId } = useCrm();
  const [addOpen, setAddOpen] = useState(false);

  const viewPipeline = useMemo(
    () => pipelines.find((p) => p.id === activePipelineId) || null,
    [pipelines, activePipelineId]
  );

  const stageSummary = useMemo(() => {
    const filtered = viewPipeline
      ? contacts.filter((c) => c.pipeline_id === viewPipeline.id)
      : contacts;
    const stages = viewPipeline ? viewPipeline.stages.slice(0, 4) : [];
    return stages.map((stage) => {
      const items = filtered.filter((c) => c.stage === stage);
      const total = items.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
      return { key: stage, label: stage.toUpperCase(), count: items.length, total };
    });
  }, [contacts, viewPipeline]);

  const tasksToday = useMemo(
    () => tasks.filter((t) => !t.completed && isToday(t.due_date)).slice(0, 5),
    [tasks]
  );

  const recentActivities = useMemo(() => activities.slice(0, 6), [activities]);

  const topContacts = useMemo(
    () => {
      const base = viewPipeline ? contacts.filter((c) => c.pipeline_id === viewPipeline.id) : contacts;
      return [...base]
        .filter((c) => {
          const lower = (c.stage || "").toLowerCase();
          return lower !== "won" && lower !== "lost";
        })
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
        .slice(0, 5);
    },
    [contacts, viewPipeline]
  );

  const quickActions = [
    { title: "View Pipeline", desc: "See contacts across all stages", icon: LayoutGrid, onClick: () => navigate("/sales/pipeline") },
    { title: "Add Contact", desc: "Create a new sales contact", icon: UserPlus, onClick: () => {
      if (pipelines.length === 0) navigate("/sales/pipeline");
      else setAddOpen(true);
    } },
    { title: "Find Prospects", desc: "Scrape real websites for fresh leads", icon: Search, onClick: () => navigate("/sales/prospects") },
    { title: "View Tasks", desc: "Follow-ups and reminders", icon: ListChecks, onClick: () => navigate("/sales/tasks") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Sales</h1>
        <p className="text-sm text-muted-foreground">Your pipeline at a glance.</p>
      </div>

      {/* Unified pipeline selector */}
      <PipelineSelector />

      {/* Pipeline stage summary */}
      {pipelines.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-xs text-muted-foreground mb-3">No pipelines yet — create one to start tracking leads.</p>
          <Link
            to="/sales/pipeline"
            className="inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Create Pipeline <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stageSummary.length === 0 && (
            <div className="col-span-full text-xs text-muted-foreground">This pipeline has no stages.</div>
          )}
          {stageSummary.map((s) => (
            <Link
              key={s.key}
              to={viewPipeline ? `/sales/pipeline?pipeline=${viewPipeline.id}` : "/sales/pipeline"}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{s.count}</p>
              <p className="text-[11px] text-warning font-medium mt-1">
                {s.total > 0 ? `$${s.total.toLocaleString()}/mo` : "—"}
              </p>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                View <ArrowRight size={10} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.title}
                onClick={a.onClick}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors text-left group"
              >
                <Icon size={16} className="text-primary mb-2" />
                <p className="text-xs font-semibold text-foreground">{a.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  Open <ArrowRight size={10} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom 3-column row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Due Today</h3>
            <Link to="/sales/tasks" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
              All tasks <ArrowRight size={10} />
            </Link>
          </div>
          {loading ? (
            <p className="text-[11px] text-muted-foreground">Loading...</p>
          ) : tasksToday.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Nothing due today.</p>
          ) : (
            <ul className="space-y-2">
              {tasksToday.map((t) => {
                const contact = contacts.find((c) => c.id === t.contact_id);
                return (
                  <li key={t.id} className="flex items-start gap-2 text-[11px]">
                    <Clock size={11} className="text-warning mt-0.5 shrink-0" />
                    <button onClick={() => navigate("/sales/tasks")} className="text-left flex-1 text-foreground hover:text-primary transition-colors">
                      <span className="font-medium">{t.title}</span>
                      {contact && <span className="text-muted-foreground"> — {contact.name}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Activity</h3>
          </div>
          {loading ? (
            <p className="text-[11px] text-muted-foreground">Loading...</p>
          ) : recentActivities.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentActivities.map((a) => {
                const contact = contacts.find((c) => c.id === a.contact_id);
                return (
                  <li key={a.id} className="flex items-start gap-2 text-[11px]">
                    <ActivityIcon size={11} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        <span className="font-medium uppercase text-[9px] text-muted-foreground tracking-wider mr-1">{a.type}</span>
                        {a.description || "—"}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {contact && (
                          <button onClick={() => setSelectedContactId(contact.id)} className="hover:text-primary transition-colors">
                            {contact.name}
                          </button>
                        )}
                        <span>· {timeAgo(a.created_at)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Contacts</h3>
            <Link to="/sales/contacts" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
              All <ArrowRight size={10} />
            </Link>
          </div>
          {loading ? (
            <p className="text-[11px] text-muted-foreground">Loading...</p>
          ) : topContacts.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No contacts yet.</p>
          ) : (
            <ul className="space-y-2">
              {topContacts.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <button onClick={() => setSelectedContactId(c.id)} className="text-left flex-1 min-w-0 text-foreground hover:text-primary transition-colors truncate">
                    <span className="font-medium">{c.name}</span>
                    {c.title && <span className="text-muted-foreground"> · {c.title}</span>}
                  </button>
                  <span className="text-warning font-medium shrink-0">
                    {Number(c.value) > 0 ? `$${Number(c.value).toLocaleString()}/mo` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <AddContactDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
