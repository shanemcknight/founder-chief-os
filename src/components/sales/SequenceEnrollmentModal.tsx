import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type TemplateRow = {
  id: string;
  user_id: string;
  sequence_name: string;
  sequence_step: number;
  subject: string;
  body_text: string;
  body_html: string | null;
  delay_days: number | null;
};

export default function SequenceEnrollmentModal({
  contactId,
  pipelineId,
  onClose,
  onEnrolled,
}: {
  contactId: string;
  pipelineId: string | null;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("email_templates" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("sequence_name", { ascending: true })
        .order("sequence_step", { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      if (cancelled) return;
      const rows = ((data as any[]) || []) as TemplateRow[];
      setTemplates(rows);
      // default selection: first sequence_name
      const first = rows[0]?.sequence_name || "";
      if (first) setSelectedName((prev) => prev || first);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const sequenceNames = useMemo(
    () => Array.from(new Set(templates.map((t) => t.sequence_name))),
    [templates]
  );

  const selectedSteps = useMemo(
    () =>
      templates
        .filter((t) => t.sequence_name === selectedName)
        .sort((a, b) => a.sequence_step - b.sequence_step),
    [templates, selectedName]
  );

  const enroll = async () => {
    if (!user || !selectedName) return;
    setSubmitting(true);
    const next = new Date(`${startDate}T09:00:00`).toISOString();
    const { error } = await supabase.from("email_sequences" as any).insert({
      user_id: user.id,
      contact_id: contactId,
      pipeline_id: pipelineId,
      sequence_name: selectedName,
      sequence_step: 1,
      status: "pending",
      next_send_at: next,
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Failed to enroll");
      return;
    }
    toast.success(`Enrolled in ${selectedName}`);
    onEnrolled();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold">Enroll in Sequence</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {sequenceNames.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No sequences yet. Go to{" "}
              <Link
                to="/sales/sequences"
                className="text-primary hover:underline"
                onClick={onClose}
              >
                Sales → Sequences
              </Link>{" "}
              to build one.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Select sequence
                </label>
                <select
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {sequenceNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Send first email on
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {selectedSteps.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Sequence Preview
                  </p>
                  <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-1">
                    {(() => {
                      let cumulative = 0;
                      return selectedSteps.map((s, idx) => {
                        if (idx > 0) cumulative += s.delay_days ?? 7;
                        const dayLabel =
                          idx === 0
                            ? "Day 0 (sends on start date)"
                            : `Day ${cumulative}`;
                        return (
                          <p
                            key={s.id}
                            className="text-[11px] text-muted-foreground"
                          >
                            Step {s.sequence_step} — {dayLabel} ·{" "}
                            {s.subject || "(no subject)"}
                          </p>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted/50 transition"
          >
            Cancel
          </button>
          <button
            onClick={enroll}
            disabled={!selectedName || submitting}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Enrolling…" : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}
