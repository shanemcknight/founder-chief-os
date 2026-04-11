import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, ImagePlus } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dates = [7, 8, 9, 10, 11, 12, 13];

const platforms = ["LinkedIn", "Instagram", "TikTok", "Pinterest", "Facebook"];

const platformDot: Record<string, string> = {
  LinkedIn: "bg-blue-600",
  Instagram: "bg-pink-500",
  TikTok: "bg-foreground",
  Pinterest: "bg-red-600",
};

const calendarPosts: Record<number, { platform: string; caption: string; time: string; status: "Scheduled" | "Draft" }[]> = {
  0: [{ platform: "LinkedIn", caption: "Coachella throwback: 250 kegs/day", time: "9:00am", status: "Scheduled" }],
  1: [{ platform: "Instagram", caption: "BIB soda gun install shot", time: "12:00pm", status: "Scheduled" }],
  2: [],
  3: [{ platform: "TikTok", caption: "Lab formulation BTS", time: "3:00pm", status: "Draft" }],
  4: [{ platform: "LinkedIn", caption: "Kirkland origin story", time: "10:00am", status: "Scheduled" }],
  5: [{ platform: "Pinterest", caption: "Ginger Beer cocktail recipe", time: "11:00am", status: "Scheduled" }],
  6: [],
};

const metrics = [
  { platform: "LinkedIn", line1: "+124 impressions", line2: "3.2% engagement" },
  { platform: "Instagram", line1: "+89 followers", line2: "4.1% engagement" },
  { platform: "TikTok", line1: "2,840 views", line2: "18 new followers" },
  { platform: "Pinterest", line1: "412 outbound clicks", line2: "+22% vs last week" },
];

export default function SocialPage() {
  const [selectedPlatform, setSelectedPlatform] = useState("LinkedIn");

  return (
    <div className="space-y-6">
      {/* Section 1 — Content Calendar */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">This Week</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground"><ChevronLeft size={16} /></button>
            <span className="text-xs text-muted-foreground font-medium">Apr 7 – Apr 13, 2026</span>
            <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => (
            <div key={day} className="min-h-[140px]">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {day} <span className="text-foreground ml-1">{dates[i]}</span>
              </div>
              <div className="space-y-1.5">
                {(calendarPosts[i] || []).map((post, j) => (
                  <div key={j} className="bg-card border border-border rounded-lg p-2 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${platformDot[post.platform]}`} />
                      <span className="text-[10px] text-muted-foreground">{post.platform}</span>
                    </div>
                    <p className="text-[11px] text-foreground font-medium truncate mb-1">{post.caption}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">{post.time}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        post.status === "Scheduled"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-warning/15 text-warning"
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Compose */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Create Post</h2>
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors ${
                selectedPlatform === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground border border-border hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          rows={4}
          placeholder="Write your post or let Chief draft it for you..."
          className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 mb-3"
        />
        <div className="flex items-center gap-2 mb-4">
          <button className="text-xs font-medium text-primary border border-primary px-4 py-2 rounded-md hover:bg-primary/10 transition-colors">
            Draft with Chief
          </button>
          <button className="text-xs font-medium text-muted-foreground border border-border px-4 py-2 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-1.5">
            <ImagePlus size={13} /> Add Media
          </button>
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground font-medium">Schedule for:</span>
          <button className="text-[11px] text-foreground border border-border rounded-md px-3 py-1.5 flex items-center gap-1.5 hover:bg-muted/50">
            <Calendar size={12} /> Apr 14, 2026
          </button>
          <button className="text-[11px] text-foreground border border-border rounded-md px-3 py-1.5 flex items-center gap-1.5 hover:bg-muted/50">
            <Clock size={12} /> 10:00am
          </button>
          <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors ml-auto">
            Schedule Post
          </button>
        </div>
      </div>

      {/* Section 3 — Performance Strip */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">This Week's Performance</h2>
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.platform} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${platformDot[m.platform]}`} />
                <span className="text-xs font-semibold text-foreground">{m.platform}</span>
              </div>
              <p className="text-sm font-bold text-foreground">{m.line1}</p>
              <p className="text-[11px] text-muted-foreground">{m.line2}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}