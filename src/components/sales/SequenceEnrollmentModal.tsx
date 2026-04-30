import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCrm } from "@/contexts/CrmContext";
import { toast } from "sonner";

// Convert {YYYY-MM-DD, hour} interpreted in IANA tz → UTC ISO string.
function zonedDateToUtcIso(dateStr: string, hour: number, tz: string): string {
  const naiveUtc = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00Z`);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(naiveUtc).reduce<Record<string, string>>((a, p) => {
    if (p.type !== "literal") a[p.type] = p.value;
    return a;
  }, {});
  const asTz = Date.UTC(
    parseInt(parts.year), parseInt(parts.month) - 1, parseInt(parts.day),
    parseInt(parts.hour) % 24, parseInt(parts.minute), parseInt(parts.second),
  );
  const offsetMs = asTz - naiveUtc.getTime();
  return new Date(naiveUtc.getTime() - offsetMs).toISOString();
}

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
  const { contacts } = useCrm();
  const contact = contacts.find((c) => c.id === contactId);
  const contactEmail = (contact?.email || "").trim();
  const hasEmail = contactEmail.length > 0;
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [submitting, setSubmitting] = useState(false);
  const [tz, setTz] = useState<string>("America/Los_Angeles");
  const [winStart, setWinStart] = useState<number>(9);
  const [winEnd, setWinEnd] = useState<number>(16);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_email_settings")
        .select("timezone, send_window_start_hour, send_window_end_hour")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setTz((data as any).timezone || "America/Los_Angeles");
        setWinStart((data as any).send_window_start_hour ?? 9);
        setWinEnd((data as any).send_window_end_hour ?? 16);
      }
    })();
  }, [user]);

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
    if (!hasEmail) {
      toast.error("This contact needs an email address before it can be enrolled.");
      return;
    }
    setSubmitting(true);

    // Block if sending domain not verified
    const { data: settings } = await supabase
      .from("user_email_settings")
      .select("domain_verified")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!settings?.domain_verified) {
      setSubmitting(false);
      toast.error(
        "Your sending domain is not verified. Go to Settings → Email to verify.",
      );
      return;
    }

    const next = zonedDateToUtcIso(startDate, winStart, tz);
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
          {!hasEmail && (
            <div className="border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs rounded-lg p-3">
              This contact needs an email address before it can be enrolled. Add an email in the contact details first.
            </div>
          )}
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
                <p className="text-[11px] text-muted-foreground mt-1">
                  Will fire between {winStart}:00–{winEnd}:00 in {tz} (Mon–Fri only).
                </p>
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
            disabled={!selectedName || submitting || !hasEmail}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Enrolling…" : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}
