import { useEffect, useState, useMemo, useRef } from "react";
import {
  X, Mail, Phone, MapPin, Building2, Plus, Check, Trash2, Edit2, MoreHorizontal,
  ChevronLeft, ChevronRight, ExternalLink, Link2, Calendar, Briefcase, User, DollarSign,
  Tag, Globe, Clock, FileText, Activity as ActivityIcon, ListTodo, MessageSquare,
  PhoneCall, Mail as MailIcon, Users, Video, BellRing, StickyNote, Copy, Trash, Shuffle,
} from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "overview" | "activity" | "notes" | "tasks";

const ACTIVITY_TYPES = [
  { value: "call", label: "Call", icon: PhoneCall, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "email_sent", label: "Email Sent", icon: MailIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { value: "email_received", label: "Email Received", icon: MailIcon, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { value: "meeting", label: "Meeting", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
  { value: "demo", label: "Demo", icon: Video, color: "text-pink-500", bg: "bg-pink-500/10" },
  { value: "follow_up", label: "Follow-up", icon: BellRing, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "note", label: "Note", icon: StickyNote, color: "text-muted-foreground", bg: "bg-muted" },
  { value: "other", label: "Other", icon: MessageSquare, color: "text-muted-foreground", bg: "bg-muted" },
] as const;

const LEAD_SOURCES = ["Outscraper", "Apollo", "Manual", "CSV Import", "Referral", "Other"];

function detectEmailType(email: string | null | undefined): string | null {
  if (!email) return null;
  const prefix = email.split("@")[0]?.toLowerCase() || "";
  if (/^(owner|founder|proprietor|principal)/.test(prefix)) return "owner";
  if (/^(ceo|president|gm|director|vp|chief)/.test(prefix)) return "decision maker";
  if (/^(manager|mgr|operations|ops)/.test(prefix)) return "manager";
  if (/^(info|hello|contact|hi|general|support)/.test(prefix)) return "info";
  if (/^(sales|booking|events|wholesale|orders|purchasing)/.test(prefix)) return "sales";
  return "general";
}

const emailTypeBadge = (t: string | null) => {
  if (!t) return null;
  const map: Record<string, string> = {
    "owner": "bg-emerald-500/10 text-emerald-600",
    "decision maker": "bg-primary/10 text-primary",
    "manager": "bg-amber-500/10 text-amber-600",
    "info": "bg-muted text-muted-foreground",
    "sales": "bg-muted text-muted-foreground",
    "general": "bg-muted text-muted-foreground",
  };
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", map[t] || map["general"])}>{t}</span>;
};

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString();
}

// --- Inline editable text ---
function InlineField({
  value, onSave, placeholder, className, multiline = false, type = "text",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (editing) {
    const commit = () => {
      setEditing(false);
      if (draft !== value) onSave(draft);
    };
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={2}
        placeholder={placeholder}
        className={cn("w-full bg-muted/30 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none", className)}
      />
    ) : (
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); }}}
        placeholder={placeholder}
        className={cn("w-full bg-muted/30 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50", className)}
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className={cn(
        "w-full text-left text-sm text-foreground hover:bg-muted/30 rounded px-2 py-1 -mx-2 transition-colors min-h-[28px]",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      {value || placeholder || "—"}
    </button>
  );
}

export default function ContactDetailPanel({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const {
    contacts, companies, activities, tasks, pipelines,
    updateContact, deleteContact, logActivity, createTask, toggleTask, deleteTask, setSelectedContactId,
  } = useCrm();

  const contact = contacts.find((c) => c.id === contactId);
  const company = contact?.company_id ? companies.find((c) => c.id === contact.company_id) : null;
  const contactPipeline = contact?.pipeline_id ? pipelines.find((p) => p.id === contact.pipeline_id) : null;

  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  // Activity composer
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState("call");
  const [activityNotes, setActivityNotes] = useState("");

  // Task composer
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");

  // Notes
  const [notesDraft, setNotesDraft] = useState(contact?.notes || "");
  const [notesSaved, setNotesSaved] = useState<string | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotesDraft(contact?.notes || "");
    setNotesSaved(null);
  }, [contact?.id, contact?.notes]);

  const contactActivities = useMemo(
    () => activities.filter((a) => a.contact_id === contactId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [activities, contactId]
  );
  const contactTasks = useMemo(() => tasks.filter((t) => t.contact_id === contactId), [tasks, contactId]);

  // Prev / next navigation in current contacts list
  const idx = contacts.findIndex((c) => c.id === contactId);
  const prevId = idx > 0 ? contacts[idx - 1].id : null;
  const nextId = idx >= 0 && idx < contacts.length - 1 ? contacts[idx + 1].id : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (!inField) {
        if (e.key === "ArrowLeft" && prevId) { e.preventDefault(); setSelectedContactId(prevId); }
        if (e.key === "ArrowRight" && nextId) { e.preventDefault(); setSelectedContactId(nextId); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prevId, nextId, setSelectedContactId]);

  const leadSource = useMemo(() => {
    if (!contact) return "";
    return contact.tags.find((t) => LEAD_SOURCES.map(s => s.toLowerCase()).includes(t.toLowerCase())) || "";
  }, [contact]);

  if (!contact) return null;

  const emailType = detectEmailType(contact.email);

  // Notes auto-save (debounced)
  const onNotesChange = (v: string) => {
    setNotesDraft(v);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      await updateContact(contact.id, { notes: v });
      setNotesSaved(new Date().toISOString());
    }, 800);
  };

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (contact.tags.includes(t)) { setTagDraft(""); return; }
    updateContact(contact.id, { tags: [...contact.tags, t] });
    setTagDraft("");
  };
  const removeTag = (t: string) => {
    updateContact(contact.id, { tags: contact.tags.filter((x) => x !== t) });
  };

  const setLeadSource = (src: string) => {
    const cleaned = contact.tags.filter((t) => !LEAD_SOURCES.map(s => s.toLowerCase()).includes(t.toLowerCase()));
    updateContact(contact.id, { tags: src ? [...cleaned, src] : cleaned });
  };

  const submitActivity = async () => {
    if (!activityNotes.trim()) {
      toast.error("Add some notes first");
      return;
    }
    await logActivity(contactId, activityType, activityNotes.trim());
    setActivityNotes("");
    setShowActivityForm(false);
    toast.success("Activity logged");
  };

  const submitTask = async () => {
    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    const prefix = taskPriority === "high" ? "[H] " : taskPriority === "low" ? "[L] " : "";
    await createTask(contactId, prefix + taskTitle.trim(), taskDue || null);
    setTaskTitle("");
    setTaskDue("");
    setTaskPriority("medium");
    setShowTaskForm(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${contact.name}? This cannot be undone.`)) return;
    await deleteContact(contact.id);
    toast.success("Contact deleted");
    onClose();
  };

  const handleDuplicate = async () => {
    toast.info("Duplicate contact — coming soon");
    setMenuOpen(false);
  };

  return (
    <>
      {/* Backdrop on mobile */}
      <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />

      <aside className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background border-l border-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <InlineField
              value={contact.name}
              onSave={(v) => v.trim() && updateContact(contact.id, { name: v.trim() })}
              className="text-lg font-bold !px-0 !mx-0"
            />
            <div className="mt-0.5">
              <InlineField
                value={company?.name || ""}
                onSave={() => toast.info("Edit company on Companies page")}
                placeholder="No company"
                className="text-sm text-muted-foreground !px-0 !mx-0"
              />
            </div>
            {contactPipeline && (
              <div className="mt-2 inline-flex items-center gap-1.5">
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                  {contact.stage || "—"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Prev/Next */}
            <button
              onClick={() => prevId && setSelectedContactId(prevId)}
              disabled={!prevId}
              title="Previous (←)"
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => nextId && setSelectedContactId(nextId)}
              disabled={!nextId}
              title="Next (→)"
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded hover:bg-muted transition-colors"
            >
              <ChevronRight size={16} />
            </button>

            {/* ··· menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-md shadow-lg z-20 py-1">
                    <button
                      onClick={handleDuplicate}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <Copy size={12} /> Duplicate
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setTab("overview"); toast.info("Switch pipeline below"); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <Shuffle size={12} /> Move pipeline
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2"
                    >
                      <Trash size={12} /> Delete contact
                    </button>
                  </div>
                </>
              )}
            </div>

            <button onClick={onClose} title="Close (Esc)" className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stage selector + quick info */}
        {contactPipeline && (
          <div className="px-6 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Stage</span>
            <select
              value={contact.stage || ""}
              onChange={(e) => updateContact(contact.id, { stage: e.target.value })}
              className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {contactPipeline.stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* TABS */}
        <div className="px-6 border-b border-border flex gap-6">
          {([
            { k: "overview", label: "Overview", icon: User },
            { k: "activity", label: "Activity", icon: ActivityIcon },
            { k: "notes", label: "Notes", icon: FileText },
            { k: "tasks", label: "Tasks", icon: ListTodo },
          ] as { k: Tab; label: string; icon: any }[]).map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "py-3 text-sm font-medium transition-colors -mb-px",
                tab === k
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="px-6 py-5 space-y-4">
              <Field label="Full Name">
                <InlineField value={contact.name} onSave={(v) => v.trim() && updateContact(contact.id, { name: v.trim() })} placeholder="Add name" />
              </Field>

              <Field label="Email">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <InlineField value={contact.email || ""} onSave={(v) => updateContact(contact.id, { email: v.trim() || null })} placeholder="Add email" type="email" />
                  </div>
                  {emailTypeBadge(emailType)}
                </div>
              </Field>

              <Field label="Phone">
                <InlineField value={contact.phone || ""} onSave={(v) => updateContact(contact.id, { phone: v.trim() || null })} placeholder="Add phone" />
              </Field>

              <Field label="Job Title">
                <InlineField value={contact.title || ""} onSave={(v) => updateContact(contact.id, { title: v.trim() || null })} placeholder="Add title" />
              </Field>

              <Field label="Company">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{company?.name || <span className="text-muted-foreground italic">No company linked</span>}</span>
                </div>
              </Field>

              <Field label="Location / Address">
                <InlineField value={contact.location || ""} onSave={(v) => updateContact(contact.id, { location: v.trim() || null })} placeholder="Add location" />
              </Field>

              <Field label="Website">
                {company?.website ? (
                  <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Globe size={12} /> {company.website} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No website</span>
                )}
              </Field>

              <Field label="Pipeline">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-muted-foreground shrink-0" />
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
                    className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">— Unassigned —</option>
                    {pipelines.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </Field>

              {contactPipeline && (
                <Field label="Stage">
                  <select
                    value={contact.stage || ""}
                    onChange={(e) => updateContact(contact.id, { stage: e.target.value })}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {contactPipeline.stages.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Tags">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {contact.tags.length === 0 && <span className="text-xs text-muted-foreground italic">No tags</span>}
                  {contact.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-[11px] bg-muted text-foreground px-2 py-0.5 rounded-full">
                      {t}
                      <button onClick={() => removeTag(t)} className="hover:text-destructive">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); }}}
                  placeholder="Add tag and press Enter"
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </Field>

              <Field label="Deal Value">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">$</span>
                  <InlineField
                    value={String(contact.value || 0)}
                    onSave={(v) => updateContact(contact.id, { value: Number(v) || 0 })}
                    type="number"
                  />
                </div>
              </Field>

              <Field label="Lead Source">
                <select
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">— Select source —</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Last Contacted">
                <input
                  type="datetime-local"
                  value={contact.last_contacted_at ? new Date(contact.last_contacted_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => updateContact(contact.id, { last_contacted_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </Field>

              <Field label="Created At">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock size={12} /> {new Date(contact.created_at).toLocaleString()}
                </span>
              </Field>
            </div>
          )}

          {/* ACTIVITY */}
          {tab === "activity" && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
                <button
                  onClick={() => setShowActivityForm((v) => !v)}
                  className="text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded font-medium flex items-center gap-1"
                >
                  <Plus size={12} /> Log Activity
                </button>
              </div>

              {showActivityForm && (
                <div className="bg-muted/20 border border-border rounded-lg p-3 mb-4 space-y-2">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {ACTIVITY_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  <textarea
                    value={activityNotes}
                    onChange={(e) => setActivityNotes(e.target.value)}
                    placeholder="What happened? Any key takeaways?"
                    rows={3}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setShowActivityForm(false); setActivityNotes(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitActivity}
                      className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90"
                    >
                      Save Activity
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {contactActivities.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center mt-8">
                    No activity logged yet. Log your first interaction above.
                  </p>
                )}
                {contactActivities.map((a) => {
                  const meta = ACTIVITY_TYPES.find((t) => t.value === a.type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
                  const Icon = meta.icon;
                  return (
                    <div key={a.id} className="flex gap-3 group">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", meta.bg)}>
                        <Icon size={13} className={meta.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">{meta.label}</span>
                          <span className="text-[11px] text-muted-foreground">{relativeTime(a.created_at)}</span>
                        </div>
                        {a.description && <p className="text-sm text-muted-foreground mt-0.5 break-words">{a.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NOTES */}
          {tab === "notes" && (
            <div className="px-6 py-5">
              <textarea
                value={notesDraft}
                onChange={(e) => onNotesChange(e.target.value)}
                onBlur={async () => {
                  if (notesDraft !== (contact.notes || "")) {
                    await updateContact(contact.id, { notes: notesDraft });
                    setNotesSaved(new Date().toISOString());
                    toast.success("Saved", { duration: 1200 });
                  }
                }}
                placeholder="Add notes about this contact..."
                className="w-full min-h-[200px] bg-muted/20 border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-2">
                {notesSaved ? `Last edited ${relativeTime(notesSaved)}` : "Auto-saves as you type. Supports **bold**, *italic*, - bullets."}
              </p>
            </div>
          )}

          {/* TASKS */}
          {tab === "tasks" && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
                <button
                  onClick={() => setShowTaskForm((v) => !v)}
                  className="text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded font-medium flex items-center gap-1"
                >
                  <Plus size={12} /> Add Task
                </button>
              </div>

              {showTaskForm && (
                <div className="bg-muted/20 border border-border rounded-lg p-3 mb-4 space-y-2">
                  <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task title"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                    />
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setShowTaskForm(false); setTaskTitle(""); setTaskDue(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitTask}
                      className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90"
                    >
                      Save Task
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {contactTasks.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center mt-8">
                    No tasks yet. Add a task to follow up with this contact.
                  </p>
                )}
                {contactTasks.map((t) => {
                  const isHigh = t.title.startsWith("[H]");
                  const isLow = t.title.startsWith("[L]");
                  const cleanTitle = t.title.replace(/^\[[HL]\]\s*/, "");
                  const due = t.due_date ? new Date(t.due_date) : null;
                  const overdue = due && !t.completed && due.getTime() < Date.now();
                  return (
                    <div key={t.id} className={cn("flex items-center gap-2 bg-muted/20 border border-border rounded-md p-2 group", t.completed && "opacity-50")}>
                      <button
                        onClick={() => toggleTask(t.id, !t.completed)}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          t.completed ? "bg-primary border-primary" : "border-border hover:border-primary"
                        )}
                      >
                        {t.completed && <Check size={10} className="text-primary-foreground" />}
                      </button>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isHigh ? "bg-destructive" : isLow ? "bg-muted-foreground/40" : "bg-amber-500")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm text-foreground truncate", t.completed && "line-through")}>
                          {cleanTitle}
                        </p>
                        {due && (
                          <p className={cn("text-[11px]", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                            {due.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button onClick={() => deleteTask(t.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
