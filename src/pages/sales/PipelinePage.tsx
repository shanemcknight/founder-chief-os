import { useState, useMemo, DragEvent, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Clock, Search, Plus, Layers, MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react";
import { useCrm, Pipeline, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";
import PipelineModal from "@/components/sales/PipelineModal";

function daysAgo(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function colorDot(color: string) {
  return PIPELINE_COLORS.find((c) => c.key === color)?.className || "bg-primary";
}

export default function PipelinePage() {
  const {
    contacts, companies, loading, updateContact, createContact, setSelectedContactId,
    pipelines, deletePipeline, duplicatePipeline,
  } = useCrm();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-select first pipeline once loaded; honor ?pipeline= query
  useEffect(() => {
    const queryPid = searchParams.get("pipeline");
    if (queryPid && pipelines.some((p) => p.id === queryPid)) {
      setActivePipelineId(queryPid);
    } else if (!activePipelineId && pipelines.length > 0) {
      setActivePipelineId(pipelines[0].id);
    } else if (activePipelineId && !pipelines.some((p) => p.id === activePipelineId)) {
      setActivePipelineId(pipelines[0]?.id || null);
    }
  }, [pipelines, searchParams, activePipelineId]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    if (menuOpenId) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenId]);

  const activePipeline = useMemo(
    () => pipelines.find((p) => p.id === activePipelineId) || null,
    [pipelines, activePipelineId]
  );

  const pipelineContactCount = (pid: string) => contacts.filter((c) => c.pipeline_id === pid).length;

  const filtered = useMemo(() => {
    const inPipeline = activePipelineId
      ? contacts.filter((c) => c.pipeline_id === activePipelineId)
      : [];
    if (!search.trim()) return inPipeline;
    const q = search.toLowerCase();
    return inPipeline.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q)
    );
  }, [contacts, search, activePipelineId]);

  const byStage = useMemo(() => {
    const map: Record<string, typeof contacts> = {};
    if (activePipeline) {
      activePipeline.stages.forEach((s) => (map[s] = []));
      filtered.forEach((c) => {
        if (map[c.stage]) map[c.stage].push(c);
        else if (activePipeline.stages.length > 0) {
          // Contact stage doesn't match any pipeline stage — bucket into first stage
          map[activePipeline.stages[0]].push(c);
        }
      });
    }
    return map;
  }, [filtered, activePipeline]);

  const onDrop = (stage: string) => async (e: DragEvent) => {
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
    if (!newName.trim() || !activePipelineId || !activePipeline) return;
    const c = await createContact({
      name: newName.trim(),
      pipeline_id: activePipelineId,
      stage: activePipeline.stages[0] || "New Lead",
    });
    if (c) {
      setNewName("");
      setShowAdd(false);
      setSelectedContactId(c.id);
    }
  };

  const openEdit = (p: Pipeline) => {
    setEditingPipeline(p);
    setModalOpen(true);
    setMenuOpenId(null);
  };

  const openCreate = () => {
    setEditingPipeline(null);
    setModalOpen(true);
  };

  const handleDelete = async (p: Pipeline) => {
    setMenuOpenId(null);
    const ok = window.confirm("This will remove all contacts from this pipeline. Continue?");
    if (!ok) return;
    await deletePipeline(p.id);
    if (activePipelineId === p.id) setActivePipelineId(null);
  };

  const handleDuplicate = async (p: Pipeline) => {
    setMenuOpenId(null);
    const dup = await duplicatePipeline(p.id);
    if (dup) setActivePipelineId(dup.id);
  };

  // Empty state — no pipelines at all
  if (!loading && pipelines.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers size={48} className="text-primary/30 mb-4" />
          <h2 className="text-xl font-bold text-foreground">No pipelines yet</h2>
          <p className="text-sm text-muted-foreground mt-2">Create your first pipeline to start tracking leads.</p>
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg mt-6 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create Pipeline →
          </button>
        </div>
        <PipelineModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editingPipeline}
          onSaved={(p) => setActivePipelineId(p.id)}
        />
      </>
    );
  }

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
            disabled={!activePipelineId}
            className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
          >
            <Plus size={12} /> Add Contact
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex items-end gap-1 min-w-max">
          {pipelines.map((p) => {
            const isActive = p.id === activePipelineId;
            const count = pipelineContactCount(p.id);
            return (
              <div key={p.id} className="relative">
                <button
                  onClick={() => setActivePipelineId(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors border-b-2 -mb-px",
                    isActive
                      ? "text-primary border-primary bg-primary/5 font-semibold"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", colorDot(p.color))} />
                  <span>{p.name}</span>
                  <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{count}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === p.id ? null : p.id);
                    }}
                    className="ml-1 text-muted-foreground hover:text-foreground p-0.5 rounded"
                  >
                    <MoreHorizontal size={12} />
                  </span>
                </button>
                {menuOpenId === p.id && (
                  <div
                    ref={menuRef}
                    className="absolute top-full right-0 mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[140px]"
                  >
                    <button
                      onClick={() => openEdit(p)}
                      className="w-full text-left text-[11px] text-foreground px-3 py-1.5 hover:bg-muted flex items-center gap-2"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="w-full text-left text-[11px] text-foreground px-3 py-1.5 hover:bg-muted flex items-center gap-2"
                    >
                      <Copy size={11} /> Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="w-full text-left text-[11px] text-destructive px-3 py-1.5 hover:bg-muted flex items-center gap-2"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={openCreate}
            className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-primary border-b-2 border-transparent -mb-px"
          >
            <Plus size={12} /> New Pipeline
          </button>
        </div>
      </div>

      {showAdd && activePipeline && (
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Contact name (e.g., Jane Doe — Acme Co)"
            className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <span className="text-[10px] text-muted-foreground">
            → {activePipeline.name}
          </span>
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
      ) : !activePipeline ? (
        <div className="text-xs text-muted-foreground">Select a pipeline above.</div>
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <div className="flex gap-3" style={{ minWidth: `${Math.max(activePipeline.stages.length * 220, 800)}px` }}>
            {activePipeline.stages.map((stage, idx) => {
              const items = byStage[stage] || [];
              const lower = stage.toLowerCase();
              const isWon = lower === "won";
              const isLost = lower === "lost";
              const isClosed = isWon || isLost;
              return (
                <div
                  key={stage + idx}
                  className="min-h-[400px] min-w-[200px] flex-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop(stage)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stage}</h3>
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
                            isWon && "bg-card/50 opacity-75",
                            isLost && "bg-card/50 opacity-60",
                            !isClosed && "bg-card"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-semibold text-foreground leading-tight">{card.name}</p>
                            {isWon && (
                              <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded shrink-0">
                                Won
                              </span>
                            )}
                            {isLost && (
                              <span className="text-[9px] font-semibold bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded shrink-0">
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

      <PipelineModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editingPipeline}
        onSaved={(p) => setActivePipelineId(p.id)}
      />
    </div>
  );
}
