import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the live count of pending proposed_actions for the current user.
 * Polls every 30s. Returns 0 when not authenticated.
 */
export function usePendingApprovalsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        if (!cancelled) setCount(0);
        return;
      }
      const { count: c } = await supabase
        .from("proposed_actions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (!cancelled) setCount(c ?? 0);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return count;
}
