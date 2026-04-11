export default function CommandPage() {
  const kpis = [
    { label: "Revenue Today", value: "$4,840", color: "bg-accent" },
    { label: "Active Agents", value: "7", color: "bg-primary" },
    { label: "Emails Pending", value: "3", color: "bg-primary" },
    { label: "Social Reach", value: "12.4K", color: "bg-success" },
  ];

  const tools = [
    { name: "Shopify", stat: "$4,840 today", detail: "23 orders · 2 flagged" },
    { name: "Amazon", stat: "$2,210 today", detail: "18 orders · 1 suppressed listing" },
    { name: "Klaviyo", stat: "38.2% open rate", detail: "1 campaign live" },
    { name: "Stripe", stat: "$1,630 today", detail: "0 failed" },
    { name: "QuickBooks", stat: "$4,200 outstanding", detail: "2 invoices due" },
    { name: "Google Analytics", stat: "1,842 sessions", detail: "3.4% conversion" },
  ];

  const actions = [
    "Approve wholesale reply to Barrel & Oak (Austin, TX)",
    "Fix suppressed Amazon listing: Smoked Maple Old Fashioned",
    "Review LinkedIn post draft for Q2 milestones",
    "Send overdue invoice reminder — Invoice #1042",
    "Check Klaviyo campaign click-through rate",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Good morning, Shane.</h1>
        <p className="text-sm text-muted-foreground mt-1">7 agents active · 3 items need your attention · Last action 12 min ago</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <div className={`h-1 ${kpi.color} rounded-full mt-3 w-3/4`} />
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Connected Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <div key={tool.name} className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors duration-150">
              <p className="text-sm font-semibold text-foreground">{tool.name}</p>
              <p className="text-lg font-bold text-foreground mt-1">{tool.stat}</p>
              <p className="text-xs text-muted-foreground mt-1">{tool.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Priority Actions</h2>
        <div className="space-y-2">
          {actions.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <p className="text-sm text-foreground">{a}</p>
              <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity duration-150 shrink-0 ml-3">Action</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
