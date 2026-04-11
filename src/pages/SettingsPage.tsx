import { useState } from "react";
import { Mail, ShoppingBag, BarChart3, Share2, Users, Wrench, X, Download, CreditCard } from "lucide-react";

const navItems = ["Account", "Team", "Integrations", "Chief Settings", "Billing", "API & Webhooks", "Notifications"];

const connected = ["Gmail", "Shopify", "Amazon", "Klaviyo", "Stripe", "QuickBooks", "LinkedIn", "Apollo"];

type Integration = { name: string; titan?: boolean };
const categories: { label: string; icon: typeof Mail; items: Integration[] }[] = [
  { label: "Communication", icon: Mail, items: [{ name: "Outlook" }, { name: "Discord" }, { name: "Telegram" }, { name: "WhatsApp Business", titan: true }] },
  { label: "Commerce", icon: ShoppingBag, items: [{ name: "Walmart", titan: true }, { name: "eBay", titan: true }] },
  { label: "Marketing", icon: BarChart3, items: [{ name: "Meta Ads", titan: true }, { name: "Google Ads", titan: true }, { name: "Google Analytics" }, { name: "Mailchimp" }] },
  { label: "Social", icon: Share2, items: [{ name: "Instagram" }, { name: "TikTok", titan: true }, { name: "Pinterest" }, { name: "Facebook" }] },
  { label: "CRM & Sales", icon: Users, items: [{ name: "HubSpot" }, { name: "Pipedrive" }] },
  { label: "Productivity", icon: Wrench, items: [{ name: "Notion" }, { name: "Airtable", titan: true }, { name: "Google Calendar" }, { name: "GitHub", titan: true }] },
];

const teamMembers = [
  { name: "Shane McKnight", role: "Owner", pillars: "All pillars", status: "Active" as const },
  { name: "Maria Santos", role: "Manager", pillars: "STORY + PUBLISH", status: "Active" as const },
  { name: "James T.", role: "Member", pillars: "SALES", status: "Active" as const },
  { name: "pending@email.com", role: "Member", pillars: "INBOX", status: "Pending" as const },
];

const allPillars = ["COMMAND", "STORY", "SALES", "INBOX", "PUBLISH", "CHIEF", "BUILD"];
const defaultChecked = ["STORY", "PUBLISH"];

const invoices = [
  { date: "Apr 1, 2026", amount: "$49.00", status: "Paid" },
  { date: "Mar 1, 2026", amount: "$49.00", status: "Paid" },
  { date: "Feb 1, 2026", amount: "$49.00", status: "Paid" },
];

const plans = [
  { name: "HERO", price: "$0", period: "/month", features: ["1 seat", "3 agents", "1,000 runs/mo", "5 integrations"], current: false },
  { name: "TITAN", price: "$49", period: "/month", features: ["5 seats", "Unlimited agents", "100,000 runs/mo", "All integrations"], current: true },
  { name: "OLYMPUS", price: "$149", period: "/month", features: ["25 seats", "Unlimited agents", "500,000 runs/mo", "Priority support", "Custom branding"], current: false },
];

