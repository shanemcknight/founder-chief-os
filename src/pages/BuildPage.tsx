const recentBuilds = [
  { name: "Wholesale Sample Tracker", status: "Live" },
  { name: "Amazon Reorder Alert", status: "Live" },
  { name: "Daily Revenue Summary", status: "Live" },
];

export default function BuildPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">BUILD</h1>

      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground mb-3">Describe the tool you want to build — in plain English.</p>
        <textarea
          rows={5}
          placeholder="Example: Build me a tracker that monitors my Shopify inventory levels and sends a Slack alert when any SKU drops below 50 units..."
          className="w-full bg-background border border-border rounded-md p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex justify-end mt-3">
          <button className="text-sm font-medium bg-primary text-primary-foreground px-6 py-2.5 rounded-md hover:opacity-90 transition-opacity duration-150">Build It →</button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Builds</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {recentBuilds.map((b) => (
            <div key={b.name} className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors duration-150">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{b.name}</p>
                <span className="text-[10px] font-medium bg-success/20 text-success px-1.5 py-0.5 rounded-sm">{b.status}</span>
              </div>
              <div className="flex gap-2">
                <button className="text-xs font-medium border border-border text-foreground px-3 py-1.5 rounded hover:bg-muted/50 transition-colors duration-150">Open</button>
                <button className="text-xs text-muted-foreground px-3 py-1.5 rounded hover:text-foreground transition-colors duration-150">Settings</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
