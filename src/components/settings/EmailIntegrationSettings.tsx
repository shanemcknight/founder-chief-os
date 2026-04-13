import { useState, useEffect } from "react";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function EmailIntegrationSettings() {
  const { user } = useAuth();
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [connectionEmail, setConnectionEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "outlook")
      .maybeSingle();

    if (data) {
      setOutlookConnected(true);
      setConnectionEmail(data.nango_connection_id);
    }
    setLoading(false);
  };

  const connectOutlook = async () => {
    if (!user) return;
    setConnecting(true);
    try {
      console.log("[Outlook] Connect button clicked");

      // 1. Get connect session token from backend
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("You must be logged in to connect Outlook");
        return;
      }
      console.log("[Outlook] Calling create-nango-session edge function...");

      const sessionRes = await supabase.functions.invoke("create-nango-session", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      console.log("[Outlook] Edge function response:", sessionRes);

      if (sessionRes.error) {
        console.error("[Outlook] Edge function error:", sessionRes.error);
        toast.error("Failed to create connection session");
        return;
      }

      const connectSessionToken = sessionRes.data?.token;
      if (!connectSessionToken) {
        console.error("[Outlook] No token in response:", sessionRes.data);
        toast.error("No session token returned from server");
        return;
      }
      console.log("[Outlook] Session token received:", connectSessionToken.substring(0, 20) + "...");

      // 2. Init Nango with connect session token and open UI
      console.log("[Outlook] Importing @nangohq/frontend...");
      const { default: Nango } = await import("@nangohq/frontend");
      console.log("[Outlook] Nango SDK loaded, initializing with connectSessionToken...");

      const nango = new Nango({ connectSessionToken });
      console.log("[Outlook] Calling nango.auth('microsoft-outlook')...");

      const result = await nango.auth("microsoft-outlook", user.id, {
        detectClosedAuthWindow: true,
      });
      console.log("[Outlook] nango.auth() result:", result);

      // 3. Store connection
      await supabase.from("user_integrations").upsert(
        {
          user_id: user.id,
          provider: "outlook",
          nango_connection_id: result.connectionId,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

      setOutlookConnected(true);
      setConnectionEmail(result.connectionId);
      toast.success("Outlook connected successfully");
    } catch (err: any) {
      console.error("[Outlook] OAuth error:", err);
      toast.error(err?.message || "Failed to connect Outlook");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectOutlook = async () => {
    if (!user) return;
    await supabase
      .from("user_integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "outlook");

    setOutlookConnected(false);
    setConnectionEmail(null);
    toast.success("Outlook disconnected");
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("sync-emails", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success(`Synced ${res.data?.synced ?? 0} emails`);
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error("Email sync failed");
    } finally {
      setSyncing(false);
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
      <div className="flex items-center gap-1.5 mb-2">
        <Mail size={12} className="text-muted-foreground" />
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</h3>
      </div>

      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-foreground">Microsoft Outlook</span>
            {outlookConnected && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Connected · {connectionEmail}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {outlookConnected ? (
              <>
                <button
                  onClick={triggerSync}
                  disabled={syncing}
                  className="text-[10px] font-semibold text-primary border border-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {syncing && <Loader2 size={10} className="animate-spin" />}
                  Sync Now
                </button>
                <button
                  onClick={disconnectOutlook}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectOutlook}
                disabled={connecting}
                className="text-[10px] font-semibold text-primary border border-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {connecting && <Loader2 size={10} className="animate-spin" />}
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
