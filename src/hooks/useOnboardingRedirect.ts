import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * On first login (after approval), if the user has no email accounts and no
 * conversations yet, send them through the onboarding flow. Once
 * `onboarding_complete` is true on their profile, this never fires again.
 */
export function useOnboardingRedirect() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading || checked) return;
    if (!user || !profile) return;
    if (!profile.approved) return;

    // Don't redirect if already on onboarding/auth/marketing routes
    const skipPaths = ["/onboarding", "/login", "/", "/beta", "/privacy", "/terms"];
    if (skipPaths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))) {
      return;
    }

    // Check the flag separately since it isn't on the profile context type
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.onboarding_complete) {
        setChecked(true);
        return;
      }

      const [emailRes, convoRes] = await Promise.all([
        supabase
          .from("email_accounts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const noEmails = (emailRes.count ?? 0) === 0;
      const noConvos = (convoRes.count ?? 0) === 0;
      setChecked(true);

      if (noEmails && noConvos) {
        navigate("/onboarding", { replace: true });
      }
    })();
  }, [user, profile, loading, location.pathname, navigate, checked]);
}
