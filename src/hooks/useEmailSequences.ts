import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type EmailSequenceRow = {
  id: string;
  user_id: string;
  contact_id: string | null;
  pipeline_id: string | null;
  sequence_name: string;
  sequence_step: number;
  status: string; // pending | sent | replied | unsubscribed | paused | completed
  next_send_at: string | null;
  last_sent_at: string | null;
  created_at: string;
};

/**
 * Fetches all email_sequences rows for the current user and exposes
 * the most relevant enrollment per contact (active over completed).
 */
export function useEmailSequences() {
  const { user } = useAuth();
  const [sequences, setSequences] = useState<EmailSequenceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSequences([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("email_sequences" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[useEmailSequences] load error", error);
      setSequences([]);
    } else {
      setSequences(((data as any[]) || []) as EmailSequenceRow[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: keep in sync as enrollments change
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`email_sequences_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_sequences",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  /** Returns the most relevant enrollment for a contact:
   * pending > paused > completed > others. Most recent within group. */
  const getActiveForContact = (contactId: string): EmailSequenceRow | null => {
    const rows = sequences.filter((s) => s.contact_id === contactId);
    if (rows.length === 0) return null;
    const rank = (s: string) => {
      switch (s) {
        case "pending":
          return 0;
        case "paused":
          return 1;
        case "completed":
          return 2;
        case "unsubscribed":
          return 3;
        default:
          return 4;
      }
    };
    return [...rows].sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    })[0];
  };

  /** All rows for a contact, newest first. */
  const getHistoryForContact = (contactId: string): EmailSequenceRow[] =>
    sequences
      .filter((s) => s.contact_id === contactId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

  return { sequences, loading, refresh, getActiveForContact, getHistoryForContact };
}
