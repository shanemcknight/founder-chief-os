import { useState, useEffect, useMemo } from "react";
import { format, differenceInMinutes, isBefore } from "date-fns";
import {
  X, Trash2, CheckCircle2, AlertTriangle, Clock,
  ChevronDown, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// --- Types ---

export type TaskStatus = "completed" | "in_progress" | "scheduled" | "overdue" | "due_soon" | "blocked" | "rescheduled";
export type Priority = "low" | "normal" | "high";
export type RecurringPattern = "daily" | "weekly" | "every_x" | "custom_cron";

export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  start_time: Date;
  due_time: Date;
  priority: Priority;
  skills: string[];
  dependencies: string[];
  recurring: boolean;
  recurring_pattern: RecurringPattern;
  recurring_value: string;
  notes: string;
  status: TaskStatus;
  completed_at?: Date;
}

interface TaskDetailPanelProps {
  task: TaskDetail | null;
  allTasks: { id: string; title: string }[];
  open: boolean;
  onClose: () => void;
  onSave: (task: TaskDetail) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

// --- Constants ---

const SKILLS = [
  { value: "publish_workflow", label: "Publish Workflow" },
  { value: "send_email", label: "Send Email" },
  { value: "generate_report", label: "Generate Report" },
  { value: "post_to_social", label: "Post to Social" },
  { value: "sync_calendar", label: "Sync Calendar" },
];

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  completed: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Completed" },
  in_progress: { bg: "bg-primary/15", text: "text-primary", label: "In Progress" },
  scheduled: { bg: "bg-muted", text: "text-muted-foreground", label: "Scheduled" },
  overdue: { bg: "bg-destructive/15", text: "text-destructive", label: "Overdue" },
  due_soon: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Due Soon" },
  blocked: { bg: "bg-orange-500/15", text: "text-orange-400", label: "Blocked" },
  rescheduled: { bg: "bg-violet-500/15", text: "text-violet-400", label: "Rescheduled" },
};

const PRIORITY_STYLES: Record<Priority, { color: string; label: string }> = {
  low: { color: "text-muted-foreground", label: "Low" },
  normal: { color: "text-amber-400", label: "Normal" },
  high: { color: "text-destructive", label: "High" },
};

