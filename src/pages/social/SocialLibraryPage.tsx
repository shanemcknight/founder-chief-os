import { useState, useMemo } from "react";
import { useSocial, PlatformId, PostStatus, STATUS_LABELS, getStatusColor, PLATFORMS } from "@/contexts/SocialContext";
import { Search, Filter, ArrowUpDown, Copy, CheckCircle, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function SocialLibraryPage() {
  const { posts, openSlideOut, duplicatePost, updatePost, pillars, addPost } = useSocial();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformId | "all">("all");
  const [sortField, setSortField] = useState<"title" | "scheduledDate" | "createdAt" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = posts.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.caption.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (platformFilter !== "all" && !p.platforms.includes(platformFilter)) return false;
      return true;
    });
    result.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [posts, search, statusFilter, platformFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Content Library</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." className="pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-md outline-none w-48 text-foreground" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 outline-none text-foreground">
            <option value="all">All Status</option>
            <option value="idea">Ideas</option><option value="draft">Drafts</option><option value="review">Review</option>
            <option value="approved">Approved</option><option value="scheduled">Scheduled</option><option value="posted">Posted</option>
          </select>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value as any)} className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 outline-none text-foreground">
            <option value="all">All Platforms</option>
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-6 py-2 bg-primary/5 border-b border-border">
          <span className="text-xs font-medium text-primary">{selected.size} selected</span>
          <button onClick={() => { selected.forEach(id => updatePost(id, { status: "approved" })); setSelected(new Set()); toast.success("Posts approved"); }} className="flex items-center gap-1 text-xs text-primary hover:underline"><CheckCircle className="w-3 h-3" />Approve</button>
          <button onClick={() => { selected.forEach(id => duplicatePost(id)); setSelected(new Set()); toast.success("Posts duplicated"); }} className="flex items-center gap-1 text-xs text-primary hover:underline"><Copy className="w-3 h-3" />Duplicate</button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-6 py-2.5 w-8"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} className="rounded border-border" /></th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort("title")}><span className="flex items-center gap-1">Title <ArrowUpDown className="w-3 h-3" /></span></th>
              <th className="px-3 py-2.5">Platforms</th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort("status")}><span className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span></th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort("scheduledDate")}><span className="flex items-center gap-1">Scheduled <ArrowUpDown className="w-3 h-3" /></span></th>
              <th className="px-3 py-2.5">Pillar</th>
              <th className="px-3 py-2.5 cursor-pointer hover:text-foreground" onClick={() => toggleSort("createdAt")}><span className="flex items-center gap-1">Created <ArrowUpDown className="w-3 h-3" /></span></th>
              <th className="px-3 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(post => {
              const pillar = pillars.find(p => p.id === post.contentPillar);
              return (
                <tr key={post.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openSlideOut(post.id)}>
                  <td className="px-6 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)} className="rounded border-border" /></td>
                  <td className="px-3 py-3 font-medium text-foreground">{post.title || "Untitled"}</td>
                  <td className="px-3 py-3"><div className="flex gap-1">{post.platforms.map(pid => { const pl = PLATFORMS.find(p => p.id === pid); return <span key={pid} className="text-xs">{pl?.icon}</span>; })}</div></td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-[11px]"><span className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(post.status))} />{STATUS_LABELS[post.status]}</span></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{post.scheduledDate || "—"}</td>
                  <td className="px-3 py-3">{pillar ? <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: pillar.color + "20", color: pillar.color }}>{pillar.name}</span> : "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{post.createdAt}</td>
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => {
                      addPost({ title: post.title, caption: post.caption, platforms: [...post.platforms], postType: post.postType, postNotes: post.postNotes, status: "draft" });
                      toast.success("Post added — open Calendar to schedule it");
                      navigate("/social/calendar");
                    }} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                      <CalendarPlus className="w-3 h-3" />Schedule
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">
                <div className="text-3xl mb-2">📭</div><div className="text-sm">No posts found</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
