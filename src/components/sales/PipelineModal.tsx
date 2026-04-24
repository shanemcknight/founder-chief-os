import { useEffect, useState } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { useCrm, Pipeline, PIPELINE_COLORS } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_STAGES = ["New Lead", "Contacted", "Proposal Sent", "Won", "Lost"];

type Props = {
  open: boolean;
  onClose: () => void;
  editing?: Pipeline | null;
  onSaved?: (p: Pipeline) => void;
};

export default function PipelineModal({ open, onClose, editing, onSaved }: Props) {
  const { createPipeline, updatePipeline } = useCrm();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("primary");
  const [stages, setStages] = useState<string[]>(DEFAULT_STAGES);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setDescription(editing.description || "");
        setColor(editing.color || "primary");
        setStages(editing.stages.length > 0 ? [...editing.stages] : DEFAULT_STAGES);
      } else {
        setName("");
        setDescription("");
        setColor("primary");
        setStages(DEFAULT_STAGES);
      }
    }
  }, [open, editing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const updateStage = (i: number, val: string) => {
    setStages((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  };
  const removeStage = (i: number) => setStages((prev) => prev.filter((_, idx) => idx !== i));
  const addStage = () => setStages((prev) => [...prev, "New Stage"]);

  const onDragStart = (i: number) => setDragIdx(i);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return;
    setStages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIdx, 1);
      copy.splice(i, 0, moved);
      return copy;
    });
    setDragIdx(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Pipeline name is required");
      return;
    }
    const cleanStages = stages.map((s) => s.trim()).filter(Boolean);
    if (cleanStages.length === 0) {
      toast.error("Add at least one stage");
      return;
    }
    setSaving(true);
    if (editing) {
      await updatePipeline(editing.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        stages: cleanStages,
      });
      toast.success("Pipeline updated");
      onSaved?.({ ...editing, name: name.trim(), description: description.trim(), color, stages: cleanStages });
    } else {
      const created = await createPipeline({
        name: name.trim(),
        description: description.trim(),
        color,
        stages: cleanStages,
      });
      if (created) {
        toast.success("Pipeline created");
        onSaved?.(created);
      }
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">{editing ? "Edit Pipeline" : "Create Pipeline"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-foreground">Pipeline name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Sales, Wholesale Accounts, Investor Outreach"
              className="mt-1 text-sm border border-border rounded-lg px-3 py-2.5 w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this pipeline for?"
              rows={2}
              className="mt-1 text-sm border border-border rounded-lg px-3 py-2.5 w-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-foreground">Pipeline color</label>
            <div className="flex items-center gap-2 mt-2">
              {PIPELINE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={cn(
                    "w-7 h-7 rounded-full cursor-pointer border-2 transition-transform",
                    c.className,
                    color === c.key ? "border-foreground scale-110" : "border-transparent"
                  )}
                  aria-label={c.key}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-foreground">Pipeline stages</label>
            <p className="text-[11px] text-muted-foreground mt-0.5">Drag to reorder. Add as many stages as you need.</p>
            <div className="space-y-1.5 mt-2">
              {stages.map((s, i) => {
                const lower = s.toLowerCase().trim();
                const isWon = lower === "won";
                const isLost = lower === "lost";
                return (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(i)}
                    className="flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1.5"
                  >
                    <GripVertical size={14} className="text-muted-foreground cursor-grab shrink-0" />
                    {isWon && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                    {isLost && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                    <input
                      value={s}
                      onChange={(e) => updateStage(i, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeStage(i)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Remove stage"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addStage}
              className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <Plus size={12} /> Add Stage
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs font-medium border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Pipeline"}
          </button>
        </div>
      </div>
    </div>
  );
}
