import { useState, useEffect, useCallback, useRef } from "react";
import { format, addHours, differenceInMinutes, isBefore } from "date-fns";
import { ChevronDown, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TaskDetail, Priority, RecurringPattern } from "@/components/dashboard/TaskDetailPanel";

// --- Helpers ---

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

const SKILLS = [
  { value: "publish_workflow", label: "Publish Workflow" },
  { value: "send_email", label: "Send Email" },
  { value: "generate_report", label: "Generate Report" },
  { value: "post_to_social", label: "Post to Social" },
  { value: "sync_calendar", label: "Sync Calendar" },
];

// --- Props ---

interface TaskCreateFormProps {
  open: boolean;
  onClose: () => void;
  onCreate: (task: TaskDetail) => void;
}

// --- Component ---

export default function TaskCreateForm({ open, onClose, onCreate }: TaskCreateFormProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const now = new Date();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(toLocalInput(now));
  const [dueTime, setDueTime] = useState(toLocalInput(addHours(now, 1)));
  const [showMore, setShowMore] = useState(false);

  // Optional fields
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("chief");
  const [priority, setPriority] = useState<Priority>("normal");
  const [skills, setSkills] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>("daily");
  const [recurringValue, setRecurringValue] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      const n = new Date();
      setTitle("");
      setStartTime(toLocalInput(n));
      setDueTime(toLocalInput(addHours(n, 1)));
      setShowMore(false);
      setDescription("");
      setAssignedTo("chief");
      setPriority("normal");
      setSkills([]);
      setRecurring(false);
      setRecurringPattern("daily");
      setRecurringValue("");
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open]);

  // Validation
  const startDate = startTime ? new Date(startTime) : null;
  const dueDate = dueTime ? new Date(dueTime) : null;
  const titleError = title.trim().length === 0;
  const timeError = startDate && dueDate ? isBefore(dueDate, startDate) : false;
  const canCreate = !titleError && !timeError && !!startTime && !!dueTime;
  const duration = startDate && dueDate && !timeError ? durationLabel(startDate, dueDate) : null;

  const handleCreate = useCallback(() => {
    if (!canCreate || !startDate || !dueDate) return;
    const newTask: TaskDetail = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description,
      assigned_to: assignedTo,
      start_time: startDate,
      due_time: dueDate,
      priority,
      skills,
      dependencies: [],
      recurring,
      recurring_pattern: recurringPattern,
      recurring_value: recurringValue,
      notes: "",
      status: "scheduled",
    };
    onCreate(newTask);
    toast.success("Task created");
    onClose();
  }, [canCreate, title, startDate, dueDate, description, assignedTo, priority, skills, recurring, recurringPattern, recurringValue, onCreate, onClose]);

  // Keyboard: Escape handled by Dialog; Enter in title submits
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canCreate) {
      e.preventDefault();
      handleCreate();
    }
  };

  const toggleSkill = (val: string) => {
    setSkills((prev) => prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border p-0 gap-0">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="text-sm font-semibold text-foreground">New Task</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Title */}
          <div>
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="What needs to happen?"
              className="bg-muted/30 border-border text-base h-11 font-medium"
              maxLength={200}
              autoFocus
            />
            {title.length > 0 && titleError && (
              <p className="text-[10px] text-destructive mt-1">Title is required</p>
            )}
          </div>

          {/* Start / Due */}
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
          {duration && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> Duration: {duration}
            </p>
          )}

          {/* More options toggle */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown size={12} className={cn("transition-transform duration-200", showMore && "rotate-180")} />
            More options
          </button>

          {/* Expanded options */}
          {showMore && (
            <div className="space-y-4 animate-fade-in">
              <Separator />

              {/* Description */}
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1.5 block">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  className="bg-muted/30 border-border text-sm min-h-[60px] resize-none"
                  maxLength={2000}
                />
              </div>

              {/* Assigned To */}
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1.5 block">Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chief">Chief</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label className="text-[11px] text-muted-foreground mb-2 block">Skills to Trigger</Label>
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

              {/* Recurring */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-muted-foreground">Repeats</Label>
                  <Switch checked={recurring} onCheckedChange={setRecurring} />
                </div>
                {recurring && (
                  <div className="mt-2">
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
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-primary hover:bg-primary/90"
              disabled={!canCreate}
              onClick={handleCreate}
            >
              Create Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
