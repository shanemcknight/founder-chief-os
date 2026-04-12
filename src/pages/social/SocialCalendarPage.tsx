import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Filter, Plus, Upload, Clock, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday, addWeeks, subWeeks } from "date-fns";
import { useSocial, PlatformId, PLATFORMS, getPlatformColor } from "@/contexts/SocialContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface PostFormData {
  title: string;
  caption: string;
  platforms: PlatformId[];
  scheduledDate: string;
  scheduledTime: string;
}

const EMPTY_FORM: PostFormData = {
  title: "",
  caption: "",
  platforms: [],
  scheduledDate: "",
  scheduledTime: "12:00",
};

export default function SocialCalendarPage() {
  const { posts, addPost, updatePost, deletePost } = useSocial();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [platformFilter, setPlatformFilter] = useState<PlatformId | "all">("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [form, setForm] = useState<PostFormData>(EMPTY_FORM);

  const days = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
    }
    return eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });
  }, [currentDate, viewMode]);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => platformFilter === "all" || p.platforms.includes(platformFilter));
  }, [posts, platformFilter]);

  const getPostsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return filteredPosts.filter(p => p.scheduledDate === dayStr);
  };

  const navigate = (dir: 1 | -1) => {
    setCurrentDate(viewMode === "month"
      ? (dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
      : (dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    );
  };

  // Open create modal for a specific date
  const openCreateModal = (dateStr?: string) => {
    setEditingPostId(null);
    setForm({
      ...EMPTY_FORM,
      scheduledDate: dateStr || format(new Date(), "yyyy-MM-dd"),
    });
    setModalOpen(true);
  };

  // Open edit modal for an existing post
  const openEditModal = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setEditingPostId(postId);
    setForm({
      title: post.title,
      caption: post.caption,
      platforms: [...post.platforms],
      scheduledDate: post.scheduledDate || "",
      scheduledTime: post.scheduledTime || "12:00",
    });
    setModalOpen(true);
  };

  const togglePlatform = (pid: PlatformId) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(pid)
        ? prev.platforms.filter(p => p !== pid)
        : [...prev.platforms, pid],
    }));
  };

  const handleSaveDraft = () => {
    if (editingPostId) {
      updatePost(editingPostId, {
        title: form.title,
        caption: form.caption,
        platforms: form.platforms,
        scheduledDate: form.scheduledDate || null,
        scheduledTime: form.scheduledTime || null,
        status: "draft",
      });
    } else {
      addPost({
        title: form.title,
        caption: form.caption,
        platforms: form.platforms,
        scheduledDate: form.scheduledDate || null,
        scheduledTime: form.scheduledTime || null,
        status: "draft",
      });
    }
    setModalOpen(false);
  };

  const handleSchedule = () => {
    if (editingPostId) {
      updatePost(editingPostId, {
        title: form.title,
        caption: form.caption,
        platforms: form.platforms,
        scheduledDate: form.scheduledDate || null,
        scheduledTime: form.scheduledTime || null,
        status: "pending_approval",
      });
    } else {
      addPost({
        title: form.title,
        caption: form.caption,
        platforms: form.platforms,
        scheduledDate: form.scheduledDate || null,
        scheduledTime: form.scheduledTime || null,
        status: "pending_approval",
      });
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingPostId) {
      deletePost(editingPostId);
      setModalOpen(false);
    }
  };

  const getPlatformChipColor = (pid: PlatformId) => {
    const map: Record<PlatformId, string> = {
      ig: "bg-pink-600/20 text-pink-400 border-pink-600/30",
      fb: "bg-blue-600/20 text-blue-400 border-blue-600/30",
      pinterest: "bg-red-600/20 text-red-400 border-red-600/30",
      tt: "bg-foreground/20 text-foreground border-foreground/30",
      li: "bg-blue-700/20 text-blue-300 border-blue-700/30",
    };
    return map[pid] || "bg-muted text-muted-foreground";
  };

  const getPlatformIcon = (pid: PlatformId) => {
    return PLATFORMS.find(p => p.id === pid)?.icon || "📱";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-foreground">Calendar</h1>
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode("month")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>Month</button>
            <button onClick={() => setViewMode("week")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>Week</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value as any)} className="text-xs bg-muted border border-border rounded-md px-2 py-1 outline-none text-foreground">
              <option value="all">All Platforms</option>
              {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {viewMode === "month" ? format(currentDate, "MMMM yyyy") : `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
            </span>
            <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors font-medium">Today</button>
          </div>
          <Button size="sm" onClick={() => openCreateModal()} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        <div className={cn("grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden", viewMode === "week" ? "grid-rows-1" : "")}>
          {days.map(day => {
            const dayPosts = getPostsForDay(day);
            const inMonth = isSameMonth(day, currentDate);
            const today_ = isToday(day);
            const dayStr = format(day, "yyyy-MM-dd");
            return (
              <div
                key={day.toISOString()}
                onClick={() => openCreateModal(dayStr)}
                className={cn(
                  "bg-card p-2 group cursor-pointer transition-colors hover:bg-muted/50 relative",
                  viewMode === "month" ? "min-h-[100px]" : "min-h-[300px]",
                  !inMonth && viewMode === "month" && "opacity-40"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full", today_ && "bg-primary text-primary-foreground")}>
                    {format(day, "d")}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); openCreateModal(dayStr); }}
                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 text-primary bg-primary/10 hover:bg-primary/20 rounded transition-all"
                    title="New post"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, viewMode === "month" ? 3 : 10).map(post => (
                    <button
                      key={post.id}
                      onClick={e => { e.stopPropagation(); openEditModal(post.id); }}
                      className="w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors bg-muted hover:bg-muted/80"
                    >
                      {post.platforms.length > 0 ? (
                        <span className="flex gap-0.5 shrink-0">
                          {post.platforms.slice(0, 3).map(pid => (
                            <span key={pid} className={cn("w-4 h-4 flex items-center justify-center rounded text-[8px]", getPlatformChipColor(pid))}>
                              {getPlatformIcon(pid)}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground")} />
                      )}
                      <span className="truncate text-foreground/80">{post.title || post.caption?.slice(0, 30) || "Untitled"}</span>
                    </button>
                  ))}
                  {dayPosts.length > (viewMode === "month" ? 3 : 10) && (
                    <span className="text-[10px] text-muted-foreground px-1">+{dayPosts.length - (viewMode === "month" ? 3 : 10)} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Post Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingPostId ? "Edit Post" : "Create Post"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Post title (optional)"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption</label>
              <Textarea
                value={form.caption}
                onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Write your caption..."
                rows={4}
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Platforms</label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.platforms.includes(p.id)}
                      onCheckedChange={() => togglePlatform(p.id)}
                    />
                    <span className="text-sm">{p.icon} {p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                <Input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
                <div className="relative">
                  <Input
                    type="time"
                    value={form.scheduledTime}
                    onChange={e => setForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Media upload placeholder */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Media</label>
              <button className="w-full border border-dashed border-border rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                <Upload className="w-4 h-4" />
                Upload media (coming soon)
              </button>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div>
              {editingPostId && (
                <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={handleSchedule} className="gap-1.5">
                <Clock className="w-4 h-4" />
                Schedule
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
