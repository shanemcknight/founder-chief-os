import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { format, isToday, startOfDay, set as setDate, isBefore } from "date-fns";
import { CalendarIcon, Plus, Smartphone, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import TaskDetailPanel, { type TaskDetail, type TaskStatus } from "@/components/dashboard/TaskDetailPanel";
import SocialDetailPanel, { type SocialPostDetail } from "@/components/dashboard/SocialDetailPanel";
import TaskCreateForm from "@/components/dashboard/TaskCreateForm";

// --- Types ---

interface TimelineTask {
  id: string;
  title: string;
  start_time: Date;
  due_time: Date;
  status: TaskStatus;
}

interface TimelineSocialPost {
  id: string;
  title: string;
  start_time: Date;
  due_time: Date;
  platforms: string[];
}

// --- Mock data ---

function getMockTasks(day: Date): TimelineTask[] {
  const d = startOfDay(day);
  const now = new Date();
  return [
    { id: "t1", title: "Review wholesale pricing", start_time: setDate(d, { hours: 7, minutes: 0 }), due_time: setDate(d, { hours: 8, minutes: 30 }), status: "completed" },
    { id: "t2", title: "Team standup call", start_time: setDate(d, { hours: 9, minutes: 0 }), due_time: setDate(d, { hours: 9, minutes: 30 }), status: "in_progress" },
    { id: "t3", title: "Write Q2 strategy deck", start_time: setDate(d, { hours: 10, minutes: 0 }), due_time: setDate(d, { hours: 12, minutes: 0 }), status: "scheduled" },
    { id: "t4", title: "Invoice follow-up", start_time: setDate(d, { hours: 13, minutes: 0 }), due_time: setDate(d, { hours: 13, minutes: 45 }), status: isBefore(setDate(d, { hours: 13, minutes: 45 }), now) ? "overdue" : "due_soon" },
    { id: "t5", title: "Supplier negotiation prep", start_time: setDate(d, { hours: 15, minutes: 0 }), due_time: setDate(d, { hours: 16, minutes: 30 }), status: "scheduled" },
  ];
}

function getMockSocialPosts(day: Date): TimelineSocialPost[] {
  const d = startOfDay(day);
  return [
    { id: "s1", title: "Product launch reel", start_time: setDate(d, { hours: 8, minutes: 0 }), due_time: setDate(d, { hours: 8, minutes: 15 }), platforms: ["instagram", "tiktok"] },
    { id: "s2", title: "LinkedIn thought leadership", start_time: setDate(d, { hours: 12, minutes: 0 }), due_time: setDate(d, { hours: 12, minutes: 15 }), platforms: ["linkedin"] },
    { id: "s3", title: "Twitter engagement thread", start_time: setDate(d, { hours: 17, minutes: 0 }), due_time: setDate(d, { hours: 17, minutes: 15 }), platforms: ["twitter"] },
  ];
}

// --- Helpers ---

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  completed: { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300" },
  in_progress: { bg: "bg-primary/20", border: "border-primary/40", text: "text-primary" },
  scheduled: { bg: "bg-muted/40", border: "border-border", text: "text-muted-foreground" },
  due_soon: { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300" },
  overdue: { bg: "bg-destructive/20", border: "border-destructive/40", text: "text-destructive" },
};

const HOUR_WIDTH = 120;

function timeToOffset(time: Date, startHour: number): number {
  const hours = time.getHours() + time.getMinutes() / 60;
  return (hours - startHour) * HOUR_WIDTH;
}

function offsetToTime(offset: number, startHour: number, baseDay: Date): Date {
  const hours = offset / HOUR_WIDTH + startHour;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return setDate(startOfDay(baseDay), { hours: h, minutes: m });
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function toTaskDetail(t: TimelineTask): TaskDetail {
  return {
    id: t.id,
    title: t.title,
    description: "",
    assigned_to: "chief",
    start_time: t.start_time,
    due_time: t.due_time,
    priority: "normal",
    skills: [],
    dependencies: [],
    recurring: false,
    recurring_pattern: "daily",
    recurring_value: "",
    notes: "",
    status: t.status,
  };
}

// --- Component ---

export default function CalendarTimeline() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState(6);
  const [endHour, setEndHour] = useState(22);
  const [showSocial, setShowSocial] = useState(() => {
    const stored = localStorage.getItem("timeline-show-social");
    return stored !== null ? stored === "true" : true;
  });
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [socialPosts, setSocialPosts] = useState<TimelineSocialPost[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Task detail panel state
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Social detail panel state
  const [selectedSocialPost, setSelectedSocialPost] = useState<SocialPostDetail | null>(null);
  const [socialPanelOpen, setSocialPanelOpen] = useState(false);

  // Create form state
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("timeline-show-social", String(showSocial));
  }, [showSocial]);

  useEffect(() => {
    setTasks(getMockTasks(selectedDate));
    setSocialPosts(getMockSocialPosts(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (scrollRef.current && isToday(selectedDate)) {
      const now = new Date();
      const offset = timeToOffset(now, startHour) - 200;
      scrollRef.current.scrollLeft = Math.max(0, offset);
    }
  }, [selectedDate, startHour]);

  const effectiveStart = useMemo(() => {
    let min = startHour;
    tasks.forEach((t) => { min = Math.min(min, t.start_time.getHours()); });
    socialPosts.forEach((p) => { min = Math.min(min, p.start_time.getHours()); });
    return min;
  }, [startHour, tasks, socialPosts]);

  const effectiveEnd = useMemo(() => {
    let max = endHour;
    tasks.forEach((t) => { max = Math.max(max, t.due_time.getHours() + 1); });
    socialPosts.forEach((p) => { max = Math.max(max, p.due_time.getHours() + 1); });
    return Math.min(max, 24);
  }, [endHour, tasks, socialPosts]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = effectiveStart; h <= effectiveEnd; h++) arr.push(h);
    return arr;
  }, [effectiveStart, effectiveEnd]);

  const totalWidth = (effectiveEnd - effectiveStart) * HOUR_WIDTH;

  // Drag state
  const dragRef = useRef<{
    taskId: string;
    startX: number;
    initialLeft: number;
    duration: number;
    moved: boolean;
  } | null>(null);
  const [dragDelta, setDragDelta] = useState<{ id: string; delta: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, task: TimelineTask) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const duration = (task.due_time.getTime() - task.start_time.getTime()) / (1000 * 60 * 60);
    dragRef.current = {
      taskId: task.id,
      startX: clientX,
      initialLeft: timeToOffset(task.start_time, effectiveStart),
      duration,
      moved: false,
    };
    setDragDelta({ id: task.id, delta: 0 });

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const cx = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
      const delta = cx - dragRef.current.startX;
      if (Math.abs(delta) > 3) dragRef.current.moved = true;
      setDragDelta({ id: dragRef.current.taskId, delta });
    };

    const onEnd = () => {
      const ref = dragRef.current;
      if (ref) {
        if (!ref.moved) {
          // It was a click, open detail panel
          const clickedTask = tasks.find((t) => t.id === ref.taskId);
          if (clickedTask) {
            setSelectedTask(toTaskDetail(clickedTask));
            setPanelOpen(true);
          }
        } else {
          // It was a drag, reschedule
          const currentDelta = dragDelta?.delta ?? 0;
          const finalLeft = ref.initialLeft + currentDelta;
          const newStart = offsetToTime(Math.max(0, finalLeft), effectiveStart, selectedDate);
          const durationMs = ref.duration * 60 * 60 * 1000;
          const newEnd = new Date(newStart.getTime() + durationMs);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === ref.taskId ? { ...t, start_time: newStart, due_time: newEnd } : t
            )
          );
          toast.success(`Task rescheduled to ${format(newStart, "h:mma")}`);
        }
      }
      dragRef.current = null;
      setDragDelta(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onEnd);
  }, [effectiveStart, selectedDate, tasks]);

  // Panel handlers
  const handleTaskSave = (updated: TaskDetail) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === updated.id
          ? { ...t, title: updated.title, start_time: updated.start_time, due_time: updated.due_time, status: updated.status }
          : t
      )
    );
    setPanelOpen(false);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setPanelOpen(false);
  };

  const handleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "completed" as TaskStatus } : t))
    );
    setPanelOpen(false);
  };

  // Social panel handlers
  const handleSocialClick = (post: TimelineSocialPost) => {
    setSelectedSocialPost({
      id: post.id,
      title: post.title,
      platform: post.platforms[0] || "twitter",
      scheduled_time: post.start_time,
      content: `Sample content for "${post.title}". This is a preview of the social post that will be published.`,
      hashtags: "#mythos #content #social",
      notes: "",
      status: "scheduled",
    });
    setSocialPanelOpen(true);
  };

  const handleSocialReschedule = (postId: string, newTime: Date) => {
    setSocialPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, start_time: newTime } : p))
    );
    setSocialPanelOpen(false);
  };

  const handleSocialUpdate = (updated: SocialPostDetail) => {
    setSocialPanelOpen(false);
  };

  const handleSocialDelete = (postId: string) => {
    setSocialPosts((prev) => prev.filter((p) => p.id !== postId));
    setSocialPanelOpen(false);
  };

  const nowOffset = isToday(selectedDate) ? timeToOffset(new Date(), effectiveStart) : null;
  const hasItems = tasks.length > 0 || (showSocial && socialPosts.length > 0);

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 p-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mr-auto">Timeline</h2>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <CalendarIcon size={12} />
                {isToday(selectedDate) ? "Today" : format(selectedDate, "MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1">
            <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
              <SelectTrigger className="h-7 w-[68px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{formatHourLabel(i)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground">to</span>
            <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
              <SelectTrigger className="h-7 w-[68px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{formatHourLabel(i)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox checked={showSocial} onCheckedChange={(v) => setShowSocial(!!v)} className="h-3.5 w-3.5" />
            <span className="text-[11px] text-muted-foreground">Social Posts</span>
          </label>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setCreateOpen(true)}>
            <Plus size={12} /> Task
          </Button>
        </div>

        {/* Timeline body */}
        {!hasItems ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No tasks scheduled for this day
          </div>
        ) : (
          <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
            <div className="relative" style={{ width: totalWidth, minHeight: 120 }}>
              <div className="flex border-b border-border">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="shrink-0 text-[10px] text-muted-foreground py-1.5 pl-2 border-l border-border/50 first:border-l-0"
                    style={{ width: HOUR_WIDTH }}
                  >
                    {formatHourLabel(h)}
                  </div>
                ))}
              </div>

              <div className="absolute top-8 bottom-0 left-0 right-0 flex pointer-events-none">
                {hours.map((h) => (
                  <div key={h} className="shrink-0 border-l border-border/20 first:border-l-0" style={{ width: HOUR_WIDTH }} />
                ))}
              </div>

              {nowOffset !== null && nowOffset > 0 && nowOffset < totalWidth && (
                <div className="absolute top-8 bottom-0 w-px bg-destructive/60 z-20" style={{ left: nowOffset }}>
                  <div className="w-2 h-2 rounded-full bg-destructive -translate-x-[3px] -translate-y-0.5" />
                </div>
              )}

              <div className="relative h-11 mt-1 mx-0">
                {tasks.map((task) => {
                  const left = timeToOffset(task.start_time, effectiveStart);
                  const width = Math.max(timeToOffset(task.due_time, effectiveStart) - left, 30);
                  const colors = STATUS_COLORS[task.status] || STATUS_COLORS.scheduled;
                  const delta = dragDelta?.id === task.id ? dragDelta.delta : 0;

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "absolute top-1 h-9 rounded-md border flex items-center gap-1 px-2 cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-md hover:scale-[1.02] origin-left",
                        colors.bg,
                        colors.border,
                        dragDelta?.id === task.id && "z-30 shadow-lg"
                      )}
                      style={{
                        left: left + delta,
                        width,
                        transition: dragDelta?.id === task.id ? "none" : "transform 200ms ease-out",
                      }}
                      onMouseDown={(e) => handleDragStart(e, task)}
                      onTouchStart={(e) => handleDragStart(e, task)}
                      title={task.title}
                    >
                      <GripVertical size={10} className="shrink-0 text-muted-foreground/50" />
                      <span className={cn("text-[11px] font-medium truncate", colors.text)}>
                        {task.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {showSocial && socialPosts.length > 0 && (
                <div className="relative h-9 mx-0 mb-2">
                  {socialPosts.map((post) => {
                    const left = timeToOffset(post.start_time, effectiveStart);
                    const width = Math.max(timeToOffset(post.due_time, effectiveStart) - left, 60);

                    return (
                      <div
                        key={post.id}
                        className="absolute top-0 h-8 rounded-md border border-primary/20 bg-primary/[0.08] flex items-center gap-1 px-2 cursor-pointer select-none hover:bg-primary/15 transition-colors"
                        style={{ left, width }}
                        onClick={() => handleSocialClick(post)}
                        title={post.title}
                      >
                        <Smartphone size={10} className="shrink-0 text-primary/60" />
                        <span className="text-[10px] text-primary/80 font-medium truncate">
                          {post.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        allTasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onComplete={handleTaskComplete}
      />

      {/* Social Detail Panel */}
      <SocialDetailPanel
        post={selectedSocialPost}
        open={socialPanelOpen}
        onClose={() => setSocialPanelOpen(false)}
        onReschedule={handleSocialReschedule}
        onUpdate={handleSocialUpdate}
        onDelete={handleSocialDelete}
      />
    </>
  );
}
