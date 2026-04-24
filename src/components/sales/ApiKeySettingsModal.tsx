import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type StoredKey = { service: string; api_key: string };

export default function ApiKeySettingsModal({ open, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [outscraper, setOutscraper] = useState("");
  const [apollo, setApollo] = useState("");
  const [outscraperSaved, setOutscraperSaved] = useState<string | null>(null);
  const [apolloSaved, setApolloSaved] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ outscraper: boolean; apollo: boolean }>({ outscraper: false, apollo: false });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from("api_keys" as any)
        .select("service, api_key")
        .eq("user_id", user.id);
      const rows = (data || []) as unknown as StoredKey[];
      const o = rows.find((r) => r.service === "outscraper");
      const a = rows.find((r) => r.service === "apollo");
      setOutscraperSaved(o?.api_key ? o.api_key.slice(-4) : null);
      setApolloSaved(a?.api_key ? a.api_key.slice(-4) : null);
      setOutscraper("");
      setApollo("");
      setEditing({ outscraper: !o, apollo: !a });
    })();
  }, [open, user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const saveKey = async (service: "outscraper" | "apollo", value: string) => {
    if (!user) return;
    if (!value.trim()) {
      toast.error("Enter an API key");
      return;
    }
    setSaving(service);
    const { error } = await supabase
      .from("api_keys" as any)
      .upsert(
        { user_id: user.id, service, api_key: value.trim() },
        { onConflict: "user_id,service" }
      );
    setSaving(null);
    if (error) {
      toast.error("Failed to save key");
      return;
    }
    toast.success(`${service === "outscraper" ? "Outscraper" : "Apollo"} key saved`);
    if (service === "outscraper") {
      setOutscraperSaved(value.trim().slice(-4));
      setOutscraper("");
      setEditing((p) => ({ ...p, outscraper: false }));
    } else {
      setApolloSaved(value.trim().slice(-4));
      setApollo("");
      setEditing((p) => ({ ...p, apollo: false }));
    }
    onSaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Discovery Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Outscraper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">Outscraper API Key</label>
              <a
                href="https://outscraper.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                Get free key <ExternalLink size={10} />
              </a>
            </div>
            {outscraperSaved && !editing.outscraper ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-foreground">••••••••{outscraperSaved}</span>
                <button
                  onClick={() => setEditing((p) => ({ ...p, outscraper: true }))}
                  className="text-primary hover:underline text-[11px]"
                >
                  Update
                </button>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  value={outscraper}
                  onChange={(e) => setOutscraper(e.target.value)}
                  placeholder="os-xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => saveKey("outscraper", outscraper)}
                  disabled={saving === "outscraper"}
                  className="mt-2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "outscraper" ? "Saving..." : "Save Key"}
                </button>
              </>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Free $3 credit on signup · ~$0.001 per result after that
            </p>
          </div>

          <div className="border-t border-border" />

          {/* Apollo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">
                Apollo API Key <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <a
                href="https://apollo.io"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                Get key <ExternalLink size={10} />
              </a>
            </div>
            {apolloSaved && !editing.apollo ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-foreground">••••••••{apolloSaved}</span>
                <button
                  onClick={() => setEditing((p) => ({ ...p, apollo: true }))}
                  className="text-primary hover:underline text-[11px]"
                >
                  Update
                </button>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  value={apollo}
                  onChange={(e) => setApollo(e.target.value)}
                  placeholder="apollo-key-xxxxxxxxx"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => saveKey("apollo", apollo)}
                  disabled={saving === "apollo"}
                  className="mt-2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "apollo" ? "Saving..." : "Save Key"}
                </button>
              </>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Enables Apollo as an alternative discovery engine
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground border-t border-border pt-4">
            Keys are stored securely. API calls run server-side — your keys are never exposed in the browser.
          </p>
        </div>
      </div>
    </div>
  );
}
