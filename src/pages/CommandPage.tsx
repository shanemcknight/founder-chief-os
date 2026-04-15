import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Minus,
  X,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import CalendarTimeline from "@/components/dashboard/CalendarTimeline";
import ConnectedToolsGrid from "@/components/dashboard/ConnectedToolsGrid";
import ActiveAgentsOrgChart from "@/components/dashboard/ActiveAgentsOrgChart";
import EmailsPendingDashboard from "@/components/dashboard/EmailsPendingDashboard";
import SocialReachDashboard from "@/components/dashboard/SocialReachDashboard";
import RevenueDashboard from "@/components/dashboard/RevenueDashboard";

type ModalKey = "revenue" | "agents" | "emails" | "social" | null;

const kpis: { key: ModalKey; label: string; value: string; barColor: string; trend: string; up: boolean; sparkline: number[] }[] = [
  { key: "revenue", label: "Revenue Today", value: "$4,840", barColor: "bg-accent", trend: "+12%", up: true, sparkline: [30, 45, 38, 55, 48, 62, 58] },
  { key: "agents", label: "Active Agents", value: "7", barColor: "bg-primary", trend: "Stable", up: false, sparkline: [7, 7, 7, 6, 7, 7, 7] },
  { key: "emails", label: "AGENTIC EMAIL", value: "3", barColor: "bg-primary", trend: "+2 new", up: true, sparkline: [5, 3, 8, 2, 4, 6, 3] },
  { key: "social", label: "Social Reach", value: "12.4K", barColor: "bg-success", trend: "+18%", up: true, sparkline: [8, 10, 9, 11, 10, 12, 12.4] },
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

const MODAL_TITLES: Record<NonNullable<ModalKey>, string> = {
  revenue: "Revenue Dashboard",
  agents: "Active Agents",
  emails: "AGENTIC EMAIL",
  social: "Social Reach",
};

const MODAL_COMPONENTS: Record<NonNullable<ModalKey>, React.FC> = {
  revenue: RevenueDashboard,
  agents: ActiveAgentsOrgChart,
  emails: EmailsPendingDashboard,
  social: SocialReachDashboard,
};

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
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const location = useLocation();

  // Close modal when navigating (e.g. logo click)
  useEffect(() => {
    setActiveModal(null);
  }, [location.key]);
  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activeModal]);

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying your subscription with Stripe...</p>
      </div>
    );
  }

  const ModalContent = activeModal ? MODAL_COMPONENTS[activeModal] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-[22px] font-bold text-foreground">Good morning, Shane.</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          7 agents active · 3 items need your attention · Last action 12 min ago
        </p>
      </div>

      {/* KPI Cards — clickable to open modals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setActiveModal(kpi.key)}
            className="bg-card border border-border rounded-xl p-4 relative overflow-hidden text-left cursor-pointer hover:border-primary/50 transition-colors duration-150"
          >
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${kpi.barColor}`} />
            <p className="text-[11px] text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-xl md:text-[22px] font-bold text-foreground">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.up ? <ArrowUpRight size={10} className="text-success" /> : <Minus size={10} className="text-muted-foreground" />}
              <span className={`text-[10px] ${kpi.up ? "text-success" : "text-muted-foreground"}`}>{kpi.trend}</span>
            </div>
            <Sparkline data={kpi.sparkline} color={kpi.up ? "hsl(142 71% 45%)" : "hsl(220 4% 57%)"} />
          </button>
        ))}
      </div>

      <CalendarTimeline />

      <ConnectedToolsGrid />

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

      {/* Dashboard Modal Overlay */}
      {activeModal && ModalContent && (
        <div className="fixed left-0 right-0 bottom-0 z-50 flex flex-col" style={{ top: 56 }}>
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setActiveModal(null)}
          />
          {/* Modal panel — slides up from bottom */}
          <div
            className="relative mt-auto w-full h-full bg-card border-t border-border rounded-t-xl overflow-auto animate-fade-in"
          >
            {/* Header bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-card border-b border-border">
              <h2 className="text-base font-semibold text-foreground">{MODAL_TITLES[activeModal]}</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {/* Dashboard content */}
            <div className="p-6">
              <ModalContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
