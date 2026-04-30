import { useEffect, useState, KeyboardEvent } from "react";
import { Search, Settings, Loader2 } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

interface Prospect {
  biz: string;
  loc: string;
  contact: string;
  title: string;
  email: string;
}

type DupState =
  | { kind: "unknown" }
  | { kind: "checking" }
  | { kind: "duplicate"; contactId: string }
  | { kind: "available" }
  | { kind: "no_email" };

export default function ProspectsPage() {
  const { createCompany, createContact, setSelectedContactId, pipelines } = useCrm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState<string | null>(null);
  const [pipelineId, setPipelineId] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dupState, setDupState] = useState<Record<string, DupState>>({});
  const [query, setQuery] = useState("bar owners San Francisco");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Prospect[]>([]);

  useEffect(() => {
    if (!pipelineId && pipelines.length > 0) setPipelineId(pipelines[0].id);
  }, [pipelines, pipelineId]);

  // Recompute duplicate state whenever results change.
  useEffect(() => {
    if (!user || results.length === 0) {
      setDupState({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, DupState> = {};
      for (const p of results) {
        if (!p.email) {
          next[p.biz] = { kind: "no_email" };
          continue;
        }
        const { data } = await supabase
          .from("contacts")
          .select("id")
          .eq("user_id", user.id)
          .eq("email", p.email)
          .maybeSingle();
        next[p.biz] = data?.id
          ? { kind: "duplicate", contactId: data.id as string }
          : { kind: "available" };
      }
      if (!cancelled) setDupState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, results]);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Enter a search query");
      return;
    }
    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("prospect-search", {
        body: { query: q },
      });
      if (error) throw new Error(error.message || "Search failed");
      if (data?.error) throw new Error(data.error);
      setResults(Array.isArray(data?.prospects) ? data.prospects : []);
    } catch (err: any) {
      setResults([]);
      setSearchError(err?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  const viewExisting = (contactId: string) => {
    setSelectedContactId(contactId);
    navigate("/sales/contacts");
  };

  const addToPipeline = async (p: (typeof mockProspects)[number]) => {
    if (!pipelineId) {
      toast.error("Create a pipeline first");
      return;
    }
    if (!user) return;

    // Final dedupe check at click time
    if (p.email) {
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user.id)
        .eq("email", p.email)
        .maybeSingle();
      if (existing?.id) {
        setDupState((s) => ({
          ...s,
          [p.biz]: { kind: "duplicate", contactId: existing.id as string },
        }));
        toast.info(`${p.contact} is already in your CRM`);
        return;
      }
    }

    const pipeline = pipelines.find((pl) => pl.id === pipelineId);
    setAdding(p.contact);
    const co = await createCompany({ name: p.biz, location: p.loc });
    const contact = await createContact({
      name: p.contact,
      title: p.title,
      email: p.email,
      company_id: co?.id || null,
      location: p.loc,
      pipeline_id: pipelineId,
      stage: pipeline?.stages[0] || "New Lead",
    });
    setAdding(null);
    if (contact) {
      toast.success(`${p.contact} added to ${pipeline?.name || "pipeline"}`);
      setSelectedContactId(contact.id);
      setDupState((s) => ({
        ...s,
        [p.biz]: { kind: "duplicate", contactId: contact.id },
      }));
    }
  };

  const addAll = async () => {
    if (!pipelineId) {
      toast.error("Create a pipeline first");
      return;
    }
    if (!user) return;
    const pipeline = pipelines.find((pl) => pl.id === pipelineId);

    let added = 0;
    let duplicates = 0;
    let noEmail = 0;

    for (const p of mockProspects) {
      if (!p.email) {
        noEmail++;
        setDupState((s) => ({ ...s, [p.biz]: { kind: "no_email" } }));
        continue;
      }
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user.id)
        .eq("email", p.email)
        .maybeSingle();
      if (existing?.id) {
        duplicates++;
        setDupState((s) => ({
          ...s,
          [p.biz]: { kind: "duplicate", contactId: existing.id as string },
        }));
        continue;
      }
      const co = await createCompany({ name: p.biz, location: p.loc });
      const contact = await createContact({
        name: p.contact,
        title: p.title,
        email: p.email,
        company_id: co?.id || null,
        location: p.loc,
        pipeline_id: pipelineId,
        stage: pipeline?.stages[0] || "New Lead",
      });
      if (contact) {
        added++;
        setDupState((s) => ({
          ...s,
          [p.biz]: { kind: "duplicate", contactId: contact.id },
        }));
      }
    }

    toast.success(
      `${added} added · ${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped · ${noEmail} had no email`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-lg font-bold text-foreground">Find New Prospects</h1>
        <span className="text-[9px] text-muted-foreground border border-border rounded px-1.5 py-0.5">powered by Outscraper</span>
        <button
          onClick={() => setSettingsOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
          aria-label="Discovery settings"
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          defaultValue="bar owners San Francisco"
          className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          placeholder="Search by city, business type, or keyword..."
        />
      </div>

      {pipelines.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Create a pipeline before adding prospects.</p>
          <Link to="/sales/pipeline" className="text-xs font-medium text-primary hover:underline">
            Create your first pipeline →
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">Add to pipeline:</label>
          <select
            value={pipelineId}
            onChange={(e) => setPipelineId(e.target.value)}
            className="bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={addAll}
            disabled={!pipelineId}
            className="ml-auto text-[11px] font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Add selected to CRM
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mockProspects.map((p) => {
          const state = dupState[p.biz] ?? { kind: "unknown" as const };
          const isDup = state.kind === "duplicate";
          const isNoEmail = state.kind === "no_email";
          return (
            <div key={p.biz} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-foreground">{p.biz}</p>
                {isDup && (
                  <span className="bg-warning/10 text-warning text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                    Already in CRM
                  </span>
                )}
                {isNoEmail && (
                  <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                    No email
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{p.loc}</p>
              <p className="text-[11px] text-foreground">{p.contact}</p>
              <p className="text-[10px] text-muted-foreground mb-1">{p.title}</p>
              <p className="text-[10px] text-muted-foreground font-mono mb-3">
                {p.email || "—"}
              </p>

              {isDup ? (
                <button
                  onClick={() => viewExisting(state.contactId)}
                  className="w-full text-xs text-primary border border-primary/20 py-1.5 rounded-md hover:bg-primary/10 transition-colors"
                >
                  View in CRM →
                </button>
              ) : (
                <button
                  onClick={() => addToPipeline(p)}
                  disabled={adding === p.contact || !pipelineId || isNoEmail}
                  className="w-full text-[11px] font-medium bg-primary text-primary-foreground py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {adding === p.contact
                    ? "Adding..."
                    : isNoEmail
                      ? "No email — can't add"
                      : "Add to CRM"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {settingsOpen && user && (
        <DiscoverySettingsModal userId={user.id} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

/* ---------------- Discovery Settings Modal ---------------- */

type ServiceKey = "outscraper" | "apollo";

function ApiKeyField({
  userId,
  service,
  label,
  required,
  helpText,
  helpLink,
  placeholder,
}: {
  userId: string;
  service: ServiceKey;
  label: string;
  required: boolean;
  helpText: string;
  helpLink: { href: string; text: string };
  placeholder: string;
}) {
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [savedKeyId, setSavedKeyId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("api_keys")
        .select("id, api_key")
        .eq("user_id", userId)
        .eq("service", service)
        .maybeSingle();
      if (data) {
        setSavedKey(data.api_key as string);
        setSavedKeyId(data.id as string);
        setEditing(false);
      } else {
        setEditing(true);
      }
      setLoading(false);
    })();
  }, [userId, service]);

  const masked = savedKey ? `••••${savedKey.slice(-4)}` : "";

  const save = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      toast.error(`Enter a ${label}`);
      return;
    }
    setSaving(true);
    if (savedKeyId) {
      const { error } = await supabase
        .from("api_keys")
        .update({ api_key: trimmed, updated_at: new Date().toISOString() })
        .eq("id", savedKeyId);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("api_keys")
        .insert({ user_id: userId, service, api_key: trimmed })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      setSavedKeyId(data.id as string);
    }
    setSavedKey(trimmed);
    setKeyInput("");
    setEditing(false);
    setSaving(false);
    toast.success(`${label} saved`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required ? (
            <span className="ml-2 text-[10px] font-medium text-primary uppercase tracking-wider">Required</span>
          ) : (
            <span className="ml-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Optional</span>
          )}
        </label>
        <a
          href={helpLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-xs hover:underline"
        >
          {helpLink.text}
        </a>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : savedKey && !editing ? (
        <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-3 py-2">
          <span className="text-xs font-mono text-foreground">{masked}</span>
          <button
            onClick={() => {
              setEditing(true);
              setKeyInput("");
            }}
            className="text-primary text-xs hover:underline"
          >
            Update
          </button>
        </div>
      ) : (
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono"
        />
      )}

      <p className="text-[11px] text-muted-foreground mt-2">{helpText}</p>

      {(editing || !savedKey) && (
        <div className="flex justify-end gap-2 mt-3">
          {savedKey && (
            <button
              onClick={() => {
                setEditing(false);
                setKeyInput("");
              }}
              className="border border-border px-3 py-1.5 rounded-lg text-xs hover:bg-muted/50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

function DiscoverySettingsModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold">Discovery Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          <ApiKeyField
            userId={userId}
            service="outscraper"
            label="Outscraper API Key"
            required
            placeholder="Your Outscraper API key"
            helpText="Primary search engine. Scrapes real websites for fresh leads with verified emails."
            helpLink={{ href: "https://outscraper.com", text: "Get a key at outscraper.com →" }}
          />

          <div className="border-t border-border pt-5">
            <ApiKeyField
              userId={userId}
              service="apollo"
              label="Apollo API Key"
              required={false}
              placeholder="Your Apollo API key"
              helpText="Secondary search engine. Useful for B2B SaaS contact discovery."
              helpLink={{ href: "https://apollo.io", text: "Get a key at apollo.io →" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
