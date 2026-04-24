import { useEffect, useMemo, useState } from "react";
import { Search, Settings, Globe, Database, AlertCircle, Copy, ExternalLink, Loader2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCrm, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ApiKeySettingsModal from "@/components/sales/ApiKeySettingsModal";

type Engine = "outscraper" | "apollo";

interface Lead {
  business_name: string;
  email: string;
  email_type: string;
  website: string;
  address: string;
  contact_name?: string;
  contact_title?: string;
  business_category: string;
  region: string;
  source: Engine;
}

const EMAIL_FILTER_CHIPS = [
  { key: "all", label: "All" },
  { key: "owner", label: "owner@" },
  { key: "manager", label: "manager@" },
  { key: "info", label: "info@" },
  { key: "decision maker", label: "decision maker@" },
  { key: "sales", label: "sales@" },
];

function emailTypeBadge(type: string) {
  const t = type.toLowerCase();
  if (t === "owner") return "bg-emerald-500/10 text-emerald-600";
  if (t === "decision maker") return "bg-primary/10 text-primary";
  if (t === "manager") return "bg-amber-500/10 text-amber-600";
  if (t === "info" || t === "sales" || t === "general") return "bg-muted text-muted-foreground";
  return "text-muted-foreground/40";
}

function colorDot(color: string) {
  return PIPELINE_COLORS.find((c) => c.key === color)?.className || "bg-primary";
}

function rowKey(l: Lead, idx: number) {
  return `${l.source}-${idx}-${l.email || "noemail"}-${l.business_name}`;
}

function csvEscape(v: string) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ProspectsPage() {
  const { user } = useAuth();
  const { pipelines, createCompany, createContact } = useCrm();
  const [engine, setEngine] = useState<Engine>("outscraper");
  const [businessType, setBusinessType] = useState("restaurants");
  const [region, setRegion] = useState("Austin TX");
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<string[]>(["all"]);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [rowPipeline, setRowPipeline] = useState<Record<string, string>>({});
  const [bulkPipelineId, setBulkPipelineId] = useState<string>("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ outscraper: boolean; apollo: boolean }>({ outscraper: false, apollo: false });
  const [searchedQuery, setSearchedQuery] = useState<{ region: string; type: string } | null>(null);

  // Load which keys exist (we just need presence for the no-key warning)
  const refreshKeys = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("api_keys" as any)
      .select("service")
      .eq("user_id", user.id);
    const services = new Set(((data || []) as any[]).map((r: any) => r.service));
    setKeyStatus({ outscraper: services.has("outscraper"), apollo: services.has("apollo") });
  };
  useEffect(() => {
    refreshKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Default bulk pipeline once pipelines load
  useEffect(() => {
    if (!bulkPipelineId && pipelines.length > 0) setBulkPipelineId(pipelines[0].id);
  }, [pipelines, bulkPipelineId]);

  const toggleFilter = (key: string) => {
    setFilters((prev) => {
      if (key === "all") return ["all"];
      const without = prev.filter((p) => p !== "all");
      if (without.includes(key)) {
        const next = without.filter((p) => p !== key);
        return next.length === 0 ? ["all"] : next;
      }
      return [...without, key];
    });
  };

  const filteredLeads = useMemo(() => {
    if (filters.includes("all")) return leads;
    return leads.filter((l) => filters.includes(l.email_type));
  }, [leads, filters]);

  const allSelected = filteredLeads.length > 0 && filteredLeads.every((_, i) => selected.has(rowKey(filteredLeads[i], i)));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      const all = new Set<string>();
      filteredLeads.forEach((l, i) => {
        if (l.email) all.add(rowKey(l, i));
      });
      setSelected(all);
    }
  };

  const handleSearch = async () => {
    if (!businessType.trim() || !region.trim()) {
      toast.error("Enter both a business type and a location");
      return;
    }
    if (!keyStatus[engine]) {
      toast.error(`Add your ${engine === "outscraper" ? "Outscraper" : "Apollo"} API key first`);
      setSettingsOpen(true);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setSelected(new Set());
    setAdded(new Set());
    setSearchedQuery({ region, type: businessType });
    try {
      const { data, error } = await supabase.functions.invoke("prospect-search", {
        body: {
          engine,
          business_type: businessType.trim(),
          region: region.trim(),
          limit,
        },
      });
      if (error) {
        toast.error(error.message || "Search failed");
        setLeads([]);
      } else if (data?.error === "no_api_key") {
        toast.error(`Add your ${engine === "outscraper" ? "Outscraper" : "Apollo"} API key first`);
        setSettingsOpen(true);
        setLeads([]);
      } else if (data?.error) {
        toast.error(data.message || data.error);
        setLeads([]);
      } else {
        setLeads(Array.isArray(data?.leads) ? data.leads : []);
      }
    } catch (e: any) {
      toast.error(e?.message || "Search failed");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const addLead = async (lead: Lead, key: string) => {
    if (!lead.email) return;
    const pid = rowPipeline[key] || bulkPipelineId;
    if (!pid) {
      toast.error("Select a pipeline first");
      return;
    }
    const pipeline = pipelines.find((p) => p.id === pid);
    setBusyKey(key);
    const company = lead.business_name
      ? await createCompany({ name: lead.business_name, location: lead.address || null, website: lead.website || null })
      : null;
    const contact = await createContact({
      name: lead.contact_name?.trim() || lead.business_name || lead.email,
      email: lead.email,
      title: lead.contact_title || lead.email_type,
      company_id: company?.id || null,
      location: lead.address || null,
      tags: [lead.business_category, lead.email_type, lead.region, lead.source].filter(Boolean) as string[],
      pipeline_id: pid,
      stage: pipeline?.stages[0] || "New Lead",
    });
    setBusyKey(null);
    if (contact) {
      setAdded((prev) => new Set(prev).add(key));
      toast.success(`${lead.business_name || lead.email} added to ${pipeline?.name || "pipeline"}`);
    }
  };

  const handleBulkAdd = async () => {
    if (selected.size === 0) return;
    if (!bulkPipelineId) {
      toast.error("Select a pipeline first");
      return;
    }
    const pipeline = pipelines.find((p) => p.id === bulkPipelineId);
    setBulkBusy(true);
    let count = 0;
    for (let i = 0; i < filteredLeads.length; i++) {
      const lead = filteredLeads[i];
      const key = rowKey(lead, i);
      if (!selected.has(key) || added.has(key) || !lead.email) continue;
      const company = lead.business_name
        ? await createCompany({ name: lead.business_name, location: lead.address || null, website: lead.website || null })
        : null;
      const contact = await createContact({
        name: lead.contact_name?.trim() || lead.business_name || lead.email,
        email: lead.email,
        title: lead.contact_title || lead.email_type,
        company_id: company?.id || null,
        location: lead.address || null,
        tags: [lead.business_category, lead.email_type, lead.region, lead.source].filter(Boolean) as string[],
        pipeline_id: bulkPipelineId,
        stage: pipeline?.stages[0] || "New Lead",
      });
      if (contact) {
        setAdded((prev) => new Set(prev).add(key));
        count++;
      }
    }
    setBulkBusy(false);
    setSelected(new Set());
    if (count > 0) toast.success(`${count} contact${count > 1 ? "s" : ""} added to ${pipeline?.name || "pipeline"}`);
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const header = ["Business", "Email", "Type", "Website", "Location", "Category", "Source"];
    const rows = filteredLeads.map((l) => [
      l.business_name,
      l.email,
      l.email_type,
      l.website,
      l.address,
      l.business_category,
      l.source,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospects-${searchedQuery?.region || "results"}.csv`.toLowerCase().replace(/\s+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEmail = async (email: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const engineHasKey = keyStatus[engine];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Prospect Discovery</h1>
          <p className="text-sm text-muted-foreground">Find leads from real business websites</p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Discovery settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Engine selector */}
      <div className="flex gap-3 mb-1">
        <button
          onClick={() => setEngine("outscraper")}
          className={cn(
            "rounded-xl p-4 cursor-pointer flex-1 text-left transition-colors",
            engine === "outscraper"
              ? "border-2 border-primary bg-primary/5"
              : "border border-border bg-card hover:border-primary/30"
          )}
        >
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Discover</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-1">Scrape real websites</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Finds emails listed on actual business websites. Fresh, direct, unfiltered.
          </p>
          <span className="text-[9px] bg-primary/15 text-primary px-2 py-0.5 rounded-full inline-block mt-2 font-semibold">
            Recommended
          </span>
        </button>

        <button
          onClick={() => setEngine("apollo")}
          className={cn(
            "rounded-xl p-4 cursor-pointer flex-1 text-left transition-colors",
            engine === "apollo"
              ? "border-2 border-primary bg-primary/5"
              : "border border-border bg-card hover:border-primary/30"
          )}
        >
          <div className="flex items-center gap-2">
            <Database size={18} className={engine === "apollo" ? "text-primary" : "text-foreground"} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              engine === "apollo" ? "text-primary" : "text-foreground"
            )}>
              Apollo
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-1">Search Apollo database</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Access 275M+ contacts. Faster search, older data.
          </p>
        </button>
      </div>

      {/* Search form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Business type</label>
            <input
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. restaurants, law firms, gyms, hotels"
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Location</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Austin TX, Chicago IL, Miami FL"
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Results</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-muted-foreground mr-2">Email type filter:</span>
          {EMAIL_FILTER_CHIPS.map((chip) => {
            const active = filters.includes(chip.key);
            return (
              <button
                key={chip.key}
                onClick={() => toggleFilter(chip.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border border-primary"
                    : "border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {chip.label}
              </button>
            );
          })}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="ml-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Searching..." : "Find Leads →"}
          </button>
        </div>
      </div>

      {/* No API key state */}
      {!engineHasKey && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-warning shrink-0" />
          <p className="text-xs text-foreground flex-1">
            Add your {engine === "outscraper" ? "Outscraper" : "Apollo"} API key to start searching.
          </p>
          {engine === "outscraper" ? (
            <a
              href="https://outscraper.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap flex items-center gap-1"
            >
              Get a free Outscraper key <ExternalLink size={11} />
            </a>
          ) : (
            <a
              href="https://apollo.io"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap flex items-center gap-1"
            >
              Get an Apollo key <ExternalLink size={11} />
            </a>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs font-medium border border-border text-foreground px-3 py-1.5 rounded-md hover:bg-muted whitespace-nowrap"
          >
            Add key
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="h-3 w-1/3 bg-muted rounded mb-2" />
              <div className="h-2 w-1/2 bg-muted rounded" />
            </div>
          ))}
          {searchedQuery && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Searching {searchedQuery.region} for {searchedQuery.type}...
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <>
          {filteredLeads.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">No leads found. Try different keywords or location.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <p className="text-sm font-semibold text-foreground">
                  {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"} found
                  <span className="text-muted-foreground font-normal"> · via {engine}</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="accent-primary"
                    />
                    Select all
                  </label>
                  {pipelines.length > 0 && selected.size > 0 && (
                    <select
                      value={bulkPipelineId}
                      onChange={(e) => setBulkPipelineId(e.target.value)}
                      className="bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                    >
                      {pipelines.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  {selected.size > 0 && (
                    <button
                      onClick={handleBulkAdd}
                      disabled={bulkBusy || !bulkPipelineId}
                      className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {bulkBusy ? "Adding..." : `Add ${selected.size} to CRM`}
                    </button>
                  )}
                  <button
                    onClick={handleExportCSV}
                    className="border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-muted flex items-center gap-1"
                  >
                    <Download size={11} /> Export CSV
                  </button>
                </div>
              </div>

              {pipelines.length === 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs text-foreground mb-3">
                  Create a pipeline before adding contacts to your CRM.
                </div>
              )}

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        <th className="px-3 py-2 w-8"></th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Business</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Email</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Type</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Location</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Website</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Pipeline</th>
                        <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((l, i) => {
                        const key = rowKey(l, i);
                        const isAdded = added.has(key);
                        const hasEmail = !!l.email;
                        const isSelected = selected.has(key);
                        const pid = rowPipeline[key] || bulkPipelineId;
                        const pipeline = pipelines.find((p) => p.id === pid);
                        return (
                          <tr key={key} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2.5 align-top">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!hasEmail || isAdded}
                                onChange={(e) => {
                                  setSelected((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(key);
                                    else next.delete(key);
                                    return next;
                                  });
                                }}
                                className="accent-primary disabled:opacity-30"
                              />
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <p className="font-medium text-foreground text-xs">{l.business_name || "—"}</p>
                              {l.contact_name && (
                                <p className="text-[10px] text-muted-foreground">{l.contact_name}</p>
                              )}
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              {hasEmail ? (
                                <button
                                  onClick={() => copyEmail(l.email)}
                                  className="group flex items-center gap-1.5 text-xs text-foreground hover:text-primary"
                                  title="Click to copy"
                                >
                                  <span className="font-mono">{l.email}</span>
                                  <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">not found</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full inline-block",
                                emailTypeBadge(l.email_type)
                              )}>
                                {l.email_type}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 align-top text-[11px] text-muted-foreground truncate max-w-[120px]">
                              {l.address || "—"}
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              {l.website ? (
                                <a
                                  href={l.website.startsWith("http") ? l.website : `https://${l.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary hover:underline truncate max-w-[140px] inline-block"
                                >
                                  {l.website.replace(/^https?:\/\//, "").split("/")[0]}
                                </a>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              {pipelines.length === 0 ? (
                                <span className="text-[10px] text-muted-foreground italic">none</span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  {pipeline && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", colorDot(pipeline.color))} />}
                                  <select
                                    value={pid || ""}
                                    onChange={(e) => setRowPipeline((prev) => ({ ...prev, [key]: e.target.value }))}
                                    className="bg-background border border-border rounded px-1.5 py-1 text-[11px] text-foreground max-w-[120px]"
                                  >
                                    {pipelines.map((p) => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              {!hasEmail ? (
                                <span className="text-muted-foreground/50 text-xs cursor-not-allowed">No email</span>
                              ) : isAdded ? (
                                <span className="text-emerald-600 text-xs font-medium cursor-default">Added ✓</span>
                              ) : (
                                <button
                                  onClick={() => addLead(l, key)}
                                  disabled={busyKey === key || pipelines.length === 0}
                                  className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                                >
                                  {busyKey === key ? "Adding..." : "Add to CRM"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <ApiKeySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={refreshKeys}
      />
    </div>
  );
}
