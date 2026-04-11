const posts = [
  { day: "Mon", platform: "LinkedIn", title: "Q2 Revenue Milestone", status: "Scheduled" },
  { day: "Tue", platform: "Instagram", title: "Behind the Barrel #4", status: "Scheduled" },
  { day: "Wed", platform: "TikTok", title: "Cocktail Recipe Reel", status: "Draft" },
  { day: "Thu", platform: "Pinterest", title: "Summer Cocktail Board", status: "Scheduled" },
  { day: "Fri", platform: "LinkedIn", title: "Founder Friday Recap", status: "Scheduled" },
];

const platforms = ["LinkedIn", "Instagram", "TikTok", "Pinterest"];

export default function StoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">STORY</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Content Calendar — This Week</h2>
          <div className="space-y-2">
            {posts.map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground w-8">{p.day}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.platform}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm ${p.status === "Draft" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Compose</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              {platforms.map((p) => (
                <button key={p} className="text-[10px] font-medium border border-border px-2.5 py-1 rounded hover:border-primary hover:text-primary transition-colors duration-150 text-muted-foreground">{p}</button>
              ))}
            </div>
            <textarea placeholder="Write your caption..." className="w-full h-24 bg-background border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            <div className="h-20 bg-muted/30 border border-dashed border-border rounded-md flex items-center justify-center text-xs text-muted-foreground">Drop media here</div>
            <div className="flex justify-between items-center">
              <input type="datetime-local" className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground" />
              <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity duration-150">Publish</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Performance</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Follower Growth</p>
            <p className="text-xl font-bold text-foreground">+842</p>
            <p className="text-xs text-success">↑ 12% this week</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Top Post</p>
            <p className="text-sm font-semibold text-foreground">Behind the Barrel #3</p>
            <p className="text-xs text-muted-foreground">2.4K engagements</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Engagement Rate</p>
            <p className="text-xl font-bold text-foreground">4.8%</p>
            <p className="text-xs text-success">Above industry avg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
