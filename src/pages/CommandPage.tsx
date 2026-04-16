import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Minus,
  X,
  CheckCircle2,
} from "lucide-react";
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

type AttentionItem = {
  priority: "HIGH" | "MED" | "FYI";
  text: string;
  btn: string;
  type: "approval" | "email" | "setup";
  id?: string;
};

const kpis: { key: ModalKey; label: string; value: string; barColor: string; trend: string; up: boolean; sparkline: number[] }[] = [
  { key: "revenue", label: "Revenue Today", value: "$4,840", barColor: "bg-accent", trend: "+12%", up: true, sparkline: [30, 45, 38, 55, 48, 62, 58] },
  { key: "agents", label: "Active Agents", value: "7", barColor: "bg-primary", trend: "Stable", up: false, sparkline: [7, 7, 7, 6, 7, 7, 7] },
  { key: "emails", label: "AGENTIC EMAIL INBOX", value: "3", barColor: "bg-primary", trend: "+2 new", up: true, sparkline: [5, 3, 8, 2, 4, 6, 3] },
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
  emails: "AGENTIC EMAIL INBOX",
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

const priorityRank: Record<string, number> = { HIGH: 0, MED: 1, FYI: 2 };

export default function CommandPage() {
  const { isVerifying } = useSubscription();
  const { isSandbox, isProduction, environment } = useEnvironmentData();
  const { profile, user } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = profile?.full_name || "there";

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

    const loadAttention = async () => {
      try {
        const { data: approvals } = await supabase
          .from("proposed_actions")
          .select(`
            id, action_type, draft_content, created_at,
            messages!inner (
              content,
              conversations!inner ( title, user_id )
            )
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        const { data: emails } = await supabase
          .from("emails")
          .select("id, subject, from_name, chief_summary, category, received_at")
          .eq("user_id", user.id)
          .eq("read", false)
          .in("category", ["urgent", "lead"])
          .order("received_at", { ascending: false })
          .limit(5);

        const approvalItems: AttentionItem[] = (approvals || []).map((pa: any) => ({
          priority: "HIGH",
          text: `${pa.messages?.conversations?.title || "Conversation"} — ${pa.action_type}`,
          btn: "Review",
          type: "approval",
          id: pa.id,
        }));

        const emailItems: AttentionItem[] = (emails || []).map((e: any) => ({
          priority: e.category === "urgent" ? "HIGH" : "MED",
          text: e.chief_summary || e.subject || "(no subject)",
          btn: "Reply",
          type: "email",
          id: e.id,
        }));

        const merged = [...approvalItems, ...emailItems]
          .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
          .slice(0, 8);

        if (merged.length === 0 && (emails?.length ?? 0) === 0) {
          setAttentionItems([
            { priority: "FYI", text: "Connect your inbox to see real priority emails", btn: "Connect", type: "setup" },
            { priority: "FYI", text: "Deploy your first agent to start getting approvals", btn: "Deploy", type: "setup" },
          ]);
        } else {
          setAttentionItems(merged);
        }
      } catch (err) {
        console.error("Failed to load attention items", err);
        setAttentionItems([]);
      } finally {
        setAttentionLoading(false);
      }
    };

    loadAttention();
    const interval = setInterval(loadAttention, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAttentionClick = (item: AttentionItem) => {
    if (item.type === "approval") navigate("/agents/approvals");
    else if (item.type === "email") navigate("/inbox/mail");
    else if (item.type === "setup" && item.btn === "Connect") navigate("/settings");
    else if (item.type === "setup" && item.btn === "Deploy") navigate("/agents/new");
  };

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying your subscription with Stripe...</p>
      </div>
    );
  }

  const ModalContent = activeModal ? MODAL_COMPONENTS[activeModal] : null;
  const realCount = attentionItems.filter((i) => i.type !== "setup").length;

  return (
    <div className="space-y-6">
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

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Needs Your Attention</h2>
        {attentionLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-muted/30 animate-pulse h-12 rounded-lg" />
            ))}
          </div>
        ) : attentionItems.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <CheckCircle2 size={16} className="text-success mx-auto" />
            <p className="text-xs text-muted-foreground mt-1">
              All clear — nothing needs your attention right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map((a, i) => (
              <div key={a.id || i} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${priorityBadgeClass[a.priority]}`}>{a.priority}</span>
                  <p className="text-xs md:text-sm text-foreground truncate">{a.text}</p>
                </div>
                <button
                  onClick={() => handleAttentionClick(a)}
                  className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors duration-150 shrink-0 ml-3"
                >
                  {a.btn}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CalendarTimeline />

      <ConnectedToolsGrid />

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
