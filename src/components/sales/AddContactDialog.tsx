import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Pipeline to assign the new contact to. If null, uses active or first available. */
  defaultPipelineId?: string | null;
  onCreated?: (contactId: string) => void;
};

const EMPTY = { name: "", email: "", company: "", phone: "", city: "", website: "" };

export default function AddContactDialog({ open, onClose, defaultPipelineId, onCreated }: Props) {
  const { pipelines, activePipelineId, createContact, createCompany, setSelectedContactId } = useCrm();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [pipelineId, setPipelineId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const initial =
      defaultPipelineId ||
      activePipelineId ||
      pipelines[0]?.id ||
      "";
    setPipelineId(initial);
    setForm(EMPTY);
  }, [open, defaultPipelineId, activePipelineId, pipelines]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canCreate = form.name.trim().length > 0 && emailValid && !!pipelineId && !submitting;
  const pipeline = pipelines.find((p) => p.id === pipelineId) || null;

  const handleAdd = async () => {
    if (!canCreate || !pipeline) return;
    setSubmitting(true);
    let companyId: string | null = null;
    if (form.company.trim()) {
      const co = await createCompany({
        name: form.company.trim(),
        location: form.city.trim() || null,
        website: form.website.trim() || null,
      });
      companyId = co?.id || null;
    }
    const c = await createContact({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      location: form.city.trim() || null,
      website: form.website.trim() || null,
      company_id: companyId,
      pipeline_id: pipeline.id,
      stage: pipeline.stages[0] || "New Lead",
    });
    setSubmitting(false);
    if (c) {
      setSelectedContactId(c.id);
      onCreated?.(c.id);
      onClose();
    }
  };

  const fields: Array<{ key: keyof typeof EMPTY; label: string; placeholder: string; type: string }> = [
    { key: "name", label: "Contact Name *", placeholder: "Jane Doe", type: "text" },
    { key: "email", label: "Email *", placeholder: "jane@acmebar.com", type: "email" },
    { key: "company", label: "Company", placeholder: "Acme Bar & Grill", type: "text" },
    { key: "phone", label: "Phone", placeholder: "(555) 123-4567", type: "tel" },
    { key: "city", label: "City", placeholder: "Austin, TX", type: "text" },
    { key: "website", label: "Website", placeholder: "https://acmebar.com", type: "url" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Add Contact</h2>
            {pipeline && (
              <p className="text-[11px] text-muted-foreground mt-0.5">→ {pipeline.name}</p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {pipelines.length > 1 && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Pipeline
              </label>
              <select
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {f.label}
                </label>
                <input
                  autoFocus={f.key === "name"}
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreate) handleAdd();
                  }}
                  placeholder={f.placeholder}
                  className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-border px-4 py-2 rounded-lg text-xs hover:bg-muted/50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!canCreate}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
