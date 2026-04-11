import { useState } from "react";
import { toast } from "sonner";

const tones = [
  { value: "direct", label: "Direct", desc: "Concise, no fluff" },
  { value: "friendly", label: "Friendly", desc: "Warm and conversational" },
  { value: "formal", label: "Formal", desc: "Professional and structured" },
];

const autoApproveRules = [
  { id: "linkedin", label: "Auto-approve LinkedIn posts when confidence >90%" },
  { id: "email", label: "Auto-send email responses for FYI-priority emails" },
  { id: "expenses", label: "Auto-categorize expenses in QuickBooks" },
];

const notifications = [
  { id: "revenue", label: "Revenue anomaly detected" },
  { id: "social", label: "Social post goes viral (>2x avg engagement)" },
  { id: "inbox", label: "High-priority email unread >1 hour" },
  { id: "agent", label: "Agent failure or error" },
  { id: "security", label: "Suspicious login attempt" },
  { id: "billing", label: "Billing renewal or charge" },
];

export default function ChiefSettings() {
  const [tone, setTone] = useState("direct");
  const [briefingTime, setBriefingTime] = useState("08:00");
  const [autoApprove, setAutoApprove] = useState<Record<string, boolean>>({
    linkedin: false,
    email: false,
    expenses: false,
  });
  const [notifChecks, setNotifChecks] = useState<Record<string, boolean>>({
    revenue: true,
    social: false,
    inbox: true,
    agent: true,
    security: true,
    billing: false,
  });

  const toggleAuto = (id: string) =>
    setAutoApprove((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleNotif = (id: string) =>
    setNotifChecks((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Chief Settings</h2>

      {/* Tone */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Chief's Tone</h3>
        <div className="space-y-2">
          {tones.map((t) => (
            <label
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                tone === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  tone === t.value ? "border-primary" : "border-muted-foreground/40"
                }`}
              >
                {tone === t.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Briefing Time */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Morning Briefing Time</h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Chief will prepare your daily briefing at this time.
        </p>
        <input
          type="time"
          value={briefingTime}
          onChange={(e) => setBriefingTime(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Auto-approve */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Auto-Approve Rules</h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Let Chief take action automatically when confidence is high.
        </p>
        <div className="space-y-3">
          {autoApproveRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between">
              <span className="text-xs text-foreground pr-4">{rule.label}</span>
              <button
                onClick={() => toggleAuto(rule.id)}
                className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
                  autoApprove[rule.id] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    autoApprove[rule.id] ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Notification Triggers</h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Choose what makes Chief alert you.
        </p>
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <label key={n.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifChecks[n.id]}
                onChange={() => toggleNotif(n.id)}
                className="rounded border-border accent-primary w-3.5 h-3.5"
              />
              <span className="text-xs text-foreground">{n.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => toast.success("Chief settings saved")}
        className="text-xs font-semibold px-5 py-2 rounded-lg text-white transition-all duration-150 hover:brightness-110"
        style={{ background: "#5D9992" }}
      >
        Save Chief Settings
      </button>
    </div>
  );
}
