import { useState, useMemo } from "react";
import { useSocial, STATUS_LABELS, PlatformId, PostStatus, getStatusColor, PLATFORMS } from "@/contexts/SocialContext";
import { Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SocialPipelinePage() {
  const { posts, movePost, openSlideOut, addPost, pillars } = useSocial();
  const [platformFilter, setPlatformFilter] = useState<PlatformId | "all">("all");
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter(p => platformFilter === "all" || p.platforms.includes(platformFilter));
  }, [posts, platformFilter]);

  const PIPELINE_COLUMNS: PostStatus[] = ["idea", "draft", "review", "scheduled", "posted"];

  const columns = useMemo(() => {
    return PIPELINE_COLUMNS.map(status => ({
      status,
      label: STATUS_LABELS[status],
      posts: filteredPosts.filter(p => p.status === status),
    }));
  }, [filteredPosts]);

  const handleQuickAdd = () => {
    if (!quickAddTitle.trim()) return;
    addPost({ title: quickAddTitle.trim() });
    setQuickAddTitle("");
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PostStatus) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("text/plain");
    if (postId) movePost(postId, targetStatus);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Pipeline</h1>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value as any)} className="text-xs bg-muted border border-border rounded-md px-2 py-1 outline-none text-foreground">
            <option value="all">All Platforms</option>
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-2 h-full">
          {columns.map(col => (
            <div key={col.status} className="flex-1 min-w-0 flex flex-col bg-muted/30 rounded-xl"
              onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.status)}>
              <div className="flex items-center gap-2 px-3 py-3">
                <span className={cn("w-2 h-2 rounded-full", getStatusColor(col.status))} />
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
                <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 ml-auto">{col.posts.length}</span>
              </div>

              {col.status === "idea" && (
                <div className="px-2 pb-2">
                  <div className="flex gap-1.5">
                    <input value={quickAddTitle} onChange={e => setQuickAddTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
                      placeholder="Quick add idea..." className="flex-1 text-xs bg-card border border-border rounded-md px-2.5 py-1.5 outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 text-foreground" />
                    <button onClick={handleQuickAdd} className="px-2 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto min-h-[100px]">
                {col.posts.map(post => {
                  const pillar = pillars.find(p => p.id === post.contentPillar);
                  return (
                    <div key={post.id} draggable onDragStart={e => e.dataTransfer.setData("text/plain", post.id)}
                      onClick={() => openSlideOut(post.id)}
                      className="bg-card rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-all border border-border/50">
                      <div className="flex items-center gap-1 mb-2">
                        {post.platforms.map(pid => {
                          const plat = PLATFORMS.find(p => p.id === pid);
                          return <span key={pid} className="text-xs">{plat?.icon}</span>;
                        })}
                      </div>
                      <div className="text-sm font-medium text-foreground mb-1 leading-tight">{post.title || "Untitled Post"}</div>
                      {pillar && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: pillar.color + "20", color: pillar.color }}>{pillar.name}</span>
                      )}
                      {post.scheduledDate && (
                        <div className="text-[10px] text-muted-foreground mt-2">📅 {post.scheduledDate}</div>
                      )}
                    </div>
                  );
                })}
                {col.posts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-xs text-muted-foreground">No posts here yet</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">Drag posts here</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
