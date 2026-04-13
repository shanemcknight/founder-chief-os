import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle, Info, CheckCircle2, X, RefreshCw, Eye } from "lucide-react";

const alertConfig: Record<string, { icon: any; borderColor: string; label: string }> = {
  post_failed: { icon: XCircle, borderColor: "border-l-destructive", label: "Post Failed" },
  post_warning: { icon: AlertTriangle, borderColor: "border-l-[hsl(var(--warning))]", label: "Post Warning" },
  system: { icon: Info, borderColor: "border-l-[#3B82F6]", label: "System" },
  manual_due: { icon: AlertTriangle, borderColor: "border-l-[hsl(var(--warning))]", label: "Manual Post Due" },
  email_urgent: { icon: AlertTriangle, borderColor: "border-l-destructive", label: "Urgent Email" },
  success: { icon: CheckCircle2, borderColor: "border-l-[hsl(var(--success))]", label: "Success" },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Demo alerts
const demoAlerts = [
  {
    id: "alert-1",
    type: "post_failed",
    message: "Instagram Reel 'Behind the Barrel' failed to publish — API rate limit exceeded. Retry recommended.",
    read: false,
    action_url: "/social/calendar",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "alert-2",
    type: "post_warning",
    message: "TikTok video scheduled for 3pm is missing a thumbnail. CHIEF recommends adding one before it goes live.",
    read: false,
    action_url: "/social/pipeline",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "alert-3",
    type: "system",
    message: "Gmail sync completed — 12 new emails imported and triaged by CHIEF.",
    read: false,
    action_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "alert-4",
    type: "success",
    message: "LinkedIn carousel 'Q2 Mixer Trends' published successfully. Reach: 1.2k in first hour.",
    read: false,
    action_url: "/social/performance",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export default function InboxAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setAlerts(data && data.length > 0 ? data : demoAlerts);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Auto-dismiss success alerts
  useEffect(() => {
    const successAlerts = alerts.filter((a) => a.type === "success" && !dismissedIds.has(a.id));
    successAlerts.forEach((a) => {
      setTimeout(() => {
        setDismissedIds((prev) => new Set(prev).add(a.id));
      }, 5000);
    });
  }, [alerts]);

  const handleDismiss = async (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const handleClearResolved = () => {
    const resolved = alerts.filter((a) => a.type === "success" || a.read);
    resolved.forEach((a) => setDismissedIds((prev) => new Set(prev).add(a.id)));
    toast.success("Cleared resolved alerts");
  };

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full -m-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={20} className="text-[hsl(var(--success))]" />
          </div>
          <p className="text-sm font-medium text-foreground">No alerts.</p>
          <p className="text-xs text-muted-foreground mt-1">Everything is running clean.</p>
        </div>
      </div>
    );
  }

  const hasResolved = alerts.some((a) => a.type === "success" || a.read);

  return (
    <div className="p-6 -m-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Alerts</h1>
        {hasResolved && (
          <button
            onClick={handleClearResolved}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear All Resolved
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visibleAlerts.map((alert) => {
          const config = alertConfig[alert.type] || alertConfig.system;
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                "bg-card border border-border rounded-lg p-4 border-l-[3px] transition-all duration-300",
                config.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                <Icon
                  size={16}
                  className={cn(
                    alert.type === "post_failed" && "text-destructive",
                    alert.type === "post_warning" && "text-[hsl(var(--warning))]",
                    alert.type === "system" && "text-[#3B82F6]",
                    alert.type === "success" && "text-[hsl(var(--success))]",
                    alert.type === "manual_due" && "text-[hsl(var(--warning))]",
                    alert.type === "email_urgent" && "text-destructive"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{config.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(alert.created_at)}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>

                  <div className="flex items-center gap-2 mt-3">
                    {alert.type === "post_failed" && (
                      <>
                        <button className="text-[11px] font-medium text-foreground border border-border px-2.5 py-1 rounded hover:bg-muted/30 transition-colors flex items-center gap-1">
                          <Eye size={10} /> View Post
                        </button>
                        <button
                          onClick={() => toast.success("Retrying...")}
                          className="text-[11px] font-medium bg-[#B54165] text-white px-2.5 py-1 rounded hover:bg-[#B54165]/90 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw size={10} /> Retry Now
                        </button>
                      </>
                    )}
                    {alert.type === "post_warning" && (
                      <button className="text-[11px] font-medium text-foreground border border-border px-2.5 py-1 rounded hover:bg-muted/30 transition-colors">
                        Review
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
