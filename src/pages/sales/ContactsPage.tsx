import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useCrm, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import { cn } from "@/lib/utils";

function formatShortDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type SortKey = "name" | "stage" | "value" | "last_contacted_at";
const ALL = "__all__";

function colorDot(color: string) {
  return PIPELINE_COLORS.find((c) => c.key === color)?.className || "bg-primary";
}

export default function ContactsPage() {
  const { contacts, companies, loading, setSelectedContactId, pipelines } = useCrm();
  const [search, setSearch] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = contacts.filter(
      (c) =>
        (pipelineFilter === ALL || c.pipeline_id === pipelineFilter) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.title || "").toLowerCase().includes(q))
    );
    return [...filtered].sort((a: any, b: any) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [contacts, search, sortKey, sortDir, pipelineFilter]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      onClick={() => toggleSort(k)}
      className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 cursor-pointer hover:text-foreground"
    >
      {children} {sortKey === k && (sortDir === "asc" ? "↑" : "↓")}
    </th>
  );

  const pipelineCount = (pid: string) => contacts.filter((c) => c.pipeline_id === pid).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-foreground">Contacts</h1>
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-background border border-border rounded-md pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Pipeline filter chips */}
      {pipelines.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
          <button
            onClick={() => setPipelineFilter(ALL)}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors",
              pipelineFilter === ALL ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            All Pipelines
            <span className="text-[9px] opacity-70">{contacts.length}</span>
          </button>
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setPipelineFilter(p.id)}
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors",
                pipelineFilter === p.id ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", colorDot(p.color))} />
              {p.name}
              <span className="text-[9px] opacity-70">{pipelineCount(p.id)}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : sorted.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted-foreground">No contacts yet. Add one from the Pipeline.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <Th k="name">Name</Th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Company</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Pipeline</th>
                <Th k="stage">Stage</Th>
                <Th k="value">Value</Th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Location</th>
                <Th k="last_contacted_at">Last Contact</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const company = c.company_id ? companies.find((co) => co.id === c.company_id) : null;
                const pipeline = c.pipeline_id ? pipelines.find((p) => p.id === c.pipeline_id) : null;
                const lower = (c.stage || "").toLowerCase();
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedContactId(c.id)}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-semibold text-foreground">{c.name}</p>
                      {c.title && <p className="text-[10px] text-muted-foreground">{c.title}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{company?.name || "—"}</td>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                      {pipeline ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", colorDot(pipeline.color))} />
                          {pipeline.name}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider",
                          lower === "won" && "bg-emerald-500/15 text-emerald-500",
                          lower === "lost" && "bg-rose-500/15 text-rose-500",
                          lower !== "won" && lower !== "lost" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {c.stage || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-medium text-warning">
                      {c.value > 0 ? `$${c.value}/mo` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{c.location || "—"}</td>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                      {c.last_contacted_at ? new Date(c.last_contacted_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
