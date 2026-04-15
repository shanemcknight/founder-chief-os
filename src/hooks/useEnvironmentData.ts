import { useAuth } from "@/contexts/AuthContext";

// Mock data for sandbox mode
const SANDBOX_KPIS = {
  revenue: { value: "$4,840", trend: "+12%", up: true, sparkline: [30, 45, 38, 55, 48, 62, 58] },
  agents: { value: "7", trend: "Stable", up: false, sparkline: [7, 7, 7, 6, 7, 7, 7] },
  emails: { value: "3", trend: "+2 new", up: true, sparkline: [5, 3, 8, 2, 4, 6, 3] },
  social: { value: "12.4K", trend: "+18%", up: true, sparkline: [8, 10, 9, 11, 10, 12, 12.4] },
};

const SANDBOX_ACTIONS = [
  { priority: "HIGH" as const, text: "Wholesale lead email from Austin — Barrel & Oak", btn: "Reply" },
  { priority: "HIGH" as const, text: "Amazon listing suppressed: Ginger Beer BIB", btn: "Review" },
  { priority: "MED" as const, text: "Invoice #1042 overdue $840", btn: "Pay Now" },
  { priority: "MED" as const, text: "LinkedIn post scheduled for today, not yet approved", btn: "Preview" },
  { priority: "FYI" as const, text: "Agent Cipher has 3 consecutive errors", btn: "Fix" },
];

export function useEnvironmentData() {
  const { profile } = useAuth();
  const isProduction = profile?.environment === "production";
  const isSandbox = !isProduction;

  return {
    isProduction,
    isSandbox,
    isAdmin: profile?.is_admin ?? false,
    environment: profile?.environment ?? "sandbox",
    // KPI data — production would fetch real data, sandbox uses mock
    kpis: SANDBOX_KPIS,
    actions: SANDBOX_ACTIONS,
  };
}
