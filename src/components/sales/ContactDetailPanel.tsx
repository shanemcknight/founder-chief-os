import { useEffect, useState, useMemo } from "react";
import { X, Mail, Phone, MapPin, Building2, Plus, Check, Trash2 } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SequenceEnrollmentModal from "@/components/sales/SequenceEnrollmentModal";
import { cn } from "@/lib/utils";

function formatDateLong(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Tab = "overview" | "activity" | "tasks" | "notes";

export default function ContactDetailPanel({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const { contacts, companies, activities, tasks, updateContact, logActivity, createTask, toggleTask, deleteTask, pipelines } = useCrm();
  const contact = contacts.find((c) => c.id === contactId);
  const company = contact?.company_id ? companies.find((c) => c.id === contact.company_id) : null;
  const contactPipeline = contact?.pipeline_id ? pipelines.find((p) => p.id === contact.pipeline_id) : null;
  const [tab, setTab] = useState<Tab>("overview");
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [notesDraft, setNotesDraft] = useState(contact?.notes || "");

  useEffect(() => setNotesDraft(contact?.notes || ""), [contact?.notes]);

  // Esc closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const contactActivities = useMemo(() => activities.filter((a) => a.contact_id === contactId), [activities, contactId]);
  const contactTasks = useMemo(() => tasks.filter((t) => t.contact_id === contactId), [tasks, contactId]);

  if (!contact) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full md:w-[380px] bg-card border-l border-border z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{contact.name}</p>
            {contact.title && <p className="text-[11px] text-muted-foreground truncate">{contact.title}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-2">
          {(["overview", "activity", "tasks", "notes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 text-[11px] font-medium py-2 capitalize transition-colors",
                tab === t ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === "overview" && (
            <>
              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Mail size={12} /> <span className="text-foreground">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Phone size={12} /> <span className="text-foreground">{contact.phone}</span>
                  </div>
                )}
                {company && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Building2 size={12} /> <span className="text-foreground">{company.name}</span>
                  </div>
                )}
                {contact.location && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <MapPin size={12} /> <span className="text-foreground">{contact.location}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pipeline</label>
                <select
                  value={contact.pipeline_id || ""}
                  onChange={(e) => {
                    const newPid = e.target.value || null;
                    const newPipeline = pipelines.find((p) => p.id === newPid);
                    updateContact(contact.id, {
                      pipeline_id: newPid,
                      stage: newPipeline?.stages.includes(contact.stage) ? contact.stage : (newPipeline?.stages[0] || contact.stage),
                    });
                  }}
                  className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">— Unassigned —</option>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stage</label>
                <select
                  value={contact.stage || ""}
                  onChange={(e) => updateContact(contact.id, { stage: e.target.value })}
                  disabled={!contactPipeline}
                  className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                >
                  {contactPipeline ? (
                    contactPipeline.stages.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  ) : (
                    <option value="">Assign a pipeline first</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Value (monthly)</label>
                <input
                  type="number"
                  value={contact.value}
                  onChange={(e) => updateContact(contact.id, { value: Number(e.target.value) || 0 })}
                  className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Value (monthly)</label>
                <input
                  type="number"
                  value={contact.value}
                  onChange={(e) => updateContact(contact.id, { value: Number(e.target.value) || 0 })}
                  className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              {contact.tags.length > 0 && (
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contact.tags.map((t) => (
                      <span key={t} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "activity" && (
            <>
              <div className="space-y-2">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                </select>
                <textarea
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={async () => {
                    if (!activityText.trim()) return;
                    await logActivity(contactId, activityType, activityText.trim());
                    setActivityText("");
                  }}
                  className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Log Activity
                </button>
              </div>
              <div className="space-y-2 pt-2 border-t border-border">
                {contactActivities.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-4">No activity yet</p>
                )}
                {contactActivities.map((a) => (
                  <div key={a.id} className="bg-background/50 border border-border rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider text-primary font-semibold">{a.type}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                    {a.description && <p className="text-[11px] text-foreground mt-1">{a.description}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "tasks" && (
            <>
              <div className="space-y-2">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="New task title..."
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                />
                <input
                  type="datetime-local"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                />
                <button
                  onClick={async () => {
                    if (!taskTitle.trim()) return;
                    await createTask(contactId, taskTitle.trim(), taskDue || null);
                    setTaskTitle("");
                    setTaskDue("");
                  }}
                  className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <Plus size={12} /> Add Task
                </button>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-border">
                {contactTasks.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-4">No tasks yet</p>
                )}
                {contactTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 bg-background/50 border border-border rounded-md p-2">
                    <button
                      onClick={() => toggleTask(t.id, !t.completed)}
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        t.completed ? "bg-success border-success" : "border-border hover:border-primary"
                      )}
                    >
                      {t.completed && <Check size={10} className="text-background" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[11px] text-foreground truncate", t.completed && "line-through text-muted-foreground")}>
                        {t.title}
                      </p>
                      {t.due_date && (
                        <p className="text-[10px] text-muted-foreground">{new Date(t.due_date).toLocaleString()}</p>
                      )}
                    </div>
                    <button onClick={() => deleteTask(t.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "notes" && (
            <div className="space-y-2">
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={10}
                placeholder="Notes..."
                className="w-full bg-background border border-border rounded-md p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={() => updateContact(contact.id, { notes: notesDraft })}
                className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                Save Notes
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
