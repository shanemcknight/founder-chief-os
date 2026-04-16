import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type LogEntry = {
  time: string;
  agent: "CHIEF" | "ORACLE" | "FORGE" | "CIPHER";
  text: string;
  ms: string;
  type: "success" | "error" | "info";
};

const initialLogs: LogEntry[] = [
  { time: "10:43", agent: "CHIEF", text: "Briefing generated", ms: "890ms", type: "success" },
  { time: "10:42", agent: "ORACLE", text: "Inbox scanned", ms: "67ms", type: "success" },
  { time: "10:41", agent: "FORGE", text: "Shopify sync complete", ms: "112ms", type: "success" },
  { time: "10:40", agent: "CIPHER", text: "Connection timeout", ms: "3002ms", type: "error" },
  { time: "10:39", agent: "ORACLE", text: "Draft queued for review", ms: "88ms", type: "success" },
  { time: "10:38", agent: "FORGE", text: "Amazon API pinged", ms: "201ms", type: "success" },
];

const rotating: Omit<LogEntry, "time">[] = [
  { agent: "ORACLE", text: "Email drafted", ms: "124ms", type: "success" },
  { agent: "FORGE", text: "Webhook triggered", ms: "22ms", type: "success" },
  { agent: "CHIEF", text: "Pipeline updated", ms: "445ms", type: "info" },
  { agent: "CIPHER", text: "Retry attempt 2/3", ms: "1504ms", type: "error" },
  { agent: "ORACLE", text: "Inbox scanned", ms: "67ms", type: "success" },
  { agent: "CHIEF", text: "Revenue snapshot captured", ms: "320ms", type: "info" },
  { agent: "FORGE", text: "Shopify sync complete", ms: "112ms", type: "success" },
  { agent: "CIPHER", text: "API rate limited", ms: "501ms", type: "error" },
];

export default function AgentsActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [agentFilter, setAgentFilter] = useState<"All" | LogEntry["agent"]>("All");
  const idx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const next = rotating[idx.current % rotating.length];
      idx.current++;
      setLogs((prev) => [{ ...next, time }, ...prev].slice(0, 50));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const filtered = agentFilter === "All" ? logs : logs.filter((l) => l.agent === agentFilter);

  const dotColor = (t: LogEntry["type"]) =>
    t === "success" ? "bg-emerald-400" : t === "error" ? "bg-destructive" : "bg-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-foreground">Live Activity</h1>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value as any)}
          className="ml-auto bg-background border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Agents</option>
          <option value="CHIEF">CHIEF</option>
          <option value="ORACLE">ORACLE</option>
          <option value="FORGE">FORGE</option>
          <option value="CIPHER">CIPHER</option>
        </select>
      </div>

      <div className="space-y-1">
        {filtered.map((log, i) => (
          <div
            key={`${log.time}-${i}`}
            className="font-mono text-[11px] leading-relaxed flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted/20 transition-colors duration-150"
          >
            <span className="text-muted-foreground w-12 shrink-0">{log.time}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
              {log.agent}
            </span>
            <span className="text-foreground flex-1">{log.text}</span>
            <span className="text-muted-foreground">{log.ms}</span>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor(log.type))} />
          </div>
        ))}
      </div>
    </div>
  );
}
