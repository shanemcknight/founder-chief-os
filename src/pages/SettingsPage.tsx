import { useState } from "react";
import { Mail, ShoppingBag, BarChart3, Share2, Users, Wrench } from "lucide-react";

const navItems = ["Account", "Team", "Integrations", "Chief Settings", "Billing", "API & Webhooks", "Notifications"];

const connected = [
  "Gmail", "Shopify", "Amazon", "Klaviyo", "Stripe", "QuickBooks", "LinkedIn", "Apollo",
];

type Integration = { name: string; titan?: boolean };

const categories: { label: string; icon: typeof Mail; items: Integration[] }[] = [
  {
    label: "Communication", icon: Mail, items: [
      { name: "Outlook" }, { name: "Discord" }, { name: "Telegram" }, { name: "WhatsApp Business", titan: true },
    ],
  },
  {
    label: "Commerce", icon: ShoppingBag, items: [
      { name: "Walmart", titan: true }, { name: "eBay", titan: true },
    ],
  },
  {
    label: "Marketing", icon: BarChart3, items: [
      { name: "Meta Ads", titan: true }, { name: "Google Ads", titan: true }, { name: "Google Analytics" }, { name: "Mailchimp" },
    ],
  },
  {
    label: "Social", icon: Share2, items: [
      { name: "Instagram" }, { name: "TikTok", titan: true }, { name: "Pinterest" }, { name: "Facebook" },
    ],
  },
  {
    label: "CRM & Sales", icon: Users, items: [
      { name: "HubSpot" }, { name: "Pipedrive" },
    ],
  },
  {
    label: "Productivity", icon: Wrench, items: [
      { name: "Notion" }, { name: "Airtable", titan: true }, { name: "Google Calendar" }, { name: "GitHub", titan: true },
    ],
  },
];

export default function SettingsPage() {
  const [activeNav, setActiveNav] = useState("Integrations");

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Left Nav */}
      <div className="w-[25%] shrink-0">
        <h2 className="text-lg font-bold text-foreground mb-4">Settings</h2>
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-md transition-colors ${
                activeNav === item
                  ? "text-foreground bg-primary/10 border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-lg font-bold text-foreground">Integrations</h2>
          <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">8 connected</span>
        </div>

        {/* Connected */}
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Connected</h3>
          <div className="grid grid-cols-4 gap-2">
            {connected.map((name) => (
              <div key={name} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">{name}</span>
                  <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">Connected ✓</span>
                </div>
                <button className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">Disconnect</button>
              </div>
            ))}
          </div>
        </div>

        {/* Available by category */}
        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center gap-1.5 mb-2">
                <cat.icon size={12} className="text-muted-foreground" />
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {cat.items.map((item) => (
                  <div key={item.name} className="bg-card border border-border rounded-lg p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-semibold text-foreground">{item.name}</span>
                      {item.titan && (
                        <span className="text-[8px] font-bold bg-warning/15 text-warning px-1.5 py-0.5 rounded">TITAN+</span>
                      )}
                    </div>
                    <button className="text-[10px] font-semibold text-primary border border-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors self-start">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}