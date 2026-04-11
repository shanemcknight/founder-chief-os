import { useState } from "react";
import { Copy, Eye, EyeOff, X, Plus } from "lucide-react";
import { toast } from "sonner";

const webhookEvents = [
  "agent.run.completed",
  "agent.run.failed",
  "email.approved",
  "email.sent",
  "post.published",
  "contact.added",
];

export default function ApiWebhooksSettings() {
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKey] = useState("sk_mythos_live_" + Math.random().toString(36).slice(2, 14));
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>({});

  const toggleEvent = (e: string) =>
    setSelectedEvents((prev) => ({ ...prev, [e]: !prev[e] }));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">API & Webhooks</h2>

      {/* API Keys */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Your API Keys</h3>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110"
            style={{ background: "#5D9992" }}
          >
            Generate New API Key
          </button>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Key</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border last:border-0">
                <td className="p-3 text-xs text-foreground font-medium">Production Key</td>
                <td className="p-3 text-xs text-muted-foreground font-mono">sk_mythos_••••••••••••••4k9c</td>
                <td className="p-3 text-xs text-muted-foreground">Apr 11, 2026</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => copyToClipboard("sk_mythos_••••••••••••••4k9c")}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy size={10} /> Copy
                  </button>
                  <button className="text-[10px] text-destructive hover:underline">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Webhook Endpoints</h3>
          <button
            onClick={() => setShowAddWebhook(!showAddWebhook)}
            className="text-xs font-semibold text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Add Endpoint
          </button>
        </div>

        {showAddWebhook && (
          <div className="bg-background border border-border rounded-lg p-4 mb-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Endpoint URL</label>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourapp.com/webhooks/mythos"
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Events</label>
              <div className="grid grid-cols-2 gap-2">
                {webhookEvents.map((evt) => (
                  <label key={evt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedEvents[evt]}
                      onChange={() => toggleEvent(evt)}
                      className="rounded border-border accent-primary w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-foreground font-mono">{evt}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setShowAddWebhook(false); toast.success("Webhook endpoint added"); }}
              disabled={!webhookUrl.trim()}
              className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: "#5D9992" }}
            >
              Save Endpoint
            </button>
          </div>
        )}

        {!showAddWebhook && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No webhooks configured yet.</p>
            <p className="text-[11px] text-muted-foreground mt-1">Add an endpoint to receive real-time events.</p>
          </div>
        )}
      </div>

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowNewKeyModal(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">New API Key Generated</h3>
              <button onClick={() => setShowNewKeyModal(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="bg-background border border-border rounded-lg p-3 mb-3">
              <p className="text-xs font-mono text-foreground break-all">{newKey}</p>
            </div>
            <p className="text-[11px] text-warning mb-4">
              ⚠️ This key will only be shown once. Copy it now and store it securely.
            </p>
            <button
              onClick={() => { copyToClipboard(newKey); setShowNewKeyModal(false); }}
              className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110"
              style={{ background: "#5D9992" }}
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
