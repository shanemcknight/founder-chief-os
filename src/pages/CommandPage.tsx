import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUpRight, Minus, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useEnvironmentData } from "@/hooks/useEnvironmentData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  { key: "emails", label: "AGENTIC EMAIL INBOX", value: "3", barColor: "bg-primary", trend: "+2 new", up: true, sparkline: [5, 3, 8, 2, 4, 6, 3] },
  { key: "social", label: "Social Reach", value: "12.4K", barColor: "bg-success", trend: "+18%", up: true, sparkline: [8, 10, 9, 11, 10, 12, 12.4] },
];

const MODAL_TITLES: Record<NonNullable<ModalKey>, string> = {
  revenue: "Revenue Dashboard",
  agents: "Active Agents",
  emails: "AGENTIC EMAIL INBOX",
  social: "Social Reach",
};

const MODAL_COMPONENTS: Record<NonNullable<ModalKey>, React.FC> = {
  revenue: RevenueDashboard,
  agents: ActiveAgentsOrgChart,
  emails: EmailsPendingDashboard,
  social: SocialReachDashboard,
};

export default function CommandPage() {
  const { isVerifying } = useSubscription();
  useEnvironmentData();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [agentCount, setAgentCount] = useState<number>(0);
  const location = useLocation();

  useEffect(() => {
    setActiveModal(null);
  }, [location.key]);

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activeModal]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadCount = async () => {
      const { count } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!cancelled) setAgentCount(count ?? 0);
    };
    loadCount();
    const interval = setInterval(loadCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

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
    <div className="flex flex-col h-full space-y-4">
      {/* Subtitle */}
      <p className="text-[11px] text-muted-foreground">
        {agentCount} agents active · Last sync just now
      </p>

      {/* KPI Cards — clickable to open modals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setActiveModal(kpi.key)}
            className="bg-card border border-border rounded-lg p-2.5 relative overflow-hidden text-left cursor-pointer hover:border-primary/50 transition-colors duration-150"
          >
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${kpi.barColor}`} />
            <p className="text-[10px] text-muted-foreground mb-0.5">{kpi.label}</p>
            <p className="text-base md:text-lg font-bold text-foreground">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {kpi.up ? <ArrowUpRight size={10} className="text-success" /> : <Minus size={10} className="text-muted-foreground" />}
              <span className={`text-[9px] ${kpi.up ? "text-success" : "text-muted-foreground"}`}>{kpi.trend}</span>
            </div>
          </button>
        ))}
      </div>

      <ConnectedToolsGrid />

      <div className="flex-1 min-h-0">
        <CalendarTimeline />
      </div>

      {/* Dashboard Modal Overlay */}
      {activeModal && ModalContent && (
        <div className="fixed left-0 right-0 bottom-0 z-50 flex flex-col" style={{ top: 56 }}>
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setActiveModal(null)}
          />
          <div className="relative mt-auto w-full h-full bg-card border-t border-border rounded-t-xl overflow-auto animate-fade-in">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-card border-b border-border">
              <h2 className="text-base font-semibold text-foreground">{MODAL_TITLES[activeModal]}</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <ModalContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
