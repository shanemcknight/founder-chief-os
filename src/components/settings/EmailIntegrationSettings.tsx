import { useState, useEffect } from "react";
import { Mail, Loader2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type EmailAccount = {
  id: string;
  user_id: string;
  provider: "outlook" | "gmail";
  email_address: string;
  display_name: string | null;
  nango_connection_id: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never synced";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `Last synced ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Last synced ${h}h ago`;
  const d = Math.floor(h / 24);
  return `Last synced ${d}d ago`;
}

export default function EmailIntegrationSettings() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<"outlook" | "gmail" | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Email] Load accounts error:", error);
    } else {
      setAccounts((data ?? []) as EmailAccount[]);
    }
    setLoading(false);
  };

  const connectProvider = async (provider: "outlook" | "gmail") => {
    if (!user) return;
    setConnecting(provider);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("You must be logged in to connect");
        return;
      }

      const sessionRes = await supabase.functions.invoke("create-nango-session", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (sessionRes.error) {
        console.error("[Email] Edge function error:", sessionRes.error);
        toast.error("Failed to create connection session");
        return;
      }

      const connectSessionToken = sessionRes.data?.token;
      if (!connectSessionToken) {
        toast.error("No session token returned from server");
        return;
      }

      const { default: Nango } = await import("@nangohq/frontend");
      const nango = new Nango({ connectSessionToken });

      const integrationId = provider === "outlook" ? "microsoft" : "google-mail";
      const result = await nango.auth(integrationId);

      const { error: insertError } = await supabase.from("email_accounts").insert({
        user_id: user.id,
        provider,
        nango_connection_id: result.connectionId,
        email_address: result.connectionId,
        display_name: provider === "outlook" ? "Outlook" : "Gmail",
      });

      if (insertError) {
        console.error("[Email] Insert error:", insertError);
        toast.error(insertError.message || "Failed to save connection");
        return;
      }

      await loadAccounts();
      toast.success(`${provider === "outlook" ? "Outlook" : "Gmail"} connected`);
    } catch (err: any) {
      console.error(`[Email] ${provider} OAuth error:`, err);
      toast.error(err?.message || `Failed to connect ${provider}`);
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = async (account: EmailAccount) => {
    if (!user) return;
    const { error } = await supabase
      .from("email_accounts")
      .delete()
      .eq("id", account.id);

    if (error) {
      toast.error("Failed to disconnect");
      return;
    }
    await loadAccounts();
    toast.success("Account disconnected");
  };

  const triggerSync = async (account: EmailAccount) => {
    setSyncing(account.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("sync-emails", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success(`Synced ${res.data?.synced ?? 0} emails`);
      await loadAccounts();
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error("Email sync failed");
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
        <Loader2 size={14} className="animate-spin" /> Loading email settings…
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Connected accounts section */}
      <div className="flex items-center gap-1.5 mb-2">
        <Inbox size={12} className="text-muted-foreground" />
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Connected Accounts
        </h3>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-3 mb-4">
          <p className="text-[11px] text-muted-foreground">No email accounts connected yet.</p>
        </div>
      ) : (
        <div className="mb-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-card border border-border rounded-lg p-3 mb-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={13} className="text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {account.email_address}
                  </span>
                  <span className="text-[9px] bg-muted text-muted-foreground px-1.5 rounded uppercase">
                    {account.provider}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => triggerSync(account)}
                    disabled={syncing === account.id}
                    className="text-[10px] font-semibold text-primary border border-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {syncing === account.id && <Loader2 size={10} className="animate-spin" />}
                    Sync Now
                  </button>
                  <button
                    onClick={() => disconnect(account)}
                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-[21px]">
                {timeAgo(account.last_synced_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add inbox section */}
      <div className="flex items-center gap-1.5 mb-2">
        <Mail size={12} className="text-muted-foreground" />
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Add Inbox
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Outlook card */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={13} className="text-[#0078D4]" />
            <span className="text-xs font-semibold text-foreground">Microsoft Outlook</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Connect your Outlook or Office 365 inbox
          </p>
          <button
            onClick={() => connectProvider("outlook")}
            disabled={connecting === "outlook"}
            className="text-[10px] font-semibold text-primary border border-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {connecting === "outlook" && <Loader2 size={10} className="animate-spin" />}
            Connect
          </button>
        </div>

        {/* Gmail card */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">G</span>
            </span>
            <span className="text-xs font-semibold text-foreground">Gmail</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Connect your Gmail or Google Workspace inbox
          </p>
          <button
            onClick={() => connectProvider("gmail")}
            disabled={connecting === "gmail"}
            className="text-[10px] font-semibold text-primary border border-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {connecting === "gmail" && <Loader2 size={10} className="animate-spin" />}
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
