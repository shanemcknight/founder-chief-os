import { useState, useMemo, useCallback, useEffect, DragEvent } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Upload, Clock, Trash2, Send, FileText,
  Pencil, Check, X, MoreHorizontal, Copy, MousePointer2, CalendarClock, Sparkles
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths,
  startOfWeek, endOfWeek, isSameMonth, isToday, addWeeks, subWeeks,
  addDays, subDays, eachHourOfInterval, startOfDay, endOfDay, isSameDay
} from "date-fns";
import { useSocial, PlatformId, PLATFORMS, PostType, PostStatus, SocialPost } from "@/contexts/SocialContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// --- Constants ---
type ViewMode = "month" | "week" | "day";

const PLATFORM_COLORS: Record<PlatformId, string> = {
  ig: "#C13584",
  li: "#0A66C2",
  tt: "#FE2C55",
  pinterest: "#E60023",
  fb: "#1877F2",
};

const BEST_TIMES: Record<PlatformId, string> = {
  ig: "Tue–Fri 9am–11am",
  li: "Tue–Thu 8am–10am",
  tt: "7pm–9pm daily",
  pinterest: "Fri–Sun 8pm–11pm",
  fb: "Wed–Fri 1pm–4pm",
};

const STATUS_ICON: Record<string, { icon: typeof Clock; color: string }> = {
  draft: { icon: Pencil, color: "text-muted-foreground" },
  idea: { icon: Pencil, color: "text-muted-foreground" },
  review: { icon: Clock, color: "text-purple-400" },
  pending_approval: { icon: Clock, color: "text-amber-400" },
  approved: { icon: Check, color: "text-emerald-400" },
  scheduled: { icon: Clock, color: "text-foreground" },
  posted: { icon: Check, color: "text-green-400 opacity-70" },
  failed: { icon: X, color: "text-red-500" },
  awaiting_manual_post: { icon: Clock, color: "text-amber-500" },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface PostFormData {
  title: string;
  caption: string;
  platforms: PlatformId[];
  scheduledDate: string;
  scheduledTime: string;
  postType: PostType;
  postNotes: string;
}

const EMPTY_FORM: PostFormData = {
  title: "", caption: "", platforms: [], scheduledDate: "",
  scheduledTime: "12:00", postType: "auto", postNotes: "",
};

function getChipBg(post: SocialPost): string {
  const status = post.status as string;
  if (status === "failed") return "bg-red-600";
  if (status === "awaiting_manual_post") return "bg-amber-600";
  if (post.postType === "manual") return "bg-orange-600";
  const primary = post.platforms[0];
  if (primary && PLATFORM_COLORS[primary]) return "";
  return "bg-muted";
}

function getChipStyle(post: SocialPost): React.CSSProperties {
  const status = post.status as string;
  if (status === "failed" || status === "awaiting_manual_post" || post.postType === "manual") return {};
  const primary = post.platforms[0];
  if (primary && PLATFORM_COLORS[primary]) return { backgroundColor: PLATFORM_COLORS[primary] };
  return {};
}

export default function SocialCalendarPage() {
  const { posts, addPost, updatePost, deletePost, duplicatePost } = useSocial();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("social-calendar-view") as ViewMode) || "month";
  });
  const [platformFilters, setPlatformFilters] = useState<Set<PlatformId>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [form, setForm] = useState<PostFormData>(EMPTY_FORM);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkShiftOpen, setBulkShiftOpen] = useState(false);
  const [shiftDays, setShiftDays] = useState(1);
  const [shiftDir, setShiftDir] = useState<"forward" | "backward">("forward");
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem("social-calendar-view", viewMode); }, [viewMode]);

  // --- Computed ---
  const days = useMemo(() => {
    if (viewMode === "day") return [currentDate];
    if (viewMode === "week") return eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });
    const ms = startOfMonth(currentDate);
    return eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(endOfMonth(currentDate)) });
  }, [currentDate, viewMode]);

  const filteredPosts = useMemo(() => {
    if (platformFilters.size === 0) return posts;
    return posts.filter(p => p.platforms.some(pid => platformFilters.has(pid)));
  }, [posts, platformFilters]);

  const getPostsForDay = useCallback((day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return filteredPosts.filter(p => p.scheduledDate === dayStr);
  }, [filteredPosts]);

  const getPostsForSlot = useCallback((day: Date, hour: number) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const hourStr = hour.toString().padStart(2, "0");
    return filteredPosts.filter(p => p.scheduledDate === dayStr && p.scheduledTime?.startsWith(hourStr));
  }, [filteredPosts]);

  // --- Navigation ---
  const navigate = (dir: 1 | -1) => {
    if (viewMode === "month") setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  // --- Platform filter ---
  const togglePlatformFilter = (pid: PlatformId) => {
    setPlatformFilters(prev => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  };

  // --- Modal ---
  const openCreateModal = (dateStr?: string, timeStr?: string) => {
    setEditingPostId(null);
    setForm({ ...EMPTY_FORM, scheduledDate: dateStr || format(new Date(), "yyyy-MM-dd"), scheduledTime: timeStr || "12:00" });
    setModalOpen(true);
  };

  const openEditModal = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setEditingPostId(postId);
    setForm({
      title: post.title, caption: post.caption, platforms: [...post.platforms],
      scheduledDate: post.scheduledDate || "", scheduledTime: post.scheduledTime || "12:00",
      postType: post.postType || "auto", postNotes: post.postNotes || "",
    });
    setModalOpen(true);
  };

  const openDuplicateModal = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setEditingPostId(null);
    setForm({
      title: post.title + " (copy)", caption: post.caption, platforms: [...post.platforms],
      scheduledDate: "", scheduledTime: "", postType: post.postType || "auto", postNotes: post.postNotes || "",
    });
    setModalOpen(true);
  };

  const togglePlatform = (pid: PlatformId) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(pid) ? prev.platforms.filter(p => p !== pid) : [...prev.platforms, pid],
    }));
  };

  const getFormPayload = () => ({
    title: form.title, caption: form.caption, platforms: form.platforms,
    scheduledDate: form.scheduledDate || null, scheduledTime: form.scheduledTime || null,
    postType: form.postType, postNotes: form.postNotes,
  });

  const handleSaveDraft = () => {
    const payload = { ...getFormPayload(), status: "draft" as const };
    if (editingPostId) updatePost(editingPostId, payload); else addPost(payload);
    setModalOpen(false);
  };

  const handleSchedule = () => {
    const payload = { ...getFormPayload(), status: "pending_approval" as const };
    if (editingPostId) updatePost(editingPostId, payload); else addPost(payload);
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingPostId) { deletePost(editingPostId); setModalOpen(false); }
  };

  // --- Drag ---
  const onDragStart = (e: DragEvent, postId: string) => {
    e.dataTransfer.setData("text/plain", postId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot(slotKey);
  };

  const onDragLeave = () => setDragOverSlot(null);

  const onDrop = (e: DragEvent, dateStr: string, timeStr?: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    const postId = e.dataTransfer.getData("text/plain");
    if (!postId) return;
    const updates: Partial<SocialPost> = { scheduledDate: dateStr };
    if (timeStr) updates.scheduledTime = timeStr;
    updatePost(postId, updates);
    toast.success("Post rescheduled");
  };

  // --- Select mode ---
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkReschedule = () => {
    selectedIds.forEach(id => {
      const post = posts.find(p => p.id === id);
      if (!post?.scheduledDate) return;
      const d = new Date(post.scheduledDate);
      const nd = shiftDir === "forward" ? addDays(d, shiftDays) : subDays(d, shiftDays);
      updatePost(id, { scheduledDate: format(nd, "yyyy-MM-dd") });
    });
    toast.success(`${selectedIds.size} posts rescheduled`);
    setSelectedIds(new Set());
    setSelectMode(false);
    setBulkShiftOpen(false);
  };

  // --- Chip renderer ---
  const renderChip = (post: SocialPost, compact = false) => {
    const si = STATUS_ICON[post.status] || STATUS_ICON.draft;
    const Icon = si.icon;
    const isFailed = post.status === "failed";

    return (
      <div
        key={post.id}
        draggable={!selectMode}
        onDragStart={e => onDragStart(e, post.id)}
        onClick={e => {
          e.stopPropagation();
          if (selectMode) { toggleSelect(post.id); return; }
          openEditModal(post.id);
        }}
        className={cn(
          "group/chip flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white cursor-pointer transition-all",
          isFailed && "ring-1 ring-red-500",
          selectMode && selectedIds.has(post.id) && "ring-2 ring-primary",
          getChipBg(post),
          compact ? "w-full" : "w-full",
        )}
        style={getChipStyle(post)}
      >
        <Icon className={cn("w-3 h-3 shrink-0", si.color)} />
        <span className="truncate flex-1">{post.title || post.caption?.slice(0, 25) || "Untitled"}</span>
        {!selectMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="opacity-0 group-hover/chip:opacity-100 shrink-0"><MoreHorizontal className="w-3 h-3" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem onClick={() => openEditModal(post.id)}><Pencil className="w-3 h-3 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDuplicateModal(post.id)}><Copy className="w-3 h-3 mr-2" />Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400" onClick={() => deletePost(post.id)}><Trash2 className="w-3 h-3 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  // --- Title text ---
  const titleText = viewMode === "month"
    ? format(currentDate, "MMMM yyyy")
    : viewMode === "week"
      ? `Week of ${format(startOfWeek(currentDate), "MMM d")}`
      : format(currentDate, "EEEE, MMMM d, yyyy");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Calendar</h1>
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {(["month", "week", "day"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                  viewMode === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-medium min-w-[160px] text-center">{titleText}</span>
            <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-md font-medium">Today</button>
          </div>
          <button onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={cn("flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors",
              selectMode ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
            <MousePointer2 className="w-3 h-3" />{selectMode ? "Cancel" : "Select"}
          </button>
          {selectMode && selectedIds.size >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setBulkShiftOpen(true)} className="gap-1 text-xs">
              <CalendarClock className="w-3.5 h-3.5" />Reschedule ({selectedIds.size})
            </Button>
          )}
          <Button size="sm" onClick={() => openCreateModal()} className="gap-1.5">
            <Plus className="w-4 h-4" />Create Post
          </Button>
        </div>
      </div>

      {/* Platform filter chips */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border overflow-x-auto">
        <button onClick={() => setPlatformFilters(new Set())}
          className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors",
            platformFilters.size === 0 ? "bg-primary/15 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
          All
        </button>
        {PLATFORMS.map(p => (
          <button key={p.id} onClick={() => togglePlatformFilter(p.id)}
            className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors flex items-center gap-1",
              platformFilters.has(p.id)
                ? "text-white border-transparent"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
            style={platformFilters.has(p.id) ? { backgroundColor: PLATFORM_COLORS[p.id] } : {}}>
            <span>{p.icon}</span>{p.name}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === "month" ? (
          <>
            <div className="grid grid-cols-7 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {days.map(day => {
                const dayPosts = getPostsForDay(day);
                const inMonth = isSameMonth(day, currentDate);
                const dayStr = format(day, "yyyy-MM-dd");
                const isEmpty = dayPosts.length === 0;
                return (
                  <div key={day.toISOString()}
                    onClick={() => openCreateModal(dayStr)}
                    onDragOver={e => onDragOver(e, dayStr)}
                    onDragLeave={onDragLeave}
                    onDrop={e => onDrop(e, dayStr)}
                    className={cn("bg-card p-2 group cursor-pointer transition-colors hover:bg-muted/50 relative min-h-[100px]",
                      !inMonth && "opacity-40",
                      dragOverSlot === dayStr && "ring-2 ring-primary ring-inset bg-primary/5"
                    )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday(day) && "bg-primary text-primary-foreground")}>
                        {format(day, "d")}
                      </span>
                      {isEmpty && (
                        <span className="w-1.5 h-1.5 rounded-full border border-dashed border-muted-foreground/30" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map(post => renderChip(post, true))}
                      {dayPosts.length > 3 && <span className="text-[10px] text-muted-foreground px-1">+{dayPosts.length - 3} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Week / Day view with hourly slots */
          <div className="flex">
            <div className="w-14 shrink-0 pt-8">
              {HOURS.map(h => (
                <div key={h} className="h-14 flex items-start justify-end pr-2 text-[10px] text-muted-foreground">
                  {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                </div>
              ))}
            </div>
            <div className={cn("flex-1 grid gap-px bg-border rounded-lg overflow-hidden", viewMode === "week" ? "grid-cols-7" : "grid-cols-1")}>
              {days.map(day => {
                const dayStr = format(day, "yyyy-MM-dd");
                return (
                  <div key={day.toISOString()} className="bg-card">
                    <div className={cn("text-center text-[11px] font-medium py-2 border-b border-border",
                      isToday(day) ? "text-primary" : "text-muted-foreground")}>
                      {format(day, viewMode === "day" ? "EEEE, MMM d" : "EEE d")}
                    </div>
                    {HOURS.map(h => {
                      const timeStr = `${h.toString().padStart(2, "0")}:00`;
                      const slotKey = `${dayStr}-${h}`;
                      const slotPosts = getPostsForSlot(day, h);
                      return (
                        <div key={h}
                          onClick={() => openCreateModal(dayStr, timeStr)}
                          onDragOver={e => onDragOver(e, slotKey)}
                          onDragLeave={onDragLeave}
                          onDrop={e => onDrop(e, dayStr, timeStr)}
                          className={cn("h-14 border-b border-border/30 px-1 py-0.5 cursor-pointer hover:bg-muted/30 transition-colors relative",
                            dragOverSlot === slotKey && "ring-2 ring-primary ring-inset bg-primary/5"
                          )}>
                          <div className="space-y-0.5">
                            {slotPosts.map(post => renderChip(post))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Post Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingPostId ? "Edit Post" : "Create Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {/* Post Type Toggle */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Post Type</label>
              <div className="flex gap-2">
                <button onClick={() => setForm(prev => ({ ...prev, postType: "auto" }))}
                  className={cn("flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                    form.postType === "auto" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted")}>
                  <Send className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Auto-Publish</div>
                    <div className="text-[10px] opacity-70">Posts automatically via API</div>
                  </div>
                </button>
                <button onClick={() => setForm(prev => ({ ...prev, postType: "manual" }))}
                  className={cn("flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                    form.postType === "manual" ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-border bg-card text-muted-foreground hover:bg-muted")}>
                  <FileText className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Manual Post</div>
                    <div className="text-[10px] opacity-70">Sends reminder, you post manually</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Post title (optional)" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption</label>
              <Textarea value={form.caption} onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))} placeholder="Write your caption..." rows={4} />
            </div>

            {form.postType === "manual" && (
              <div>
                <label className="text-xs font-medium text-orange-400 mb-1 block">📝 Post Notes</label>
                <Textarea value={form.postNotes} onChange={e => setForm(prev => ({ ...prev, postNotes: e.target.value }))}
                  placeholder="e.g. 'Add trending audio', 'Use green screen effect'..." rows={3}
                  className="border-orange-500/30 focus-visible:ring-orange-500/30" />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Platforms</label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={form.platforms.includes(p.id)} onCheckedChange={() => togglePlatform(p.id)} />
                    <span className="text-sm">{p.icon} {p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={form.scheduledDate} onChange={e => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))} />
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
                <Input type="time" value={form.scheduledTime} onChange={e => setForm(prev => ({ ...prev, scheduledTime: e.target.value }))} />
                {/* Optimal time hint */}
                {form.platforms.length > 0 && (
                  <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-400">
                    <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Best times: {form.platforms.map(pid => `${PLATFORMS.find(p => p.id === pid)?.name}: ${BEST_TIMES[pid]}`).join("; ")}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Media</label>
              <button className="w-full border border-dashed border-border rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                <Upload className="w-4 h-4" />Upload media (coming soon)
              </button>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div>
              {editingPostId && (
                <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
              <Button onClick={handleSchedule} className="gap-1.5"><Clock className="w-4 h-4" />Schedule</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reschedule Modal */}
      <Dialog open={bulkShiftOpen} onOpenChange={setBulkShiftOpen}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader><DialogTitle>Bulk Reschedule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Shift {selectedIds.size} posts by:</p>
            <div className="flex gap-2 items-center">
              <Input type="number" min={1} value={shiftDays} onChange={e => setShiftDays(Number(e.target.value))} className="w-20" />
              <span className="text-sm">days</span>
              <select value={shiftDir} onChange={e => setShiftDir(e.target.value as any)}
                className="text-sm bg-muted border border-border rounded-md px-2 py-1.5 outline-none text-foreground">
                <option value="forward">forward</option>
                <option value="backward">backward</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkShiftOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkReschedule}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
