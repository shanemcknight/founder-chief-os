import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "approvals" | "chat" | "activity";

const seedPriorities = [
  { summary: "Wholesale inquiry — Austin bar owner. Response drafted.", primary: "Approve", secondary: "Edit" },
  { summary: "LinkedIn post ready — scheduled 2pm", primary: "Approve", secondary: "Edit" },
  { summary: "Invoice #1042 overdue — $840 outstanding", primary: "View", secondary: "Dismiss" },
];

const recentChats = [
  { title: "Wholesale Outreach — Whole Foods", preview: "Approve the Austin draft...", time: "2m ago" },
  { title: "Q2 Content Strategy", preview: "Here's the editorial calendar...", time: "Yesterday" },
  { title: "Invoice Follow-ups", preview: "I've drafted reminder emails...", time: "3 days ago" },
];

const quickExchange = [
  { role: "user" as const, text: "What's the most urgent thing today?" },
  { role: "agent" as const, text: "The Austin wholesale inquiry. Bar owner asked about BIB pricing. I've drafted a reply — one click and it goes out." },
];

type LogEntry = { time: string; agent: string; text: string; ms: string; type: "success" | "error" | "info" };

const initialLogs: LogEntry[] = [
  { time: "10:43", agent: "CHIEF", text: "Draft email sent", ms: "38ms", type: "success" },
  { time: "10:42", agent: "ORACLE", text: "Inbox scanned", ms: "124ms", type: "success" },
  { time: "10:41", agent: "FORGE", text: "Webhook triggered", ms: "22ms", type: "success" },
];

const rotatingLogs = [
  { agent: "ORACLE", text: "Inbox scanned", ms: "67ms", type: "success" as const },
  { agent: "FORGE", text: "Shopify sync complete", ms: "112ms", type: "success" as const },
  { agent: "CHIEF", text: "Briefing generated", ms: "445ms", type: "info" as const },
  { agent: "ORACLE", text: "Draft queued for review", ms: "88ms", type: "success" as const },
  { agent: "FORGE", text: "Amazon API pinged", ms: "201ms", type: "success" as const },
  { agent: "CHIEF", text: "Revenue snapshot captured", ms: "320ms", type: "info" as const },
];

export default function RelayPanel() {
  const [tab, setTab] = useState<Tab>("approvals");
  const [approved, setApproved] = useState<number[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [input, setInput] = useState("");
  const rotateIdx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
      const next = rotatingLogs[rotateIdx.current % rotatingLogs.length];
      rotateIdx.current++;
      setLogs((prev) => [{ ...next, time }, ...prev].slice(0, 25));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const logColor = (type: string) => {
    if (type === "success") return "text-emerald-400";
    if (type === "error") return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <aside className="w-full md:w-[300px] shrink-0 md:border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-sm font-bold text-foreground tracking-wide">CHIEF</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <Link to="/agents/deployed" className="ml-auto text-muted-foreground hover:text-foreground transition-colors duration-150">
          <Settings size={14} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-muted/40 rounded-lg p-0.5 flex gap-0.5 mx-3 mt-3 mb-3">
        {(["approvals", "chat", "activity"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 transition-colors duration-150",
              tab === t
                ? "bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-semibold"
                : "text-muted-foreground text-xs px-3 py-1.5 hover:text-foreground"
            )}
          >
            {t === "approvals" ? "Approvals" : t === "chat" ? "Chat" : "Activity"}
          </button>
        ))}
      </div>

      {/* Approvals tab */}
      {tab === "approvals" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today's Priorities</p>
          <div className="space-y-2">
            {seedPriorities.map((item, i) => {
              const isApproved = approved.includes(i);
              if (isApproved) {
                return (
                  <div key={i} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Approved</span>
                  </div>
                );
              }
              return (
                <div key={i} className="bg-background/50 border border-border rounded-lg p-2.5">
                  <p className="text-xs text-foreground leading-relaxed mb-2">{item.summary}</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setApproved((p) => [...p, i])}
                      className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-1 rounded hover:bg-primary/90 transition-colors duration-150"
                    >
                      {item.primary}
                    </button>
                    <button className="text-muted-foreground border border-border text-[10px] px-2 py-1 rounded hover:text-foreground transition-colors duration-150">
                      {item.secondary}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/agents/approvals" className="block text-[10px] text-primary hover:underline mt-3">
            View all approvals →
          </Link>
        </div>
      )}

      {/* Chat tab */}
      {tab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent</p>
            <div className="space-y-0.5">
              {recentChats.map((c, i) => (
                <Link
                  key={i}
                  to="/agents"
                  className="block w-full text-left px-2.5 py-2.5 rounded-md hover:bg-muted/30 transition-colors duration-150"
                >
                  <p className="text-xs font-semibold text-foreground truncate">{c.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.preview}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{c.time}</p>
                </Link>
              ))}
            </div>

            <Link
              to="/agents"
              className="block w-full text-center text-[11px] font-semibold border border-primary text-primary py-2 rounded-md hover:bg-primary/10 transition-colors duration-150 mt-2 mb-3"
            >
              + New Chat
            </Link>

            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Message</p>
            <div className="space-y-1.5">
              {quickExchange.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-[11px] p-2 rounded-lg",
                    m.role === "agent" ? "bg-primary/10 text-foreground" : "bg-muted/50 text-foreground"
                  )}
                >
                  {m.text}
                </div>
              ))}
            </div>
          </div>

          <div className="px-3 pb-2">
            <Link to="/agents" className="block text-[10px] text-primary hover:underline mb-2">
              Open full chat →
            </Link>
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your agent..."
                className="flex-1 text-xs bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs hover:bg-primary/90 transition-colors duration-150">
                →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Activity</p>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          </div>
          <div className="space-y-0.5">
            {logs.map((log, i) => (
              <div key={`${log.time}-${i}`} className={cn("font-mono text-[10px] leading-relaxed", logColor(log.type))}>
                <span className="text-muted-foreground">[{log.time}]</span>{" "}
                <span className="font-semibold">{log.agent}</span>{" "}
                <span>· {log.text}</span>{" "}
                <span className="text-muted-foreground">· {log.ms}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
