import { useState } from "react";
import { useSocial, getStatusColor, STATUS_LABELS, PLATFORMS } from "@/contexts/SocialContext";
import { Check, Pencil, Trash2, AlertTriangle, Calendar, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SocialApprovalsPage() {
  const { posts, updatePost, deletePost, openSlideOut, pillars } = useSocial();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Show pending_approval AND awaiting_manual_post
  const pendingPosts = posts.filter(p => p.status === "pending_approval" || p.status === "awaiting_manual_post");

  const handleApprove = (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post?.postType === "manual") {
      updatePost(id, { status: "awaiting_manual_post" });
      toast.success("Approved — awaiting manual post");
    } else {
      updatePost(id, { status: "scheduled" });
      toast.success("Post approved & scheduled!");
    }
  };

  const handleReject = (id: string) => { updatePost(id, { status: "draft" }); toast.info("Post sent back to drafts"); };
  const handleDelete = (id: string) => { deletePost(id); setConfirmDelete(null); toast.success("Post deleted"); };
  const handleMarkPosted = (id: string) => { updatePost(id, { status: "posted" }); toast.success("Post marked as posted!"); };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Approvals</h1>
          {pendingPosts.length > 0 && (
            <span className="bg-amber-500/15 text-amber-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">{pendingPosts.length} pending</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {pendingPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-semibold text-foreground mb-1">All clear!</h2>
            <p className="text-sm text-muted-foreground">No posts pending approval right now.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {pendingPosts.map(post => {
              const pillar = pillars.find(p => p.id === post.contentPillar);
              const platformColors: Record<string, string> = { ig: "bg-pink-500", fb: "bg-blue-600", tt: "bg-foreground", li: "bg-blue-700", pinterest: "bg-red-600" };
              const isManual = post.postType === "manual";
              const isAwaitingManual = post.status === "awaiting_manual_post";
              return (
                <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex gap-0">
                    {post.platforms.map(pid => <div key={pid} className={cn("h-1 flex-1", platformColors[pid])} />)}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isManual && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-500/15 text-orange-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Manual Post
                          </span>
                        )}
                        {isAwaitingManual && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-500/15 text-orange-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Manual Post
                          </span>
                        )}
                        {post.platforms.map(pid => {
                          const plat = PLATFORMS.find(p => p.id === pid);
                          return <span key={pid} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{plat?.icon} {plat?.name}</span>;
                        })}
                      </div>
                      <div className="flex items-center gap-3">
                        {pillar && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: pillar.color + "20", color: pillar.color }}>{pillar.name}</span>}
                        {post.scheduledDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />{post.scheduledDate}
                            {post.scheduledTime && <><Clock className="w-3.5 h-3.5 ml-1" />{post.scheduledTime}</>}
                          </div>
                        )}
                      </div>
                    </div>
                    {post.title && <h3 className="text-base font-semibold text-foreground mb-2">{post.title}</h3>}
                    <div className="bg-muted/50 rounded-lg p-4 mb-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {post.caption || <span className="text-muted-foreground italic">No caption written yet</span>}
                      </p>
                    </div>
                    {isManual && post.postNotes && (
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-4">
                        <div className="text-[11px] font-semibold text-orange-400 mb-1">📝 Post Notes</div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{post.postNotes}</p>
                      </div>
                    )}
                    {confirmDelete === post.id ? (
                      <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                        <span className="text-sm text-foreground flex-1">Delete this post?</span>
                        <button onClick={() => handleDelete(post.id)} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90">Yes, Delete</button>
                        <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80">Cancel</button>
                      </div>
                    ) : isAwaitingManual ? (
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleMarkPosted(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"><Check className="w-5 h-5" />MARK AS POSTED</button>
                        <button onClick={() => handleReject(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"><Pencil className="w-5 h-5" />SEND BACK</button>
                        <button onClick={() => setConfirmDelete(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"><Trash2 className="w-5 h-5" />DELETE</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleApprove(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"><Check className="w-5 h-5" />APPROVE</button>
                        <button onClick={() => handleReject(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"><Pencil className="w-5 h-5" />REJECT</button>
                        <button onClick={() => setConfirmDelete(post.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"><Trash2 className="w-5 h-5" />DELETE</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
