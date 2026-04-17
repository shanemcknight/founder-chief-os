import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LayoutGrid, UserPlus, Search, ListChecks, Clock, Activity as ActivityIcon, Plus } from "lucide-react";
import { useCrm, Stage } from "@/contexts/CrmContext";

const SUMMARY_STAGES: { key: Stage; label: string }[] = [
  { key: "new_lead", label: "NEW LEAD" },
  { key: "contacted", label: "CONTACTED" },
  { key: "sample_sent", label: "SAMPLE SENT" },
  { key: "proposal_sent", label: "PROPOSAL SENT" },
];

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

export default function SalesDashboardPage() {
  const navigate = useNavigate();
  const { contacts, activities, tasks, loading, setSelectedContactId, createContact } = useCrm();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const stageSummary = useMemo(() => {
    return SUMMARY_STAGES.map((s) => {
      const items = contacts.filter((c) => c.stage === s.key);
      const total = items.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
      return { ...s, count: items.length, total };
    });
  }, [contacts]);

  const tasksToday = useMemo(
    () => tasks.filter((t) => !t.completed && isToday(t.due_date)).slice(0, 5),
    [tasks]
  );

  const recentActivities = useMemo(() => activities.slice(0, 6), [activities]);

  const topContacts = useMemo(
    () =>
      [...contacts]
        .filter((c) => c.stage !== "lost" && c.stage !== "won")
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
        .slice(0, 5),
    [contacts]
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const c = await createContact({ name: newName.trim() });
    if (c) {
      setNewName("");
      setShowAdd(false);
      setSelectedContactId(c.id);
    }
  };

  const quickActions = [
    {
      title: "View Pipeline",
      desc: "See contacts across all stages",
      icon: LayoutGrid,
      onClick: () => navigate("/sales/pipeline"),
    },
    {
      title: "Add Contact",
      desc: "Create a new sales contact",
      icon: UserPlus,
      onClick: () => setShowAdd(true),
    },
    {
      title: "Find Prospects",
      desc: "Search Apollo for new leads",
      icon: Search,
      onClick: () => navigate("/sales/prospects"),
    },
    {
      title: "View Tasks",
      desc: "Follow-ups and reminders",
      icon: ListChecks,
      onClick: () => navigate("/sales/tasks"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Sales</h1>
        <p className="text-sm text-muted-foreground">Your pipeline at a glance.</p>
      </div>

      {/* Add contact inline form */}
      {showAdd && (
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Contact name (e.g., Jane Doe — Acme Co)"
            className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button onClick={handleAdd} className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
            Create
          </button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground hover:text-foreground px-2">
            Cancel
          </button>
        </div>
      )}

      {/* Pipeline stage summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stageSummary.map((s) => (
          <Link
            key={s.key}
            to={`/sales/pipeline?stage=${s.key}`}
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
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
        {/* Tasks due today */}
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
                    <button
                      onClick={() => navigate("/sales/tasks")}
                      className="text-left flex-1 text-foreground hover:text-primary transition-colors"
                    >
                      <span className="font-medium">{t.title}</span>
                      {contact && <span className="text-muted-foreground"> — {contact.name}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent activity */}
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
                        <span className="font-medium uppercase text-[9px] text-muted-foreground tracking-wider mr-1">
                          {a.type}
                        </span>
                        {a.description || "—"}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {contact && (
                          <button
                            onClick={() => setSelectedContactId(contact.id)}
                            className="hover:text-primary transition-colors"
                          >
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

        {/* Top contacts by value */}
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
                  <button
                    onClick={() => setSelectedContactId(c.id)}
                    className="text-left flex-1 min-w-0 text-foreground hover:text-primary transition-colors truncate"
                  >
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
    </div>
  );
}
