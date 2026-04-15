import { useState, useEffect } from "react";
import { format, isBefore } from "date-fns";
import {
  X, Trash2, ExternalLink, Pencil, CalendarIcon,
  Heart, MessageCircle, Share2, Eye, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// --- Types ---

export interface SocialPostDetail {
  id: string;
  title: string;
  platform: string;
  scheduled_time: Date;
  content: string;
  hashtags: string;
  media_url?: string;
  media_type?: "image" | "video";
  status: "scheduled" | "published" | "draft";
  published_at?: Date;
  post_url?: string;
  notes: string;
  stats?: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
}

interface SocialDetailPanelProps {
  post: SocialPostDetail | null;
  open: boolean;
  onClose: () => void;
  onReschedule: (postId: string, newTime: Date) => void;
  onUpdate: (post: SocialPostDetail) => void;
  onDelete: (postId: string) => void;
}

// --- Platform config ---

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  linkedin: { label: "LinkedIn", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  instagram: { label: "Instagram", color: "text-pink-400", bg: "bg-pink-500/15", border: "border-pink-500/30" },
  tiktok: { label: "TikTok", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  twitter: { label: "X / Twitter", color: "text-sky-400", bg: "bg-sky-500/15", border: "border-sky-500/30" },
  facebook: { label: "Facebook", color: "text-blue-500", bg: "bg-blue-600/15", border: "border-blue-600/30" },
  pinterest: { label: "Pinterest", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// --- Component ---

export default function SocialDetailPanel({
  post,
  open,
  onClose,
  onReschedule,
  onUpdate,
  onDelete,
}: SocialDetailPanelProps) {
  const isMobile = useIsMobile();

  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [notes, setNotes] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setHashtags(post.hashtags);
      setNotes(post.notes);
      setNewTime(toLocalInput(post.scheduled_time));
      setEditing(false);
      setRescheduling(false);
    }
  }, [post]);

  if (!open || !post) return null;

  const platform = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.twitter;
  const isPublished = post.status === "published";
  const charCount = content.length;

  const handleReschedule = () => {
    if (!newTime) return;
    const d = new Date(newTime);
    onReschedule(post.id, d);
    setRescheduling(false);
    toast.success(`Post rescheduled to ${format(d, "MMM d 'at' h:mma")}`);
  };

  const handleSaveEdit = () => {
    onUpdate({ ...post, content, hashtags, notes });
    setEditing(false);
    toast.success("Post updated");
  };

  const handleDelete = () => {
    onDelete(post.id);
    toast.success("Post deleted");
  };

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-[10px] font-semibold border", platform.bg, platform.color, platform.border)}>
            {platform.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isPublished ? "text-emerald-400 border-emerald-500/30" : "text-muted-foreground"
            )}
          >
            {post.status === "published" ? "Published" : post.status === "draft" ? "Draft" : "Scheduled"}
          </Badge>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground">{post.title}</h3>

        {/* Scheduled time */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1.5 block">Scheduled for</Label>
          {rescheduling ? (
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="bg-muted/30 border-border text-xs h-8 flex-1"
              />
              <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" onClick={handleReschedule}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setRescheduling(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                <Clock size={13} className="text-muted-foreground" />
                {format(post.scheduled_time, "EEEE, MMM d 'at' h:mm a")}
              </div>
              {!isPublished && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setRescheduling(true)}
                >
                  <CalendarIcon size={11} /> Reschedule
                </Button>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Media preview */}
        {post.media_url && (
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1.5 block">Media</Label>
            <div className="rounded-lg overflow-hidden border border-border bg-muted/20 aspect-video flex items-center justify-center">
              {post.media_type === "video" ? (
                <div className="text-xs text-muted-foreground">🎬 Video preview</div>
              ) : (
                <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        )}

        {/* Post content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-[11px] text-muted-foreground">Post Content</Label>
            <span className="text-[10px] text-muted-foreground/60">{charCount} chars</span>
          </div>
          {editing && !isPublished ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-muted/30 border-border text-sm min-h-[100px] resize-none"
              maxLength={5000}
            />
          ) : (
            <div className="bg-muted/20 border border-border rounded-md p-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {content || <span className="text-muted-foreground italic">No content</span>}
            </div>
          )}
        </div>

        {/* Hashtags */}
        {(hashtags || editing) && (
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1.5 block">Hashtags</Label>
            {editing && !isPublished ? (
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#hashtag1 #hashtag2"
                className="bg-muted/30 border-border text-xs"
                maxLength={500}
              />
            ) : (
              <p className="text-xs text-primary/70">{hashtags}</p>
            )}
          </div>
        )}

        <Separator />

        {/* Engagement stats (published only) */}
        {isPublished && post.stats && (
          <>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-2 block">Engagement</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Heart, label: "Likes", value: post.stats.likes },
                  { icon: MessageCircle, label: "Comments", value: post.stats.comments },
                  { icon: Share2, label: "Shares", value: post.stats.shares },
                  { icon: Eye, label: "Views", value: post.stats.impressions },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/20 border border-border rounded-md p-2 text-center">
                    <stat.icon size={12} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-semibold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {post.published_at && (
              <p className="text-[10px] text-muted-foreground">
                Published {format(post.published_at, "MMM d, yyyy 'at' h:mma")}
              </p>
            )}

            <Separator />
          </>
        )}

        {/* Notes */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1.5 block">Notes</Label>
          {editing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this post..."
              className="bg-muted/30 border-border text-sm min-h-[60px] resize-none"
              maxLength={2000}
            />
          ) : (
            <div className="text-xs text-muted-foreground/80">
              {notes || <span className="italic">No notes</span>}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive gap-1">
              <Trash2 size={12} /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                It won't be posted. This cannot be undone.
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
          {isPublished && post.post_url && (
            <Button variant="outline" size="sm" className="text-xs gap-1" asChild>
              <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={11} /> View
              </a>
            </Button>
          )}
          {!isPublished && (
            editing ? (
              <Button size="sm" className="text-xs bg-primary hover:bg-primary/90" onClick={handleSaveEdit}>
                Save
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setEditing(true)}>
                <Pencil size={11} /> Edit
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
        <div className="h-full bg-card flex flex-col overflow-hidden">
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[400px] bg-card border-l border-border shadow-xl animate-slide-in-right flex flex-col overflow-hidden">
        {panelContent}
      </div>
    </>
  );
}
