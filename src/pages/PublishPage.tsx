const drafts = [
  { title: "The Rise of Craft Cocktail Culture in Austin", status: "Ready", words: 1240 },
  { title: "Why Every Bar Needs a Signature Old Fashioned", status: "Draft", words: 860 },
  { title: "Behind the Barrel: Our Smoked Maple Process", status: "Review", words: 1580 },
];

const published = [
  { title: "5 Cocktail Trends Dominating 2025", date: "Mar 28", views: "2,340" },
  { title: "How We Source Our Bourbon", date: "Mar 15", views: "1,870" },
  { title: "The Art of Barrel Aging", date: "Feb 28", views: "3,100" },
];

export default function PublishPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">PUBLISH</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Blog Post Queue</h2>
          <div className="space-y-2">
            {drafts.map((d) => (
              <div key={d.title} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between hover:border-primary/50 transition-colors duration-150">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.words} words</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm ${
                  d.status === "Ready" ? "bg-success/20 text-success" : d.status === "Review" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"
                }`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Active Editor</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <input defaultValue="The Rise of Craft Cocktail Culture in Austin" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <textarea
              rows={10}
              defaultValue={`Austin's cocktail scene has evolved dramatically over the past five years. What was once dominated by standard pours and predictable menus has transformed into a playground for craft mixologists and spirit innovators.\n\nAt the center of this shift are small-batch producers who bring genuine craft to every bottle. Our Smoked Maple Old Fashioned has become a staple at over 40 bars across Texas, not because of marketing spend, but because bartenders genuinely love working with it.\n\nThe trend is clear: consumers want authenticity. They want to know where their bourbon comes from, how it's aged, and who made it. This is the story we tell with every barrel.`}
              className="w-full bg-background border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">SEO Score:</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success rounded-full" style={{ width: "78%" }} /></div>
                <span className="text-xs text-success font-medium">78</span>
              </div>
              <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity duration-150">Publish to Shopify Blog</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recently Published</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Views</th>
            </tr></thead>
            <tbody>
              {published.map((p) => (
                <tr key={p.title} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">{p.title}</td>
                  <td className="p-3 text-muted-foreground">{p.date}</td>
                  <td className="p-3 text-muted-foreground">{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
