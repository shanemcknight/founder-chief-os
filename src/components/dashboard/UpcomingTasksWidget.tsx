import { useState, useEffect, useCallback } from "react";
import { differenceInMinutes, format, startOfDay, set as setDate, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import TaskDetailPanel, { type TaskDetail, type TaskStatus } from "@/components/dashboard/TaskDetailPanel";

// --- Types ---

interface UpcomingTask {
  id: string;
  title: string;
  start_time: Date;
  due_time: Date;
  status: TaskStatus;
  priority: "low" | "normal" | "high";
}

// --- Mock data ---

function getMockUpcoming(): UpcomingTask[] {
  const now = new Date();
  const d = startOfDay(now);
  const h = now.getHours();
  return [
    { id: "u1", title: "Approve LinkedIn post", start_time: setDate(d, { hours: h, minutes: now.getMinutes() + 5 }), due_time: setDate(d, { hours: h, minutes: now.getMinutes() + 10 }), status: "scheduled", priority: "high" },
    { id: "u2", title: "Reply to wholesale lead", start_time: setDate(d, { hours: h, minutes: now.getMinutes() + 25 }), due_time: setDate(d, { hours: h, minutes: now.getMinutes() + 40 }), status: "scheduled", priority: "normal" },
    { id: "u3", title: "Review agent performance", start_time: setDate(d, { hours: h + 1, minutes: 0 }), due_time: setDate(d, { hours: h + 1, minutes: 30 }), status: "in_progress", priority: "normal" },
    { id: "u4", title: "Send invoice batch", start_time: setDate(d, { hours: h + 2, minutes: 0 }), due_time: setDate(d, { hours: h + 2, minutes: 15 }), status: "scheduled", priority: "normal" },
    { id: "u5", title: "Prep for team sync", start_time: setDate(d, { hours: h + 3, minutes: 0 }), due_time: setDate(d, { hours: h + 3, minutes: 30 }), status: "scheduled", priority: "low" },
  ];
}

// --- Helpers ---

function relativeTime(due: Date, now: Date): string {
  const mins = differenceInMinutes(due, now);
  if (mins < 0) return `${Math.abs(mins)}m overdue`;
  if (mins === 0) return "now";
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem > 0 ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
}

function urgencyLevel(due: Date, now: Date): "critical" | "soon" | "normal" {
  const mins = differenceInMinutes(due, now);
  if (mins < 5) return "critical";
  if (mins < 60) return "soon";
  return "normal";
}

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-400",
  in_progress: "bg-primary",
  scheduled: "bg-muted-foreground/50",
  overdue: "bg-destructive",
  due_soon: "bg-amber-400",
};

// --- Component ---

export default function UpcomingTasksWidget() {
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [now, setNow] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Load tasks
  const loadTasks = useCallback(() => {
    const upcoming = getMockUpcoming()
      .sort((a, b) => a.due_time.getTime() - b.due_time.getTime())
      .slice(0, 5);
    setTasks(upcoming);
  }, []);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  // Update "now" every minute for relative times
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskClick = (task: UpcomingTask) => {
    setSelectedTask({
      id: task.id,
      title: task.title,
      description: "",
      assigned_to: "chief",
      start_time: task.start_time,
      due_time: task.due_time,
      priority: task.priority,
      skills: [],
      dependencies: [],
      recurring: false,
      recurring_pattern: "daily",
      recurring_value: "",
      notes: "",
      status: task.status,
    });
    setPanelOpen(true);
  };

  return (
    <>
      <div className="space-y-1">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
          Upcoming
        </h3>

        {tasks.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 px-1 py-3">No tasks scheduled</p>
        ) : (
          <div className="space-y-0.5">
            {tasks.map((task) => {
              const urgency = urgencyLevel(task.due_time, now);
              const isOverdue = isBefore(task.due_time, now);
              const effectiveStatus = isOverdue && task.status !== "completed" ? "overdue" : task.status;
              const dotColor = isOverdue && task.status !== "completed"
                ? STATUS_DOT.overdue
                : urgency === "soon" && task.status !== "completed"
                ? STATUS_DOT.due_soon
                : STATUS_DOT[task.status] || STATUS_DOT.scheduled;

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={cn(
                    "w-full flex items-start gap-2 px-2 py-2 rounded-md text-left transition-all duration-200 group",
                    urgency === "critical" && task.status !== "completed"
                      ? "bg-destructive/10 hover:bg-destructive/15"
                      : urgency === "soon" && task.status !== "completed"
                      ? "bg-amber-500/[0.06] hover:bg-amber-500/10"
                      : "hover:bg-muted/30"
                  )}
                >
                  {/* Status dot */}
                  <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", dotColor)} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-xs font-medium truncate",
                          urgency === "critical" && task.status !== "completed"
                            ? "text-destructive font-semibold"
                            : "text-foreground/90 group-hover:text-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      {task.priority === "high" && (
                        <span className="text-[8px] font-bold text-destructive bg-destructive/15 px-1 py-0.5 rounded shrink-0">
                          HIGH
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px]",
                        urgency === "critical" && task.status !== "completed"
                          ? "text-destructive/80"
                          : urgency === "soon" && task.status !== "completed"
                          ? "text-amber-400/80"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {relativeTime(task.due_time, now)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <TaskDetailPanel
        task={selectedTask}
        allTasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSave={() => setPanelOpen(false)}
        onDelete={(id) => {
          setTasks((prev) => prev.filter((t) => t.id !== id));
          setPanelOpen(false);
        }}
        onComplete={(id) => {
          setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "completed" as TaskStatus } : t));
          setPanelOpen(false);
        }}
      />
    </>
  );
}
