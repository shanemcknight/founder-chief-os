const connected = ["Gmail", "Shopify", "Amazon", "Klaviyo", "Stripe", "QuickBooks", "LinkedIn", "Apollo"];
const available = ["Outlook", "Discord", "Telegram", "WhatsApp", "Xero", "Meta Ads", "Google Ads", "HubSpot", "Notion", "Airtable", "GitHub", "Twilio", "Pinterest", "TikTok", "Facebook", "WordPress", "Walmart", "eBay"];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Connected Integrations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {connected.map((name) => (
            <div key={name} className="bg-card border border-success/30 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-foreground">{name}</span>
              <span className="w-2 h-2 rounded-full bg-success" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Available Integrations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {available.map((name) => (
            <div key={name} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between hover:border-primary/50 transition-colors duration-150 cursor-pointer">
              <span className="text-sm text-foreground">{name}</span>
              <span className="text-xs text-primary">+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
