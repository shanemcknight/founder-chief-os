import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { useCrm, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import { useUserUsage } from "@/hooks/useUserUsage";
import { cn } from "@/lib/utils";
import PipelineSelector from "@/components/sales/PipelineSelector";
import AddContactDialog from "@/components/sales/AddContactDialog";

function formatShortDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type SortKey = "name" | "email" | "stage" | "value" | "last_contacted_at" | "created_at";

function colorDot(color: string) {
  return PIPELINE_COLORS.find((c) => c.key === color)?.className || "bg-primary";
}

export default function ContactsPage() {
  const { contacts, companies, loading, setSelectedContactId, pipelines, activePipelineId } = useCrm();
  const { getActiveForContact } = useEmailSequences();
  const { usage } = useUserUsage();
  const limitReached = !!usage && (usage.emails_sent_this_month ?? 0) >= (usage.email_monthly_limit ?? 0);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [addOpen, setAddOpen] = useState(false);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = contacts.filter(
      (c) =>
        (activePipelineId === null || c.pipeline_id === activePipelineId) &&
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
  }, [contacts, search, sortKey, sortDir, activePipelineId]);

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
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full bg-background border border-border rounded-md pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={() => setAddOpen(true)}
            disabled={pipelines.length === 0}
            className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
          >
            <Plus size={12} /> Add Contact
          </button>
        </div>
      </div>

      {/* Unified pipeline selector */}
      <PipelineSelector />

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : sorted.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted-foreground">
            No contacts yet. Click + Add Contact above, or import from{" "}
            <a href="/sales/prospects" className="text-primary hover:underline">Prospects</a>.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <Th k="name">Name</Th>
                <Th k="email">Email</Th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Company</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Pipeline</th>
                <Th k="stage">Stage</Th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Sequence</th>
                <Th k="created_at">Created</Th>
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
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                      {c.email ? <span className="text-foreground">{c.email}</span> : "—"}
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
                    <td className="px-3 py-2.5">
                      {(() => {
                        const seq = getActiveForContact(c.id);
                        if (!seq) {
                          return <span className="text-muted-foreground text-xs">—</span>;
                        }
                        if (seq.status === "pending") {
                          return (
                            <span className="text-primary text-xs">
                              Step {seq.sequence_step}
                              {seq.next_send_at ? ` · ${formatShortDate(seq.next_send_at)}` : ""}
                            </span>
                          );
                        }
                        if (seq.status === "completed") {
                          return <span className="text-emerald-600 text-xs font-medium">Done ✓</span>;
                        }
                        if (seq.status === "paused") {
                          return (
                            <span className="text-amber-600 text-xs">
                              {limitReached ? "Limit reached" : "Paused"}
                            </span>
                          );
                        }
                        if (seq.status === "unsubscribed") {
                          return <span className="text-muted-foreground/60 text-xs">Opted out</span>;
                        }
                        return <span className="text-muted-foreground text-xs">{seq.status}</span>;
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
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
