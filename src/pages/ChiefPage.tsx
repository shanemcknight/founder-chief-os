import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

const briefingItems = [
  { color: "bg-destructive", text: "Wholesale email from Austin — approve Chief's draft response", action: "Approve" },
  { color: "bg-destructive", text: "Invoice #1042 overdue $840 — send reminder", action: "Send Reminder" },
  { color: "bg-warning", text: "Amazon listing suppressed — fix bullet point", action: "Review" },
  { color: "bg-warning", text: "LinkedIn post not approved for today", action: "Preview & Approve" },
  { color: "bg-muted-foreground", text: "Agent Cipher has 3 consecutive errors", action: "View Logs" },
];

const chiefActivity = [
  { time: "9:02am", text: "Drafted response to Bar & Spirits Co inquiry" },
  { time: "8:45am", text: "Flagged Invoice #1042 as overdue" },
  { time: "8:30am", text: "Generated daily briefing" },
  { time: "8:15am", text: "Checked all agent statuses" },
];

const chatMessages = [
  { role: "user" as const, text: "What's the most important thing I need to do today?" },
  { role: "chief" as const, text: "Approve the Austin wholesale response. High-intent bar owner, asked about BIB pricing and minimums. I've drafted a reply in your voice — covers pricing, offers a free sample, gives lead time. One click and it goes out." },
  { role: "user" as const, text: "What's the status on the Amazon listing issue?" },
  { role: "chief" as const, text: "Ginger Beer BIB listing was suppressed yesterday — missing a required bullet point in the product description. I've drafted the fix. Want me to queue it for your approval or walk you through it?" },
  { role: "user" as const, text: "How's revenue looking this week?" },
  { role: "chief" as const, text: "Strong. $4,840 today across Shopify and Amazon. You're tracking ~$28K for the week which puts you ahead of last week by 14%. Klaviyo open rates are up too — 38.2%. The wholesale outreach sequence is driving inbound." },
];

type LogEntry = { time: string; agent: string; text: string; ms: string; type: "success" | "error" | "info" };

const initialLogs: LogEntry[] = [
  { time: "10:43", agent: "HERMES", text: "Slack message sent", ms: "38ms", type: "success" },
  { time: "10:43", agent: "ORACLE", text: "Email drafted", ms: "124ms", type: "success" },
  { time: "10:42", agent: "FORGE", text: "Webhook triggered", ms: "22ms", type: "success" },
  { time: "10:41", agent: "HERMES", text: "API call complete", ms: "41ms", type: "success" },
  { time: "10:40", agent: "CHIEF", text: "Briefing generated", ms: "890ms", type: "success" },
];

const rotatingLogs = [
  { agent: "ORACLE", text: "Inbox scanned", ms: "67ms", type: "success" as const },
  { agent: "FORGE", text: "Shopify sync complete", ms: "112ms", type: "success" as const },
  { agent: "CIPHER", text: "Connection timeout", ms: "3002ms", type: "error" as const },
  { agent: "HERMES", text: "Notification delivered", ms: "29ms", type: "success" as const },
  { agent: "CHIEF", text: "Pipeline updated", ms: "445ms", type: "info" as const },
  { agent: "ORACLE", text: "Draft queued for review", ms: "88ms", type: "success" as const },
  { agent: "FORGE", text: "Amazon API pinged", ms: "201ms", type: "success" as const },
  { agent: "CIPHER", text: "Retry attempt 2/3", ms: "1504ms", type: "error" as const },
  { agent: "HERMES", text: "Email sent to pipeline lead", ms: "53ms", type: "success" as const },
  { agent: "CHIEF", text: "Revenue snapshot captured", ms: "320ms", type: "info" as const },
];

export default function ChiefPage() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const logRef = useRef<HTMLDivElement>(null);
  const rotateIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
      const next = rotatingLogs[rotateIndex.current % rotatingLogs.length];
      rotateIndex.current++;
      setLogs((prev) => [{ ...next, time }, ...prev].slice(0, 30));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [logs]);

  const logColor = (type: string) => {
    if (type === "success") return "text-emerald-400";
    if (type === "error") return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* LEFT — Today's Briefing */}
      <div className="flex flex-col min-h-0 overflow-y-auto pr-1 w-[220px] shrink-0">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">April 11, 2026</h2>
          <p className="text-xs text-muted-foreground">Good morning, Shane.</p>
        </div>

        <div className="space-y-2 mb-6">
          {briefingItems.map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${item.color}`} />
                <p className="text-[11px] text-foreground leading-snug">{item.text}</p>
              </div>
              <button className="text-[10px] font-semibold bg-primary text-primary-foreground px-2.5 py-1 rounded hover:bg-primary/90 transition-colors">
                {item.action}
              </button>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">My HQ Agent's Activity Today</h3>
          <div className="space-y-1.5">
            {chiefActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground font-mono w-12 shrink-0">{a.time}</span>
                <span className="text-[10px] text-foreground">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER — Chat */}
      <div className="flex flex-col min-h-0 flex-1 border-x border-border px-4 min-w-0">
        <h2 className="text-sm font-bold text-foreground mb-3">Chat with My HQ Agent</h2>
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`rounded-lg p-3 ${msg.role === "chief" ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
              <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
                {msg.role === "chief" ? "MY HQ AGENT" : "SHANE"}
              </span>
              <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <input
            placeholder="Ask My HQ Agent anything..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* RIGHT — Live Activity Feed */}
      <div className="flex flex-col min-h-0 pl-1 w-[200px] shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-foreground">Live Activity</h2>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <div ref={logRef} className="flex-1 overflow-y-auto space-y-1">
          {logs.map((log, i) => (
            <div key={`${log.time}-${log.agent}-${i}`} className={`font-mono text-[10px] leading-relaxed ${logColor(log.type)}`}>
              <span className="text-muted-foreground">[{log.time}]</span>{" "}
              <span className="font-semibold">{log.agent}</span>{" "}
              <span>· {log.text}</span>{" "}
              <span className="text-muted-foreground">· {log.ms}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
