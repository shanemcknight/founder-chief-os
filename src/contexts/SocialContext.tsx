import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// --- Types ---
export type PlatformId = "ig" | "fb" | "pinterest" | "tt" | "li";
export type PostStatus = "idea" | "draft" | "review" | "pending_approval" | "approved" | "scheduled" | "posted" | "rejected" | "awaiting_manual_post";
export type PostType = "auto" | "manual";

export const STATUS_ORDER: PostStatus[] = ["idea", "draft", "review", "pending_approval", "approved", "scheduled", "posted"];
export const STATUS_LABELS: Record<PostStatus, string> = {
  idea: "Idea", draft: "Draft", review: "In Review", pending_approval: "Pending Approval",
  approved: "Approved", scheduled: "Scheduled", posted: "Posted", rejected: "Rejected",
  awaiting_manual_post: "Awaiting Manual Post",
};

export interface Platform {
  id: PlatformId;
  name: string;
  icon: string;
  charLimit: number;
  postTypes: string[];
  bestTimes: string[];
}

export const PLATFORMS: Platform[] = [
  { id: "ig", name: "Instagram", icon: "📸", charLimit: 2200, postTypes: ["Feed", "Reel", "Story", "Carousel"], bestTimes: ["11am", "2pm", "7pm"] },
  { id: "fb", name: "Facebook", icon: "📘", charLimit: 63206, postTypes: ["Post", "Reel", "Story", "Link"], bestTimes: ["9am", "1pm", "4pm"] },
  { id: "pinterest", name: "Pinterest", icon: "📌", charLimit: 500, postTypes: ["Pin", "Idea Pin", "Video Pin"], bestTimes: ["8pm", "10pm"] },
  { id: "tt", name: "TikTok", icon: "🎵", charLimit: 2200, postTypes: ["Video", "Photo", "Slideshow"], bestTimes: ["7am", "12pm", "7pm"] },
  { id: "li", name: "LinkedIn", icon: "💼", charLimit: 3000, postTypes: ["Post", "Article", "Document", "Video"], bestTimes: ["8am", "10am", "12pm"] },
];

export interface SocialPost {
  id: string;
  title: string;
  caption: string;
  hashtags: string;
  platforms: PlatformId[];
  postTypes: Record<string, string>;
  status: PostStatus;
  scheduledDate: string | null;
  scheduledTime: string | null;
  mediaUrl: string;
  altText: string;
  firstComment: string;
  contentPillar: string;
  boostEnabled: boolean;
  boostBudget: number;
  postType: PostType;
  postNotes: string;
  createdAt: string;
}

export interface ContentPillar {
  id: string;
  name: string;
  color: string;
  emoji: string;
  description: string;
  bestPlatforms: string[];
}

// --- DB Row -> App Model ---
function rowToPost(row: any): SocialPost {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    hashtags: row.hashtags,
    platforms: (row.platforms || []) as PlatformId[],
    postTypes: (row.post_types || {}) as Record<string, string>,
    status: row.status as PostStatus,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    mediaUrl: row.media_url,
    altText: row.alt_text,
    firstComment: row.first_comment,
    contentPillar: row.content_pillar || "",
    boostEnabled: row.boost_enabled,
    boostBudget: row.boost_budget,
    postType: (row.post_type || "auto") as PostType,
    postNotes: row.post_notes || "",
    createdAt: row.created_at?.split("T")[0] || "",
  };
}

function rowToPillar(row: any): ContentPillar {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    description: row.description,
    bestPlatforms: row.best_platforms || [],
  };
}

// --- Context ---
interface SocialContextType {
  posts: SocialPost[];
  pillars: ContentPillar[];
  loading: boolean;
  addPost: (overrides?: Partial<SocialPost>) => SocialPost;
  updatePost: (id: string, updates: Partial<SocialPost>) => void;
  deletePost: (id: string) => void;
  movePost: (id: string, newStatus: PostStatus) => void;
  duplicatePost: (id: string) => void;
  selectedPostId: string | null;
  slideOutOpen: boolean;
  openSlideOut: (id: string) => void;
  closeSlideOut: () => void;
}

