import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "approvals" | "chat" | "activity";

type PriorityKind = "HIGH" | "MED" | "FYI";
type SourceKind = "approval" | "email";

type Priority = {
  id: string;
  summary: string;
  priority: PriorityKind;
  actionType: string;
  createdAt: string;
  source: SourceKind;
};

const priorityRank: Record<PriorityKind, number> = { HIGH: 0, MED: 1, FYI: 2 };

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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function actionTypeLabel(t: string): string {
  const map: Record<string, string> = {
    send_email: "Email",
    post_social: "Social",
    update_crm: "CRM",
    invoice: "Invoice",
    amazon: "Amazon",
  };
  return map[t] || t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function priorityDotClass(p: Priority["priority"]): string {
  if (p === "HIGH") return "bg-destructive";
  if (p === "MED") return "bg-warning";
  return "bg-muted-foreground";
}

export default function RelayPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("approvals");
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [input, setInput] = useState("");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loadingPriorities, setLoadingPriorities] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const rotateIdx = useRef(0);

  // Rotating activity logs
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

  // Load real pending approvals + urgent/lead emails (merged)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadData = async () => {
      const { data: actions } = await supabase
        .from("proposed_actions")
        .select("id, action_type, draft_content, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const { data: emails } = await supabase
        .from("emails")
        .select("id, subject, from_name, chief_summary, category, received_at")
        .eq("user_id", user.id)
        .eq("read", false)
        .in("category", ["urgent", "lead"])
        .order("received_at", { ascending: false });

      if (cancelled) return;

      const approvalItems: Priority[] = (actions || []).map((a: any) => {
        const content = a.draft_content || {};
        const summary = content.summary || content.draft?.slice(0, 80) || `${actionTypeLabel(a.action_type)} action`;
        return {
          id: `pa-${a.id}`,
          summary: String(summary).slice(0, 120),
          priority: "HIGH",
          actionType: actionTypeLabel(a.action_type),
          createdAt: a.created_at,
          source: "approval",
        };
      });

      const emailItems: Priority[] = (emails || []).map((e: any) => ({
        id: `em-${e.id}`,
        summary: e.chief_summary || e.subject || "(no subject)",
        priority: e.category === "urgent" ? "HIGH" : "MED",
        actionType: e.category === "urgent" ? "Urgent" : "Lead",
        createdAt: e.received_at || new Date().toISOString(),
        source: "email",
      }));

      const merged = [...approvalItems, ...emailItems].sort(
        (a, b) => priorityRank[a.priority] - priorityRank[b.priority]
      );

      setPriorities(merged);
      setLoadingPriorities(false);
    };

    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const logColor = (type: string) => {
    if (type === "success") return "text-emerald-400";
    if (type === "error") return "text-destructive";
    return "text-muted-foreground";
  };

  const totalCount = priorities.length;
  const visiblePriorities = showAll || totalCount <= 8 ? priorities : priorities.slice(0, 8);

  const handleAction = (item: Priority) => {
    if (item.source === "approval") navigate("/agents/approvals");
    else navigate("/inbox/mail");
  };

  return (
    <aside className="w-full md:w-[300px] shrink-0 md:border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-sm font-bold text-foreground tracking-wide">AGENTIC HQ</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        {totalCount > 0 && (
          <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {totalCount}
          </span>
        )}
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
            {t === "approvals" ? "Actions" : t === "chat" ? "Chat" : "Live Feed"}
          </button>
        ))}
      </div>

      {/* Approvals tab */}
      {tab === "approvals" && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Needs Attention</p>

          {loadingPriorities ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-muted/30 animate-pulse h-16 rounded-lg" />
              ))}
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle2 size={16} className="text-success" />
              <p className="text-[11px] text-muted-foreground text-center mt-2">Nothing needs your attention</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {visiblePriorities.map((item) => (
                  <div key={item.id} className="bg-background/50 border border-border rounded-lg p-2.5 relative">
                    <span className="absolute top-2 right-2 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {item.actionType}
                    </span>
                    <div className="flex gap-2 pr-14">
                      <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1", priorityDotClass(item.priority))} />
                      <p className="text-xs text-foreground leading-relaxed">{item.summary}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-4">{relativeTime(item.createdAt)}</p>
                    <div className="flex gap-1.5 mt-2 ml-4">
                      <button
                        onClick={() => handleAction(item)}
                        className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-1 rounded hover:bg-primary/90 transition-colors duration-150"
                      >
                        {item.source === "approval" ? "Review" : "Reply"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalCount > 8 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-[10px] text-primary cursor-pointer text-center mt-2 w-full hover:underline"
                >
                  {showAll ? "Show less ↑" : `Show all ${totalCount} items ↓`}
                </button>
              )}
            </>
          )}

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
