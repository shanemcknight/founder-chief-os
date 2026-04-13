import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Zap, CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PLAN_LABELS: Record<string, string> = {
  scout: "SCOUT",
  titan: "TITAN",
  atlas: "ATLAS",
  olympus: "OLYMPUS",
};

const TOKEN_LABELS: Record<string, string> = {
  scout: "500K",
  titan: "10M",
  atlas: "20M",
  olympus: "50M",
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function BillingSettings() {
  const { subscription, isLoading, refetch } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const handleSyncPlan = async () => {
    setSyncLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-subscription");
      if (error) throw error;
      if (data?.verified) {
        toast.success(`Plan synced: ${(data.plan || "").toUpperCase()}`);
      } else {
        toast.info("No active Stripe subscription found.");
      }
      refetch();
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Failed to sync plan with Stripe.");
    } finally {
      setSyncLoading(false);
    }
  };

  const plan = subscription?.plan || "scout";
  const tokensUsed = subscription?.tokens_used || 0;
  const tokenBudget = subscription?.token_budget || 500_000;
  const usagePercent = Math.min((tokensUsed / tokenBudget) * 100, 100);
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const resp = await supabase.functions.invoke("stripe-portal", {
        body: { returnUrl: window.location.href },
      });
      if (resp.data?.url) {
        window.location.href = resp.data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading billing info...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Billing & Plan</h2>

      {/* Current Plan Card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold text-foreground">{PLAN_LABELS[plan] || plan.toUpperCase()}</h3>
          <span className="text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded">Current Plan</span>
        </div>
        {plan !== "scout" && periodEnd && (
          <p className="text-xs text-muted-foreground mb-4">
            Renews {periodEnd}
          </p>
        )}

        {/* Token Usage */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap size={11} className="text-primary" /> Token Usage
            </span>
            <span className="text-foreground font-medium">
              {formatTokens(tokensUsed)} / {TOKEN_LABELS[plan] || formatTokens(tokenBudget)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 90 ? "bg-destructive" : usagePercent > 70 ? "bg-warning" : "bg-primary"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {periodEnd && (
            <p className="text-[10px] text-muted-foreground mt-1">Resets {periodEnd}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {plan === "scout" ? (
            <a
              href="/pricing"
              className="text-xs font-semibold text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
            >
              Upgrade Plan
            </a>
          ) : (
            <>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="text-xs font-semibold text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
              >
                <CreditCard size={12} />
                {portalLoading ? "Loading..." : "Manage Subscription"}
                <ExternalLink size={10} />
              </button>
              <a
                href="/pricing"
                className="text-xs font-medium text-muted-foreground border border-border px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                Change Plan
              </a>
            </>
          )}
          <button
            onClick={handleSyncPlan}
            disabled={syncLoading}
            className="text-xs font-medium text-muted-foreground border border-border px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncLoading ? "animate-spin" : ""} />
            {syncLoading ? "Syncing..." : "Sync Plan with Stripe"}
          </button>
        </div>
      </div>

      {usagePercent > 90 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <p className="text-xs text-foreground font-medium mb-1">⚠️ Token limit almost reached</p>
          <p className="text-[11px] text-muted-foreground">
            You've used {formatTokens(tokensUsed)} of your {TOKEN_LABELS[plan]} monthly tokens.{" "}
            <a href="/pricing" className="text-primary hover:underline">Upgrade</a> or connect your own Anthropic key in Settings → Chief Settings for unlimited access.
          </p>
        </div>
      )}
    </div>
  );
}
