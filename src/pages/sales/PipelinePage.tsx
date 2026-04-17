import { useState, useMemo, DragEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Clock, Search, Plus, X } from "lucide-react";
import { useCrm, STAGES, Stage } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";

function daysAgo(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function PipelinePage() {
  const { contacts, companies, loading, updateContact, createContact, setSelectedContactId } = useCrm();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageFilter = searchParams.get("stage") as Stage | null;
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const stagesToShow = stageFilter ? STAGES.filter((s) => s.key === stageFilter) : STAGES;
  const stageLabel = stageFilter ? STAGES.find((s) => s.key === stageFilter)?.label : null;
  const clearFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("stage");
    setSearchParams(next);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const byStage = useMemo(() => {
    const map: Record<Stage, typeof contacts> = {
      new_lead: [], contacted: [], sample_sent: [], tasting_done: [], proposal_sent: [], won: [], lost: [],
    };
    filtered.forEach((c) => map[c.stage]?.push(c));
    return map;
  }, [filtered]);

  const onDrop = (stage: Stage) => async (e: DragEvent) => {
    e.preventDefault();
    if (dragId) {
      const contact = contacts.find((c) => c.id === dragId);
      if (contact && contact.stage !== stage) {
        await updateContact(dragId, { stage });
      }
    }
    setDragId(null);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const c = await createContact({ name: newName.trim() });
    if (c) {
      setNewName("");
      setShowAdd(false);
      setSelectedContactId(c.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-foreground">Pipeline</h1>
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
            onClick={() => setShowAdd((v) => !v)}
            className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Plus size={12} /> Add Contact
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Contact name (e.g., Jane Doe — Acme Co)"
            className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button onClick={handleAdd} className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
            Create
          </button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground hover:text-foreground px-2">
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading pipeline...</div>
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <div className="flex gap-3" style={{ minWidth: "1280px" }}>
            {STAGES.map((stage) => {
              const items = byStage[stage.key] || [];
              const isClosed = stage.key === "won" || stage.key === "lost";
              return (
                <div
                  key={stage.key}
                  className="min-h-[400px] min-w-[200px] flex-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop(stage.key)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stage.label}</h3>
                    <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((card) => {
                      const company = card.company_id ? companies.find((c) => c.id === card.company_id) : null;
                      return (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => setDragId(card.id)}
                          onClick={() => setSelectedContactId(card.id)}
                          className={cn(
                            "border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer group",
                            stage.key === "won" && "bg-card/50 opacity-75",
                            stage.key === "lost" && "bg-card/50 opacity-60",
                            !isClosed && "bg-card"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-semibold text-foreground leading-tight">{card.name}</p>
                            {stage.key === "won" && (
                              <span className="text-[9px] font-semibold bg-success/15 text-success px-1.5 py-0.5 rounded shrink-0">
                                Won
                              </span>
                            )}
                            {stage.key === "lost" && (
                              <span className="text-[9px] font-semibold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded shrink-0">
                                Lost
                              </span>
                            )}
                          </div>
                          {card.title && <p className="text-[11px] text-muted-foreground">{card.title}</p>}
                          {company && (
                            <span className="inline-block text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded mt-1">
                              {company.name}
                            </span>
                          )}
                          {card.location && (
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                              <MapPin size={10} /> {card.location}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] font-medium text-warning">
                              {card.value > 0 ? `$${card.value}/mo` : "—"}
                            </span>
                            {card.last_contacted_at && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock size={10} /> {daysAgo(card.last_contacted_at)}d
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="text-[10px] text-muted-foreground/60 text-center py-4 border border-dashed border-border/40 rounded-lg">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
