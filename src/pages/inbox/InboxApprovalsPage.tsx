import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check, Pencil, X, Clock, Sparkles, PartyPopper } from "lucide-react";

const platformIcons: Record<string, { emoji: string; color: string }> = {
  ig: { emoji: "📸", color: "#E1306C" },
  instagram: { emoji: "📸", color: "#E1306C" },
  tt: { emoji: "🎵", color: "#00F2EA" },
  tiktok: { emoji: "🎵", color: "#00F2EA" },
  li: { emoji: "💼", color: "#0A66C2" },
  linkedin: { emoji: "💼", color: "#0A66C2" },
  fb: { emoji: "📘", color: "#1877F2" },
  facebook: { emoji: "📘", color: "#1877F2" },
  x: { emoji: "𝕏", color: "#1DA1F2" },
  twitter: { emoji: "𝕏", color: "#1DA1F2" },
  pinterest: { emoji: "📌", color: "#E60023" },
};

function getTimeUntil(dateStr: string, timeStr?: string) {
  const target = new Date(`${dateStr}T${timeStr || "09:00"}`);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return { label: "Overdue", urgent: true, critical: true };
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours < 1) return { label: `Due in ${mins}m`, urgent: true, critical: true };
  if (hours < 4) return { label: `Due in ${hours}h ${mins}m`, urgent: true, critical: false };
  if (hours < 24) return { label: `Due in ${hours}h`, urgent: false, critical: false };
  return { label: `Due in ${Math.ceil(hours / 24)}d`, urgent: false, critical: false };
}

export default function InboxApprovalsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("social_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true });
      setPosts(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleApprove = async (postId: string) => {
    setApprovedIds((prev) => new Set(prev).add(postId));
    await supabase.from("social_posts").update({ status: "approved" }).eq("id", postId);
    toast.success("✓ Approved");
    setTimeout(() => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }, 600);
  };

  const handleApproveAll = async () => {
    const ids = posts.map((p) => p.id);
    ids.forEach((id) => setApprovedIds((prev) => new Set(prev).add(id)));
    for (const id of ids) {
      await supabase.from("social_posts").update({ status: "approved" }).eq("id", id);
    }
    toast.success(`✓ ${ids.length} posts approved`);
    setTimeout(() => setPosts([]), 600);
  };

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full -m-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={20} className="text-[hsl(var(--success))]" />
          </div>
          <p className="text-sm font-medium text-foreground">Queue is clear.</p>
          <p className="text-xs text-muted-foreground mt-1">All posts have been reviewed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 -m-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-foreground">Approvals</h1>
        {posts.length >= 3 && (
          <button
            onClick={handleApproveAll}
            className="text-xs font-medium border border-border text-foreground px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors"
          >
            Approve All ({posts.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => {
          const platforms = post.platforms || [];
          const firstPlatform = platforms[0] || "ig";
          const pInfo = platformIcons[firstPlatform] || { emoji: "📱", color: "#888" };
          const timing = post.scheduled_date ? getTimeUntil(post.scheduled_date, post.scheduled_time) : null;
          const isApproved = approvedIds.has(post.id);

          return (
            <div
              key={post.id}
              className={cn(
                "bg-card border border-border rounded-lg p-4 transition-all duration-500",
                isApproved && "opacity-30 scale-95",
                timing?.critical && "border-destructive/50 animate-pulse"
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{pInfo.emoji}</span>
                <span className="text-xs font-semibold text-foreground capitalize">{firstPlatform}</span>
                {timing && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded ml-auto",
                      timing.critical
                        ? "bg-destructive/15 text-destructive animate-pulse"
                        : timing.urgent
                        ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {timing.label}
                  </span>
                )}
              </div>

              <p className="text-xs text-foreground leading-relaxed mb-3 line-clamp-4">{post.caption || post.title}</p>

              {post.content_pillar && (
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground mb-3 inline-block">
                  Content Pillar
                </span>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                <button
                  onClick={() => toast("Rejected")}
                  className="flex-1 text-xs font-medium text-muted-foreground border border-border px-3 py-1.5 rounded-md hover:bg-destructive/5 hover:text-destructive transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => toast("Opening editor...")}
                  className="flex-1 text-xs font-medium text-foreground border border-border px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleApprove(post.id)}
                  className="flex-1 text-xs font-bold bg-[#B54165] text-white px-3 py-1.5 rounded-md hover:bg-[#B54165]/90 transition-colors flex items-center justify-center gap-1"
                >
                  <Check size={12} /> Approve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
