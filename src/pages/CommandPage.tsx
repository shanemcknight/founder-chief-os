import {
  ShoppingBag,
  Package,
  MailOpen,
  CreditCard,
  Calculator,
  BarChart3,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const kpis = [
  { label: "Revenue Today", value: "$4,840", barColor: "bg-accent", trend: "+12%", up: true, sparkline: [30, 45, 38, 55, 48, 62, 58] },
  { label: "Active Agents", value: "7", barColor: "bg-primary", trend: "Stable", up: false, sparkline: [7, 7, 7, 6, 7, 7, 7] },
  { label: "Emails Pending", value: "3", barColor: "bg-primary", trend: "+2 new", up: true, sparkline: [5, 3, 8, 2, 4, 6, 3] },
  { label: "Social Reach", value: "12.4K", barColor: "bg-success", trend: "+18%", up: true, sparkline: [8, 10, 9, 11, 10, 12, 12.4] },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 18;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="mt-1">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const toolStatus: Record<string, string> = {
  Shopify: "bg-success",
  Amazon: "bg-destructive",
  Klaviyo: "bg-success",
  Stripe: "bg-success",
  QuickBooks: "bg-success",
  "Google Analytics": "bg-success",
};

const tools = [
  { name: "Shopify", icon: ShoppingBag, metrics: ["$4,840 today", "23 orders", "2 flagged"] },
  { name: "Amazon", icon: Package, metrics: ["$2,210 today", "18 orders", "1 suppressed listing"] },
  { name: "Klaviyo", icon: MailOpen, metrics: ["38.2% open rate", "1 campaign live", "3,068 subscribers"] },
  { name: "Stripe", icon: CreditCard, metrics: ["$1,630 today", "0 failed payments", "14 active subscriptions"] },
  { name: "QuickBooks", icon: Calculator, metrics: ["$4,200 outstanding", "2 invoices due", "Next payroll Friday"] },
  { name: "Google Analytics", icon: BarChart3, metrics: ["1,842 sessions", "3.4% conversion", "+18% vs last week"] },
];

const priorityBadgeClass: Record<string, string> = {
  HIGH: "bg-destructive/15 text-destructive",
  MED: "bg-warning/15 text-warning",
  FYI: "bg-muted text-muted-foreground",
};

const actions = [
  { priority: "HIGH", text: "Wholesale lead email from Austin — Barrel & Oak", btn: "Reply" },
  { priority: "HIGH", text: "Amazon listing suppressed: Ginger Beer BIB", btn: "Review" },
  { priority: "MED", text: "Invoice #1042 overdue $840", btn: "Pay Now" },
  { priority: "MED", text: "LinkedIn post scheduled for today, not yet approved", btn: "Preview" },
  { priority: "FYI", text: "Agent Cipher has 3 consecutive errors", btn: "Fix" },
];

export default function CommandPage() {
  const { isVerifying } = useSubscription();

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying your subscription with Stripe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-[22px] font-bold text-foreground">Good morning, Shane.</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          7 agents active · 3 items need your attention · Last action 12 min ago
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${kpi.barColor}`} />
            <p className="text-[11px] text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl md:text-[22px] font-bold text-foreground">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.up ? <ArrowUpRight size={10} className="text-success" /> : <Minus size={10} className="text-muted-foreground" />}
              <span className={`text-[10px] ${kpi.up ? "text-success" : "text-muted-foreground"}`}>{kpi.trend}</span>
            </div>
            <Sparkline data={kpi.sparkline} color={kpi.up ? "hsl(142 71% 45%)" : "hsl(220 4% 57%)"} />
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Connected Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.name} className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors duration-150">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                  <span className={`w-2 h-2 rounded-full ml-auto ${toolStatus[tool.name]}`} />
                </div>
                <div className="space-y-0.5">
                  {tool.metrics.map((m, i) => (
                    <p key={i} className={`text-xs ${i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{m}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Needs Your Attention</h2>
        <div className="space-y-2">
          {actions.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${priorityBadgeClass[a.priority]}`}>{a.priority}</span>
                <p className="text-xs md:text-sm text-foreground truncate">{a.text}</p>
              </div>
              <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors duration-150 shrink-0 ml-3">
                {a.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
