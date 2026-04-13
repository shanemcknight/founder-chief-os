import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  token_budget: number;
  tokens_used: number;
  created_at: string;
}

const PLAN_DEFAULTS: Partial<Subscription> = {
  plan: "scout",
  status: "active",
  token_budget: 500_000,
  tokens_used: 0,
};

const PLAN_LABELS: Record<string, string> = {
  titan: "TITAN",
  atlas: "ATLAS",
  olympus: "OLYMPUS",
  scout: "SCOUT",
};

export function useSubscription() {
  const { user } = useAuth();
  const verifiedRef = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Subscription> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { ...PLAN_DEFAULTS, user_id: user!.id } as Subscription;
      return data as unknown as Subscription;
    },
  });

  // When ?subscription=success is in the URL, call verify-subscription
  useEffect(() => {
    if (!user?.id || verifiedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") !== "success") return;

    verifiedRef.current = true;
    setIsVerifying(true);

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-subscription");
        console.log("verify-subscription result:", data, error);
        
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("subscription");
        window.history.replaceState({}, "", url.pathname);

        if (data?.verified) {
          const label = PLAN_LABELS[data.plan] || data.plan?.toUpperCase();
          toast.success(`Welcome to ${label}! 🎉`, {
            description: "Your subscription is now active.",
          });
          await query.refetch();
        } else {
          toast.info("Subscription verification pending. Try syncing from Settings → Billing.");
        }
      } catch (err) {
        console.error("verify-subscription error:", err);
        toast.error("Failed to verify subscription. Try Settings → Billing → Sync Plan.");
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [user?.id]);

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    isVerifying,
    refetch: query.refetch,
  };
}
