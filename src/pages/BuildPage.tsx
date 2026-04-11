import { Zap, BarChart3, Bell, RefreshCw, Mail, Star, ShoppingCart, Settings } from "lucide-react";

const tools = [
  {
    name: "Wholesale Sample Tracker",
    status: "Live",
    description: "Tracks sample requests from CRM leads. Auto-sends Klaviyo confirmation email on new request.",
    connected: ["CRM", "Klaviyo"],
  },
  {
    name: "Amazon Reorder Alert",
    status: "Live",
    description: "Monitors inventory levels across Amazon FBA. Alerts via Slack when any SKU drops below 20 units.",
    connected: ["Amazon", "Slack"],
  },
  {
    name: "Daily Revenue Summary",
    status: "Live",
    description: "Pulls Shopify + Amazon revenue daily at 8am. Posts a summary to #ai-ops Slack channel.",
    connected: ["Shopify", "Amazon", "Slack"],
  },
];

const templates = [
  { icon: Mail, name: "Lead Follow-Up Sequence", description: "Auto-send follow-up emails to new CRM contacts after 3 days of no response" },
  { icon: Star, name: "Review Response Bot", description: "Monitor new Amazon/Google reviews and draft responses in your voice" },
  { icon: Bell, name: "Inventory Reorder Alert", description: "Get Slack alerts when any product hits your reorder threshold" },
  { icon: BarChart3, name: "Weekly Revenue Report", description: "Auto-generate and send a weekly P&L summary every Monday morning" },
  { icon: RefreshCw, name: "Social Post Recycler", description: "Repurpose top-performing posts for re-scheduling across platforms" },
  { icon: ShoppingCart, name: "Wholesale Welcome Flow", description: "Trigger a Klaviyo welcome sequence when a new wholesale account is added to CRM" },
];

export default function BuildPage() {
  return (
    <div className="space-y-6">
      {/* Prompt Area */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-bold text-foreground mb-1">Build a Custom Tool</h2>
        <p className="text-xs text-muted-foreground mb-4">Describe what you need in plain English. Chief will build it.</p>
        <textarea
          rows={6}
          placeholder="Example: Build me a wholesale sample request tracker that connects to my CRM and sends a Klaviyo email when a lead requests samples."
          className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 mb-4"
        />
        <div className="flex items-center gap-3">
          <button className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
            Build with Chief
          </button>
          <button className="text-sm font-medium text-muted-foreground border border-border px-5 py-2.5 rounded-lg hover:bg-muted/50 hover:text-foreground transition-colors">
            Browse Templates
          </button>
        </div>
      </div>

      {/* Your Tools */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-foreground">Your Tools</h2>
          <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">3 active</span>
        </div>
        <div className="space-y-2">
          {tools.map((tool) => (
            <div key={tool.name} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0 w-[180px]">
                <Zap size={14} className="text-primary" />
                <h3 className="text-xs font-bold text-foreground">{tool.name}</h3>
                <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded ml-1">
                  {tool.status}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{tool.description}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {tool.connected.map((c) => (
                  <span key={c} className="text-[9px] font-medium bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">{c}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 shrink-0 pl-3 border-l border-border">
                <button className="text-[10px] font-semibold text-primary hover:underline">Open Tool</button>
                <button className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Settings size={10} /> Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">Start from a Template</h2>
        <div className="grid grid-cols-3 gap-3">
          {templates.map((t) => (
            <div key={t.name} className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <t.icon size={14} className="text-primary" />
                <h3 className="text-xs font-bold text-foreground">{t.name}</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 flex-1">{t.description}</p>
              <button className="text-[10px] font-semibold text-primary border border-primary px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors self-start">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}