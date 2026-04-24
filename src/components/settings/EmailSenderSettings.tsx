import { useEffect, useState } from "react";
import { Mail, Loader2, AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Settings = {
  from_name: string;
  from_email: string | null;
  domain_verified: boolean;
};

type DnsRecord = {
  record: string;
  name: string;
  type: string;
  value: string;
  ttl?: string | number;
  status?: string;
  priority?: number;
};

export default function EmailSenderSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [records, setRecords] = useState<DnsRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_email_settings")
        .select("from_name, from_email, domain_verified")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const s = data as Settings;
        setFromName(s.from_name || "");
        setFromEmail(s.from_email || "");
        setVerified(!!s.domain_verified);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!fromName.trim()) {
      toast.error("From name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("user_email_settings")
      .upsert(
        {
          user_id: user.id,
          from_name: fromName.trim(),
          from_email: fromEmail.trim() || null,
        },
        { onConflict: "user_id" }
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Email settings saved");
  };

  const verifyDomain = async () => {
    if (!fromEmail.includes("@")) {
      toast.error("Enter a valid from email first");
      return;
    }
    setVerifying(true);
    setRecords([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("verify-resend-domain", {
        body: { from_email: fromEmail.trim() },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      const result = res.data as { verified: boolean; records: DnsRecord[]; status: string };
      setVerified(!!result.verified);
      setRecords(result.records || []);
      if (result.verified) toast.success("Domain verified ✓");
      else toast.message("Verification pending — add the DNS records below");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Verification check failed");
    } finally {
      setVerifying(false);
    }
  };

  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success("Copied");
  };

  const domain = fromEmail.includes("@") ? fromEmail.split("@")[1] : "";

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
        <Loader2 size={14} className="animate-spin" /> Loading email settings…
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Mail size={14} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Email Settings</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Configure how your outgoing sequence emails appear to recipients.
      </p>

      <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            From Name
          </label>
          <input
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="e.g. Shane at Top Hat Provisions"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Your name or business name as it appears in outgoing emails.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            From Email
          </label>
          <input
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="e.g. outreach@yourdomain.com"
            type="email"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            The email address your sequences send from.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Save Settings
          </button>
          <button
            onClick={verifyDomain}
            disabled={verifying || !fromEmail.includes("@")}
            className="text-xs font-semibold border border-border text-foreground px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {verifying && <Loader2 size={12} className="animate-spin" />}
            {verified ? "Re-check Domain" : "Verify Domain"}
          </button>
        </div>
      </div>

      {/* Domain status */}
      {fromEmail.includes("@") && (
        <>
          {verified ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-500 font-medium">
                Domain verified ✓ — emails will send from {domain}
              </p>
            </div>
          ) : (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-warning">
                    Domain not verified — emails may land in spam.
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Add these DNS records at your domain provider, then click "Re-check Domain".
                  </p>
                </div>
              </div>

              {records.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {records.map((r, i) => (
                    <div
                      key={i}
                      className="bg-background border border-border rounded-md p-3 text-[11px]"
                    >
                      <div className="grid grid-cols-[60px_1fr] gap-y-1 gap-x-3 font-mono">
                        <span className="text-muted-foreground">Type</span>
                        <span className="text-foreground">{r.type}</span>
                        <span className="text-muted-foreground">Name</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground break-all">{r.name}</span>
                          <button onClick={() => copy(r.name)} className="text-muted-foreground hover:text-primary">
                            <Copy size={10} />
                          </button>
                        </div>
                        <span className="text-muted-foreground">Value</span>
                        <div className="flex items-start gap-1.5">
                          <span className="text-foreground break-all">{r.value}</span>
                          <button onClick={() => copy(r.value)} className="text-muted-foreground hover:text-primary shrink-0 mt-0.5">
                            <Copy size={10} />
                          </button>
                        </div>
                        {r.priority !== undefined && (
                          <>
                            <span className="text-muted-foreground">Priority</span>
                            <span className="text-foreground">{r.priority}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Click "Verify Domain" to fetch the DNS records you need to add.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