// Helper to format Date to datetime-local input value
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function durationLabel(start: Date, end: Date): string {
  const mins = differenceInMinutes(end, start);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

// --- Component ---

export default function TaskDetailPanel({
  task,
  allTasks,
  open,
  onClose,
  onSave,
  onDelete,
  onComplete,
}: TaskDetailPanelProps) {
  const isMobile = useIsMobile();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("chief");
  const [startTime, setStartTime] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [skills, setSkills] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>("daily");
  const [recurringValue, setRecurringValue] = useState("");
  const [notes, setNotes] = useState("");

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignedTo(task.assigned_to);
      setStartTime(toLocalInput(task.start_time));
      setDueTime(toLocalInput(task.due_time));
      setPriority(task.priority);
      setSkills(task.skills);
      setDependencies(task.dependencies);
      setRecurring(task.recurring);
      setRecurringPattern(task.recurring_pattern);
      setRecurringValue(task.recurring_value);
      setNotes(task.notes);
    }
  }, [task]);

  // Validation
  const startDate = useMemo(() => startTime ? new Date(startTime) : null, [startTime]);
  const dueDate = useMemo(() => dueTime ? new Date(dueTime) : null, [dueTime]);
  const titleError = title.trim().length === 0;
  const timeError = startDate && dueDate ? isBefore(dueDate, startDate) : false;
  const pastWarning = dueDate ? isBefore(dueDate, new Date()) : false;
  const canSave = !titleError && !timeError && !!startTime && !!dueTime;
  const duration = startDate && dueDate && !timeError ? durationLabel(startDate, dueDate) : null;

  const handleSave = () => {
    if (!task || !canSave || !startDate || !dueDate) return;
    onSave({
      ...task,
      title: title.trim(),
      description,
      assigned_to: assignedTo,
      start_time: startDate,
      due_time: dueDate,
      priority,
      skills,
      dependencies,
      recurring,
      recurring_pattern: recurringPattern,
      recurring_value: recurringValue,
      notes,
    });
    toast.success("Task updated");
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    toast.success("Task deleted");
  };

  const handleComplete = () => {
    if (!task) return;
    onComplete(task.id);
    toast.success(`Task completed at ${format(new Date(), "h:mma")}`);
  };

  const toggleSkill = (val: string) => {
    setSkills((prev) => prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]);
  };

  const toggleDep = (id: string) => {
    setDependencies((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  if (!open || !task) return null;

  const statusStyle = STATUS_STYLES[task.status];
  const depTasks = allTasks.filter((t) => t.id !== task.id);

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-[10px] font-semibold border-0", statusStyle.bg, statusStyle.text)}>
            {statusStyle.label}
          </Badge>
          {task.status === "completed" && task.completed_at && (
            <span className="text-[10px] text-muted-foreground">
              at {format(task.completed_at, "h:mma")}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1.5 block">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            className="bg-muted/30 border-border text-sm"
            maxLength={200}
          />
          {titleError && title !== "" && (
            <p className="text-[10px] text-destructive mt-1">Title is required</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1.5 block">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this task..."
            className="bg-muted/30 border-border text-sm min-h-[72px] resize-none"
            maxLength={2000}
          />
        </div>

        <Separator />

        {/* Assigned To */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1.5 block">Assigned To</Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="bg-muted/30 border-border text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chief">My HQ Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start / Due times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1.5 block">Start</Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-muted/30 border-border text-xs h-9"
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1.5 block">Due</Label>
            <Input
              type="datetime-local"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="bg-muted/30 border-border text-xs h-9"
            />
          </div>
        </div>
        {timeError && (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertTriangle size={10} /> Start time must be before due time
          </p>
        )}
        {pastWarning && !timeError && (
          <p className="text-[10px] text-amber-400 flex items-center gap-1">
            <Clock size={10} /> Due time is in the past
          </p>
        )}
        {duration && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock size={10} /> Duration: {duration}
          </p>
        )}

        <Separator />

        {/* Priority */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-2 block">Priority</Label>
          <div className="flex gap-2">
            {(["low", "normal", "high"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                  priority === p
                    ? p === "high"
                      ? "bg-destructive/15 border-destructive/40 text-destructive"
                      : p === "normal"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      : "bg-muted border-border text-muted-foreground"
                    : "bg-transparent border-border/50 text-muted-foreground/60 hover:border-border"
                )}
              >
                {PRIORITY_STYLES[p].label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Skills / Workflows */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-2 block">Skills / Workflows to Trigger</Label>
          <p className="text-[10px] text-muted-foreground/70 mb-2">
            When this task starts, these skills auto-execute
          </p>
          <div className="space-y-1.5">
            {SKILLS.map((s) => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={skills.includes(s.value)}
                  onCheckedChange={() => toggleSkill(s.value)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors">
                  {s.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Dependencies */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-2 block">Dependencies</Label>
          <p className="text-[10px] text-muted-foreground/70 mb-2">
            My HQ Agent waits for these to complete first
          </p>
          {depTasks.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/50">No other tasks available</p>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {depTasks.map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox
                    checked={dependencies.includes(t.id)}
                    onCheckedChange={() => toggleDep(t.id)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors truncate">
                    {t.title}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Recurring */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">This task repeats</Label>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>
          {recurring && (
            <div className="mt-3 space-y-2">
              <Select value={recurringPattern} onValueChange={(v) => setRecurringPattern(v as RecurringPattern)}>
                <SelectTrigger className="bg-muted/30 border-border text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="every_x">Every X hours/days</SelectItem>
                  <SelectItem value="custom_cron">Custom Cron</SelectItem>
                </SelectContent>
              </Select>
              {recurringPattern === "weekly" && (
                <Select value={recurringValue || "monday"} onValueChange={setRecurringValue}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                      <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {recurringPattern === "every_x" && (
                <Input
                  value={recurringValue}
                  onChange={(e) => setRecurringValue(e.target.value)}
                  placeholder='e.g., "2h" or "3d"'
                  className="bg-muted/30 border-border text-xs h-8"
                  maxLength={20}
                />
              )}
              {recurringPattern === "custom_cron" && (
                <Input
                  value={recurringValue}
                  onChange={(e) => setRecurringValue(e.target.value)}
                  placeholder="0 9 * * 1-5"
                  className="bg-muted/30 border-border text-xs h-8 font-mono"
                  maxLength={50}
                />
              )}
              <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <RefreshCw size={9} />
                {recurringPattern === "daily" && "Repeats every day"}
                {recurringPattern === "weekly" && `Repeats every ${recurringValue || "Monday"}`}
                {recurringPattern === "every_x" && `Repeats every ${recurringValue || "..."}`}
                {recurringPattern === "custom_cron" && "Custom cron schedule"}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1.5 block">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes (My HQ Agent logs reasoning here)..."
            className="bg-muted/30 border-border text-sm min-h-[60px] resize-none"
            maxLength={5000}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive gap-1">
              <Trash2 size={12} /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete task?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-2">
          {task.status !== "completed" && (
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleComplete}>
              <CheckCircle2 size={12} /> Complete
            </Button>
          )}
          <Button
            size="sm"
            className="text-xs bg-primary hover:bg-primary/90"
            disabled={!canSave}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile: full-screen modal
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
        <div className="h-full bg-card flex flex-col overflow-hidden">
          {panelContent}
        </div>
      </div>
    );
  }

  // Desktop: side panel
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[400px] bg-card border-l border-border shadow-xl animate-slide-in-right flex flex-col overflow-hidden">
        {panelContent}
      </div>
    </>
  );
}
