import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserUsageRow = {
  id: string;
  user_id: string;
  plan_tier: string;
  email_monthly_limit: number;
  emails_sent_this_month: number;
  api_token_monthly_limit: number;
  api_tokens_used_this_month: number;
  billing_cycle_start: string; // date
  byok_active: boolean;
  updated_at: string | null;
};

/** Returns the current user's user_usage row (or null while loading). */
export function useUserUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UserUsageRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setUsage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_usage" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[useUserUsage] load error", error);
      setUsage(null);
    } else {
      setUsage((data as any) ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { usage, loading, refresh };
}

/** Adds one month to a YYYY-MM-DD billing_cycle_start date. */
export function nextResetDate(billingCycleStart: string | null): string {
  // Monthly cron resets on the 1st of next month at 00:00 UTC.
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