const SocialContext = createContext<SocialContextType | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  // Load data from DB
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [postsRes, pillarsRes] = await Promise.all([
        supabase.from("social_posts").select("*").order("created_at", { ascending: false }),
        supabase.from("social_content_pillars").select("*").order("sort_order"),
      ]);

      if (cancelled) return;

      setPosts((postsRes.data || []).map(rowToPost));
      setPillars((pillarsRes.data || []).map(rowToPillar));
      setLoading(false);
    }
    load();

    // Realtime subscription for posts
    const channel = supabase
      .channel("social_posts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_posts" }, () => {
        // Reload on any change
        supabase.from("social_posts").select("*").order("created_at", { ascending: false })
          .then(({ data }) => { if (!cancelled && data) setPosts(data.map(rowToPost)); });
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [userId]);

  const addPost = useCallback((overrides?: Partial<SocialPost>) => {
    const tempId = crypto.randomUUID();
    const newPost: SocialPost = {
      id: tempId,
      title: overrides?.title || "",
      caption: overrides?.caption || "",
      hashtags: "",
      platforms: overrides?.platforms || [],
      postTypes: {},
      status: overrides?.status || "idea",
      scheduledDate: overrides?.scheduledDate || null,
      scheduledTime: overrides?.scheduledTime || null,
      mediaUrl: "",
      altText: "",
      firstComment: "",
      contentPillar: overrides?.contentPillar || "",
      boostEnabled: false,
      boostBudget: 0,
      postType: overrides?.postType || "auto",
      postNotes: overrides?.postNotes || "",
      createdAt: new Date().toISOString().split("T")[0],
    };

    // Optimistic update
    setPosts(prev => [newPost, ...prev]);

    // Persist
    if (userId) {
      supabase.from("social_posts").insert({
        id: tempId,
        user_id: userId,
        title: newPost.title,
        caption: newPost.caption,
        platforms: newPost.platforms,
        status: newPost.status,
        scheduled_date: newPost.scheduledDate,
        scheduled_time: newPost.scheduledTime,
        content_pillar: newPost.contentPillar || null,
        post_type: newPost.postType,
        post_notes: newPost.postNotes,
      }).then(({ error }) => {
        if (error) console.error("Failed to create post:", error);
      });
    }

    return newPost;
  }, [userId]);

  const updatePost = useCallback((id: string, updates: Partial<SocialPost>) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

    // Map app fields to DB columns
    const dbUpdates: Partial<{
      title: string; caption: string; hashtags: string; platforms: string[];
      post_types: Record<string, string>; status: string; scheduled_date: string | null;
      scheduled_time: string | null; media_url: string; alt_text: string;
      first_comment: string; content_pillar: string | null; boost_enabled: boolean;
      boost_budget: number;
    }> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.caption !== undefined) dbUpdates.caption = updates.caption;
    if (updates.hashtags !== undefined) dbUpdates.hashtags = updates.hashtags;
    if (updates.platforms !== undefined) dbUpdates.platforms = updates.platforms;
    if (updates.postTypes !== undefined) dbUpdates.post_types = updates.postTypes;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
    if (updates.scheduledTime !== undefined) dbUpdates.scheduled_time = updates.scheduledTime;
    if (updates.mediaUrl !== undefined) dbUpdates.media_url = updates.mediaUrl;
    if (updates.altText !== undefined) dbUpdates.alt_text = updates.altText;
    if (updates.firstComment !== undefined) dbUpdates.first_comment = updates.firstComment;
    if (updates.contentPillar !== undefined) dbUpdates.content_pillar = updates.contentPillar || null;
    if (updates.boostEnabled !== undefined) dbUpdates.boost_enabled = updates.boostEnabled;
    if (updates.boostBudget !== undefined) dbUpdates.boost_budget = updates.boostBudget;
    if (updates.postType !== undefined) (dbUpdates as any).post_type = updates.postType;
    if (updates.postNotes !== undefined) (dbUpdates as any).post_notes = updates.postNotes;

    if (Object.keys(dbUpdates).length > 0) {
      supabase.from("social_posts").update(dbUpdates).eq("id", id)
        .then(({ error }) => { if (error) console.error("Failed to update post:", error); });
    }
  }, []);

  const deletePost = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    if (selectedPostId === id) { setSlideOutOpen(false); setSelectedPostId(null); }
    supabase.from("social_posts").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("Failed to delete post:", error); });
  }, [selectedPostId]);

  const movePost = useCallback((id: string, newStatus: PostStatus) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, status: newStatus } : p)));
    supabase.from("social_posts").update({ status: newStatus }).eq("id", id)
      .then(({ error }) => { if (error) console.error("Failed to move post:", error); });
  }, []);

  const duplicatePost = useCallback((id: string) => {
    const original = posts.find(p => p.id === id);
    if (!original) return;
    addPost({
      ...original,
      title: original.title + " (copy)",
      status: "draft" as PostStatus,
    });
  }, [posts, addPost]);

  const openSlideOut = useCallback((id: string) => { setSelectedPostId(id); setSlideOutOpen(true); }, []);
  const closeSlideOut = useCallback(() => { setSlideOutOpen(false); setSelectedPostId(null); }, []);

  return (
    <SocialContext.Provider value={{ posts, pillars, loading, addPost, updatePost, deletePost, movePost, duplicatePost, selectedPostId, slideOutOpen, openSlideOut, closeSlideOut }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
}

// --- Utilities ---
export function getStatusColor(status: PostStatus): string {
  const map: Record<PostStatus, string> = {
    idea: "bg-blue-400", draft: "bg-yellow-400", review: "bg-purple-400",
    pending_approval: "bg-amber-500", approved: "bg-emerald-500",
    scheduled: "bg-cyan-500", posted: "bg-green-600", rejected: "bg-red-500",
    awaiting_manual_post: "bg-orange-500",
  };
  return map[status] || "bg-muted-foreground";
}

export function getPlatformColor(platform: PlatformId): string {
  const map: Record<PlatformId, string> = {
    ig: "bg-pink-600", fb: "bg-blue-600", pinterest: "bg-red-600", tt: "bg-foreground", li: "bg-blue-700",
  };
  return map[platform] || "bg-muted";
}
