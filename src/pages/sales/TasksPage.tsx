import { useMemo } from "react";
import { Check } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { tasks, contacts, loading, toggleTask, setSelectedContactId } = useCrm();

  const groups = useMemo(() => {
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const today: typeof tasks = [];
    const upcoming: typeof tasks = [];
    const overdue: typeof tasks = [];
    const completed: typeof tasks = [];
    tasks.forEach((t) => {
      if (t.completed) {
        completed.push(t);
        return;
      }
      if (!t.due_date) {
        upcoming.push(t);
        return;
      }
      const d = new Date(t.due_date).getTime();
      if (d < now) overdue.push(t);
      else if (d <= endOfToday.getTime()) today.push(t);
      else upcoming.push(t);
    });
    return { overdue, today, upcoming, completed };
  }, [tasks]);

  const Section = ({ title, items, accent }: { title: string; items: typeof tasks; accent?: "destructive" | "primary" }) => (
    <div>
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider mb-2",
          accent === "destructive" ? "text-destructive" : accent === "primary" ? "text-primary" : "text-muted-foreground"
        )}
      >
        {title} <span className="text-muted-foreground">({items.length})</span>
      </p>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 mb-4">None</p>
      ) : (
        <div className="space-y-1.5 mb-4">
          {items.map((t) => {
            const contact = t.contact_id ? contacts.find((c) => c.id === t.contact_id) : null;
            return (
              <div key={t.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <button
                  onClick={() => toggleTask(t.id, !t.completed)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    t.completed ? "bg-success border-success" : "border-border hover:border-primary"
                  )}
                >
                  {t.completed && <Check size={10} className="text-background" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs text-foreground", t.completed && "line-through text-muted-foreground")}>{t.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    {contact && (
                      <button onClick={() => setSelectedContactId(contact.id)} className="hover:text-primary transition-colors">
                        {contact.name}
                      </button>
                    )}
                    {t.due_date && <span>· {new Date(t.due_date).toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-foreground">Tasks</h1>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <>
          <Section title="Overdue" items={groups.overdue} accent="destructive" />
          <Section title="Today" items={groups.today} accent="primary" />
          <Section title="Upcoming" items={groups.upcoming} />
          <Section title="Completed" items={groups.completed} />
        </>
      )}
    </div>
  );
}
