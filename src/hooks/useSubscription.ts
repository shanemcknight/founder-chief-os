import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export function useSubscription() {
  const { user } = useAuth();
  const verifiedRef = useRef(false);

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

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-subscription");
        console.log("verify-subscription result:", data, error);
        if (data?.verified) {
          // Remove query param and refetch
          const url = new URL(window.location.href);
          url.searchParams.delete("subscription");
          window.history.replaceState({}, "", url.pathname);
          query.refetch();
        }
      } catch (err) {
        console.error("verify-subscription error:", err);
      }
    };

    verify();
  }, [user?.id]);

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
