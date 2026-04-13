import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface InboxCounts {
  mail: number;
  approvals: number;
  queue: number;
  alerts: number;
  total: number;
}

export function useInboxCounts(): InboxCounts {
  const { user } = useAuth();
  const [counts, setCounts] = useState<InboxCounts>({
    mail: 0,
    approvals: 0,
    queue: 0,
    alerts: 0,
    total: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      // Unread emails
      const { count: mailCount } = await supabase
        .from("emails")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .eq("archived", false);

      // Pending approvals (social posts with status 'approved' and post_type 'manual' that haven't been posted)
      const { count: approvalCount } = await supabase
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      // Queue (manual posts that are approved and due)
      const { count: queueCount } = await supabase
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("post_type", "manual")
        .eq("status", "approved");

      // Unread alerts
      const { count: alertCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      const m = mailCount ?? 0;
      const a = approvalCount ?? 0;
      const q = queueCount ?? 0;
      const al = alertCount ?? 0;

      setCounts({
        mail: m,
        approvals: a,
        queue: q,
        alerts: al,
        total: m + a + q + al,
      });
    };

    fetchCounts();

    // Realtime subscriptions
    const emailChannel = supabase
      .channel("inbox-emails")
      .on("postgres_changes", { event: "*", schema: "public", table: "emails" }, fetchCounts)
      .subscribe();

    const notifChannel = supabase
      .channel("inbox-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchCounts)
      .subscribe();

    const postsChannel = supabase
      .channel("inbox-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_posts" }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(emailChannel);
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [user]);

  return counts;
}
