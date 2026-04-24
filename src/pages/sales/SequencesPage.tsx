import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Mail, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type EmailTemplate = {
  id: string;
  user_id: string;
  sequence_name: string;
  sequence_step: number;
  subject: string;
  body_text: string;
  body_html: string | null;
  delay_days: number | null;
  created_at: string;
};

type EnrollmentRow = { sequence_name: string };

type StepDraft = {
  id?: string; // existing template id (if loaded from db)
  subject: string;
  body_text: string;
  body_html: string;
  delay_days: number; // ignored for step 1 (handled at enrollment)
  htmlOpen: boolean;
};

type TestState = "idle" | "sending" | "sent" | "error";

export default function SequencesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [hasResendKey, setHasResendKey] = useState<boolean>(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOriginalName, setEditingOriginalName] = useState<string | null>(
    null
  );
  const [seqName, setSeqName] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([]);

  // Delete confirm
  const [deleteName, setDeleteName] = useState<string | null>(null);

  // Test send state per step index
  const [testState, setTestState] = useState<Record<number, TestState>>({});

  const sendTest = async (idx: number, step: StepDraft) => {
    if (!step.subject.trim() || !step.body_text.trim()) {
      toast.error("Subject and plain text body are required to send a test");
      return;
    }
    setTestState((s) => ({ ...s, [idx]: "sending" }));
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-test-email",
        {
          body: {
            subject: step.subject,
            body_text: step.body_text,
            body_html: step.body_html || "",
          },
        }
      );
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Send failed");
      }
      setTestState((s) => ({ ...s, [idx]: "sent" }));
      toast.success(`Test email sent to ${(data as any)?.sent_to || "you"}`);
      setTimeout(() => {
        setTestState((s) => ({ ...s, [idx]: "idle" }));
      }, 3000);
    } catch (e: any) {
      console.error(e);
      setTestState((s) => ({ ...s, [idx]: "error" }));
      setTimeout(() => {
        setTestState((s) => ({ ...s, [idx]: "idle" }));
      }, 4000);
    }
  };

  // ---------- Load ----------
  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const [tpl, enr, ping] = await Promise.all([
      supabase
        .from("email_templates" as any)
        .select("*")
        .order("sequence_name", { ascending: true })
        .order("sequence_step", { ascending: true }),
      supabase
        .from("email_sequences" as any)
        .select("sequence_name")
        .neq("status", "completed"),
      // Ping the sender — it returns 500 with "RESEND_API_KEY not configured"
      // if the platform secret is missing. Any other response means it's set.
      supabase.functions.invoke("send-sequence-email", { body: {} }),
    ]);
    setTemplates(((tpl.data as any[]) || []) as EmailTemplate[]);
    setEnrollments(((enr.data as any[]) || []) as EnrollmentRow[]);
    const pingErr: any = (ping as any)?.error;
    const missingKey =
      typeof pingErr?.message === "string" &&
      pingErr.message.toLowerCase().includes("resend_api_key");
    setHasResendKey(!missingKey);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------- Group by sequence_name ----------
  const grouped = useMemo(() => {
    const map = new Map<string, EmailTemplate[]>();
    for (const t of templates) {
      const arr = map.get(t.sequence_name) || [];
      arr.push(t);
      map.set(t.sequence_name, arr);
    }
    for (const [, arr] of map) arr.sort((a, b) => a.sequence_step - b.sequence_step);
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      steps: items,
      enrolled: enrollments.filter((e) => e.sequence_name === name).length,
    }));
  }, [templates, enrollments]);

  // ---------- Modal ----------
  const openNew = () => {
    setEditingOriginalName(null);
    setSeqName("");
    setSteps([
      {
        subject: "",
        body_text: "",
        body_html: "",
        delay_days: 0,
        htmlOpen: false,
      },
    ]);
    setModalOpen(true);
  };

  const openEdit = (name: string) => {
    const list = grouped.find((g) => g.name === name);
    if (!list) return;
    setEditingOriginalName(name);
    setSeqName(name);
    setSteps(
      list.steps.map((t) => ({
        id: t.id,
        subject: t.subject,
        body_text: t.body_text,
        body_html: t.body_html ?? "",
        delay_days: t.delay_days ?? 7,
        htmlOpen: !!t.body_html,
      }))
    );
    setModalOpen(true);
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        subject: "",
        body_text: "",
        body_html: "",
        delay_days: 7,
        htmlOpen: false,
      },
    ]);
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const saveSequence = async () => {
    if (!user) return;
    const name = seqName.trim();
    if (!name) {
      toast.error("Sequence name is required");
      return;
    }
    if (steps.length === 0) {
      toast.error("Add at least one step");
      return;
    }
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].subject.trim() || !steps[i].body_text.trim()) {
        toast.error(`Step ${i + 1}: subject and plain text body are required`);
        return;
      }
    }

    // If renaming, treat as new set: delete templates for the old name.
    const renaming = editingOriginalName && editingOriginalName !== name;

    // Determine which existing template ids should be removed (steps deleted in editor)
    const existing =
      editingOriginalName
        ? templates.filter((t) => t.sequence_name === editingOriginalName)
        : [];
    const keptIds = new Set(
      steps.map((s) => s.id).filter(Boolean) as string[]
    );
    const toDelete = renaming
      ? existing.map((t) => t.id)
      : existing.filter((t) => !keptIds.has(t.id)).map((t) => t.id);

    // Build upsert rows. Step 1 delay is irrelevant (set to 0).
    const rows = steps.map((s, i) => ({
      id: renaming ? undefined : s.id, // when renaming, insert fresh rows
      user_id: user.id,
      sequence_name: name,
      sequence_step: i + 1,
      subject: s.subject.trim(),
      body_text: s.body_text,
      body_html: s.body_html.trim() ? s.body_html : null,
      delay_days: i === 0 ? 0 : Math.max(0, Number(s.delay_days) || 0),
    }));

    try {
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("email_templates" as any)
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }

      // Split into updates (with id) and inserts (no id)
      const updates = rows.filter((r) => !!r.id);
      const inserts = rows
        .filter((r) => !r.id)
        .map(({ id: _omit, ...rest }) => rest);

      for (const u of updates) {
        const { id, ...patch } = u;
        const { error } = await supabase
          .from("email_templates" as any)
          .update(patch as any)
          .eq("id", id as string);
        if (error) throw error;
      }
      if (inserts.length > 0) {
        const { error } = await supabase
          .from("email_templates" as any)
          .insert(inserts as any);
        if (error) throw error;
      }

      toast.success("Sequence saved");
      setModalOpen(false);
      await refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save sequence");
    }
  };

  const confirmDelete = async () => {
    if (!deleteName || !user) return;
    const { error } = await supabase
      .from("email_templates" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("sequence_name", deleteName);
    if (error) {
      toast.error("Failed to delete sequence");
      return;
    }
    toast.success(`Deleted "${deleteName}"`);
    setDeleteName(null);
    await refresh();
  };

  // ---------- Render ----------
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold">Email Sequences</h1>
          <p className="text-sm text-muted-foreground">Automate your outreach</p>
        </div>
        <button
          onClick={openNew}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1 hover:opacity-90 transition"
        >
          New Sequence <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* No Resend key warning */}
      {!loading && !hasResendKey && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-sm text-foreground">
            Email sending is not yet configured. Contact support to enable sequences.
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-10 h-10 text-primary/30 mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-xl font-bold">No sequences yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build your first sequence to start automating your outreach.
          </p>
          <button
            onClick={openNew}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg mt-5 text-sm font-semibold hover:opacity-90 transition"
          >
            Build a Sequence →
          </button>
        </div>
      ) : (
        <div>
          {grouped.map((g) => (
            <div
              key={g.name}
              className="bg-card border border-border rounded-xl p-5 mb-3"
            >
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold">{g.name}</h3>
                <span className="text-sm text-muted-foreground">
                  {g.steps.length} step{g.steps.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mb-3">
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {g.enrolled} contact{g.enrolled === 1 ? "" : "s"} enrolled
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openEdit(g.name)}
                  className="border border-border text-sm px-4 py-2 rounded-lg hover:bg-muted/50 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteName(g.name)}
                  className="text-destructive text-sm px-4 py-2 hover:bg-destructive/10 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Builder Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="text-base font-bold">
                {editingOriginalName ? "Edit Sequence" : "Build Sequence"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Sequence name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Sequence name
                </label>
                <input
                  value={seqName}
                  onChange={(e) => setSeqName(e.target.value)}
                  placeholder="e.g. Cold Outreach, Product Demo Follow-up, Re-engagement"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Steps */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Steps
                  </span>
                  <button
                    onClick={addStep}
                    className="text-primary text-xs ml-auto hover:underline"
                  >
                    + Add Step
                  </button>
                </div>

                {steps.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/30 border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-muted-foreground">
                        Step {idx + 1}
                      </span>
                      {steps.length > 1 && (
                        <button
                          onClick={() => removeStep(idx)}
                          className="text-muted-foreground hover:text-destructive text-xs inline-flex items-center gap-1"
                          aria-label={`Remove step ${idx + 1}`}
                        >
                          <Trash2 className="w-3 h-3" /> ×
                        </button>
                      )}
                    </div>

                    {/* Delay */}
                    <div className="mb-3">
                      {idx === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Sends on the date you set at enrollment
                        </p>
                      ) : (
                        <p className="text-xs text-foreground inline-flex items-center gap-2">
                          Send
                          <input
                            type="number"
                            min={0}
                            value={s.delay_days}
                            onChange={(e) =>
                              updateStep(idx, {
                                delay_days: Number(e.target.value),
                              })
                            }
                            className="w-14 text-center border border-border bg-background rounded px-2 py-1 text-sm"
                          />
                          days after previous step
                        </p>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="mb-3">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Subject
                      </label>
                      <input
                        data-merge-target
                        value={s.subject}
                        onChange={(e) => updateStep(idx, { subject: e.target.value })}
                        placeholder="Email subject line"
                        className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Plain text body */}
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Plain text body{" "}
                        <span className="text-muted-foreground text-[10px] normal-case tracking-normal">
                          (required)
                        </span>
                      </label>
                      <textarea
                        data-merge-target
                        rows={4}
                        value={s.body_text}
                        onChange={(e) =>
                          updateStep(idx, { body_text: e.target.value })
                        }
                        placeholder="The plain text version — appears in inbox preview"
                        className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm resize-none"
                      />
                    </div>

                    {/* Merge field chips */}
                    <div className="mt-2 flex items-center flex-wrap gap-1.5">
                      <span className="text-[10px] text-muted-foreground mr-1">
                        Insert merge field →
                      </span>
                      {[
                        "{{first_name}}",
                        "{{company}}",
                        "{{city}}",
                        "{{full_name}}",
                        "{{website}}",
                      ].map((token) => (
                        <button
                          key={token}
                          type="button"
                          onMouseDown={(e) => {
                            // Prevent the active input from losing focus before we read selection
                            e.preventDefault();
                          }}
                          onClick={() => {
                            const el = document.activeElement as
                              | HTMLInputElement
                              | HTMLTextAreaElement
                              | null;
                            if (
                              !el ||
                              !el.hasAttribute("data-merge-target") ||
                              (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")
                            ) {
                              // Default: append to plain text body of this step
                              updateStep(idx, {
                                body_text: (s.body_text || "") + token,
                              });
                              return;
                            }
                            const start = el.selectionStart ?? el.value.length;
                            const end = el.selectionEnd ?? el.value.length;
                            const newVal =
                              el.value.slice(0, start) + token + el.value.slice(end);
                            // Determine which field changed via placeholder/role
                            if (el === (document.activeElement as any)) {
                              // Find the step container
                              const event = new Event("input", { bubbles: true });
                              const setter = Object.getOwnPropertyDescriptor(
                                el.tagName === "TEXTAREA"
                                  ? HTMLTextAreaElement.prototype
                                  : HTMLInputElement.prototype,
                                "value",
                              )?.set;
                              setter?.call(el, newVal);
                              el.dispatchEvent(event);
                              // Restore caret after the inserted token
                              const pos = start + token.length;
                              requestAnimationFrame(() => {
                                el.focus();
                                el.setSelectionRange(pos, pos);
                              });
                            }
                          }}
                          className="border border-border rounded px-2 py-0.5 text-[10px] font-mono text-primary cursor-pointer hover:bg-primary/10 transition-colors"
                        >
                          {token}
                        </button>
                      ))}
                    </div>

                    {/* HTML body */}
                    <div className="mt-3">
                      {!s.htmlOpen ? (
                        <button
                          onClick={() => updateStep(idx, { htmlOpen: true })}
                          className="text-primary text-xs hover:underline"
                        >
                          Add HTML version +
                        </button>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              HTML body
                            </label>
                            <button
                              onClick={() =>
                                updateStep(idx, { htmlOpen: false, body_html: "" })
                              }
                              className="text-muted-foreground hover:text-destructive text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <textarea
                            rows={5}
                            value={s.body_html}
                            onChange={(e) =>
                              updateStep(idx, { body_html: e.target.value })
                            }
                            placeholder="Full HTML template — renders below the plain text in email clients"
                            className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm resize-none font-mono text-[11px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-card">
              <button
                onClick={() => setModalOpen(false)}
                className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveSequence}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                Save Sequence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteName && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteName(null)}
        >
          <div
            className="bg-card border border-border rounded-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-2">Delete sequence?</h3>
            <p className="text-sm text-muted-foreground">
              Delete "{deleteName}" and all its steps? Contacts already enrolled will
              not receive further emails.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteName(null)}
                className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