export default function SettingsPage() {
  const [activeNav, setActiveNav] = useState("Team");
  const [showInvite, setShowInvite] = useState(true);

  return (
    <div className="flex gap-6 h-full min-h-0">
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

      <div className="flex-1 overflow-y-auto min-h-0">

        {/* TEAM */}
        {activeNav === "Team" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Team Members</h2>
              <button onClick={() => setShowInvite(true)} className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Invite Member +
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted-foreground">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Pillars</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3 text-xs text-foreground font-medium">{m.name}</td>
                      <td className="p-3 text-xs text-muted-foreground">{m.role}</td>
                      <td className="p-3 text-xs text-muted-foreground">{m.pillars}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          m.status === "Active" ? "bg-emerald-500/15 text-emerald-400" : "bg-warning/15 text-warning"
                        }`}>{m.status}</span>
                      </td>
                      <td className="p-3">
                        {m.role === "Owner" ? (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        ) : m.status === "Pending" ? (
                          <div className="flex gap-2">
                            <button className="text-[10px] text-primary hover:underline">Resend</button>
                            <button className="text-[10px] text-muted-foreground hover:text-destructive">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button className="text-[10px] text-primary hover:underline">Edit</button>
                            <button className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground mb-6">Seats used: <span className="text-foreground font-medium">4 of 5</span> included in TITAN. Add more at $9/seat/month.</p>

            {showInvite && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-foreground">Invite Team Member</h3>
                    <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Email Address</label>
                      <input placeholder="name@company.com" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Role</label>
                      <select defaultValue="Member" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                        <option>Admin</option><option>Manager</option><option>Member</option><option>Viewer</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Pillar Access</label>
                      <div className="flex flex-wrap gap-2">
                        {allPillars.map((p) => (
                          <label key={p} className="flex items-center gap-1.5 text-[11px] text-foreground">
                            <input type="checkbox" defaultChecked={defaultChecked.includes(p)} className="rounded border-border accent-primary" />
                            {p}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Send Invite</button>
                    <button onClick={() => setShowInvite(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BILLING */}
        {activeNav === "Billing" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">Billing & Plan</h2>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-foreground">TITAN</h3>
                <span className="text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded">Current Plan</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">$49/month · Renews May 11, 2026</p>
              <div className="space-y-2 mb-4">
                {[
                  { label: "Seats", used: 4, total: 5 },
                  { label: "Agents", used: 7, total: 999, display: "7 of unlimited" },
                  { label: "Runs", used: 47203, total: 100000, display: "47,203 of 100,000" },
                ].map((u) => (
                  <div key={u.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">{u.label}</span>
                      <span className="text-foreground font-medium">{u.display || `${u.used} of ${u.total}`}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((u.used / u.total) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button className="text-xs font-semibold text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">Upgrade to OLYMPUS</button>
                <button className="text-xs font-medium text-muted-foreground border border-border px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors">Manage Payment Method</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {plans.map((p) => (
                <div key={p.name} className={`bg-card border rounded-xl p-4 ${p.current ? "border-primary ring-1 ring-primary/30" : "border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                    {p.current && <span className="text-[8px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded">CURRENT</span>}
                  </div>
                  <p className="text-xl font-bold text-foreground mb-3">{p.price}<span className="text-xs font-normal text-muted-foreground">{p.period}</span></p>
                  <ul className="space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-[11px] text-muted-foreground">✓ {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Invoice History</h3>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] text-muted-foreground">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.date} className="border-b border-border last:border-0">
                        <td className="p-3 text-xs text-foreground">{inv.date}</td>
                        <td className="p-3 text-xs text-foreground">{inv.amount}</td>
                        <td className="p-3"><span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">{inv.status}</span></td>
                        <td className="p-3"><button className="text-[10px] text-primary hover:underline flex items-center gap-1"><Download size={10} /> PDF</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
              <CreditCard size={16} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">Visa ending 4242</p>
                <p className="text-[11px] text-muted-foreground">Expires 08/27</p>
              </div>
              <button className="text-[10px] text-primary hover:underline">Update</button>
            </div>
          </div>
        )}

        {/* INTEGRATIONS */}
        {activeNav === "Integrations" && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg font-bold text-foreground">Integrations</h2>
              <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">8 connected</span>
            </div>
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
                          {item.titan && <span className="text-[8px] font-bold bg-warning/15 text-warning px-1.5 py-0.5 rounded">TITAN+</span>}
                        </div>
                        <button className="text-[10px] font-semibold text-primary border border-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors self-start">Connect</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!["Team", "Billing", "Integrations"].includes(activeNav) && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">{activeNav}</h2>
            <p className="text-sm text-muted-foreground">This section is coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
