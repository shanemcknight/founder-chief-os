import { useState } from "react";
import { toast } from "sonner";

const emailNotifs = [
  { id: "team_join", label: "New team member joined" },
  { id: "agent_error", label: "Agent error detected" },
  { id: "invoice", label: "Invoice payment received" },
  { id: "weekly_summary", label: "Weekly usage summary" },
  { id: "product_updates", label: "Product updates & changelog" },
];

const inAppNotifs = [
  { id: "run_failures", label: "Agent run failures" },
  { id: "approval_queue", label: "Approval queue items" },
  { id: "chief_briefing", label: "Chief briefing" },
  { id: "new_leads", label: "New leads in CRM" },
];

export default function NotificationsSettings() {
  const [email, setEmail] = useState<Record<string, boolean>>(
    Object.fromEntries(emailNotifs.map((n) => [n.id, true]))
  );
  const [inApp, setInApp] = useState<Record<string, boolean>>(
    Object.fromEntries(inAppNotifs.map((n) => [n.id, true]))
  );

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${on ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Notifications</h2>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Email Notifications</h3>
        <div className="space-y-3">
          {emailNotifs.map((n) => (
            <div key={n.id} className="flex items-center justify-between">
              <span className="text-xs text-foreground">{n.label}</span>
              <Toggle on={email[n.id]} onToggle={() => setEmail((p) => ({ ...p, [n.id]: !p[n.id] }))} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">In-App Notifications</h3>
        <div className="space-y-3">
          {inAppNotifs.map((n) => (
            <div key={n.id} className="flex items-center justify-between">
              <span className="text-xs text-foreground">{n.label}</span>
              <Toggle on={inApp[n.id]} onToggle={() => setInApp((p) => ({ ...p, [n.id]: !p[n.id] }))} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => toast.success("Notification preferences saved")}
        className="text-xs font-semibold px-5 py-2 rounded-lg text-white transition-all hover:brightness-110"
        style={{ background: "#5D9992" }}
      >
        Save Preferences
      </button>
    </div>
  );
}
