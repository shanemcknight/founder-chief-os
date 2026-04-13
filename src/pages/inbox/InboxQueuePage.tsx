import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Copy, CalendarClock, CheckCircle2, Clock, Sparkles } from "lucide-react";

const platformIcons: Record<string, string> = {
  ig: "📸", instagram: "📸", tt: "🎵", tiktok: "🎵", li: "💼", linkedin: "💼",
  fb: "📘", facebook: "📘", x: "𝕏", twitter: "𝕏", pinterest: "📌",
};

function getCountdown(dateStr: string, timeStr?: string) {
  const target = new Date(`${dateStr}T${timeStr || "09:00"}`);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) {
    const absDiff = Math.abs(diffMs);
    const h = Math.floor(absDiff / (1000 * 60 * 60));
    const m = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    return { label: `${h}h ${m}m overdue`, overdue: true };
  }
  const h = Math.floor(diffMs / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diffMs % (1000 * 60)) / 1000);
  if (h > 24) return { label: `${Math.ceil(h / 24)}d ${h % 24}h`, overdue: false };
  return { label: `${h}h ${m}m ${s}s`, overdue: false };
}

function categorize(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const weekEnd = new Date(today.getTime() + 7 * 86400000);
  if (target < today) return "OVERDUE";
  if (target < tomorrow) return "TODAY";
  if (target < new Date(tomorrow.getTime() + 86400000)) return "TOMORROW";
  if (target < weekEnd) return "THIS WEEK";
  return "LATER";
}

export default function InboxQueuePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("social_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("post_type", "manual")
        .in("status", ["approved", "scheduled"])
        .order("scheduled_date", { ascending: true });
      setPosts(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleMarkPosted = async (id: string) => {
    setPostedIds((prev) => new Set(prev).add(id));
    await supabase.from("social_posts").update({ status: "published" }).eq("id", id);
    toast.success("✓ Posted");
    setTimeout(() => setPosts((prev) => prev.filter((p) => p.id !== id)), 800);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full -m-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={20} className="text-[hsl(var(--success))]" />
          </div>
          <p className="text-sm font-medium text-foreground">Nothing due in the next 24 hours.</p>
          <p className="text-xs text-muted-foreground mt-1">You're ahead of schedule.</p>
        </div>
      </div>
    );
  }

  const sections = ["OVERDUE", "TODAY", "TOMORROW", "THIS WEEK", "LATER"];
  const grouped = sections.reduce((acc, s) => {
    acc[s] = posts.filter((p) => p.scheduled_date && categorize(p.scheduled_date) === s);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 -m-6 space-y-6">
      <h1 className="text-lg font-bold text-foreground">Queue</h1>

      {sections.map((section) => {
        const items = grouped[section];
        if (!items || items.length === 0) return null;

        return (
          <div key={section}>
            <h2
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-3",
                section === "OVERDUE" ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {section}
            </h2>

            <div className="space-y-3">
              {items.map((post) => {
                const platform = (post.platforms || [])[0] || "ig";
                const countdown = getCountdown(post.scheduled_date, post.scheduled_time);
                const isPosted = postedIds.has(post.id);

                return (
                  <div
                    key={post.id}
                    className={cn(
                      "bg-card border border-border rounded-lg p-5 transition-all duration-500",
                      isPosted && "opacity-20 scale-95",
                      countdown.overdue && "border-destructive/50 animate-pulse"
                    )}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-lg">{platformIcons[platform] || "📱"}</span>
                      <span className="text-xs font-semibold text-foreground capitalize">{platform}</span>
                      <span
                        className={cn(
                          "ml-auto text-xs font-mono font-bold",
                          countdown.overdue ? "text-destructive" : "text-[hsl(var(--warning))]"
                        )}
                      >
                        <Clock size={12} className="inline mr-1" />
                        {countdown.label}
                      </span>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-4">
                      {post.caption || post.title || "No caption"}
                    </p>

                    <button
                      onClick={() => handleCopy(post.caption || post.title || "")}
                      className="text-xs font-medium text-muted-foreground border border-border px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors flex items-center gap-1.5 mb-4"
                    >
                      <Copy size={12} /> Copy Caption
                    </button>

                    {post.post_notes && (
                      <div className="border-l-2 border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/5 rounded-r-md p-3 mb-4">
                        <p className="text-[10px] font-bold text-[hsl(var(--warning))] uppercase mb-1">
                          <Sparkles size={10} className="inline mr-1" />
                          Post Notes
                        </p>
                        <p className="text-xs text-foreground/80">{post.post_notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast("Opening reschedule...")}
                        className="flex-1 text-xs font-medium text-foreground border border-border px-3 py-2 rounded-md hover:bg-muted/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CalendarClock size={12} /> Reschedule
                      </button>
                      <button
                        onClick={() => handleMarkPosted(post.id)}
                        className="flex-1 text-xs font-bold bg-[#B54165] text-white px-3 py-2 rounded-md hover:bg-[#B54165]/90 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={12} /> Mark as Posted
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
