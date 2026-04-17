import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "Live" | "Paused" | "Error";

const agents: {
  name: string;
  status: Status;
  model: string;
  prompt: string;
  integrations: { name: string; active: boolean }[];
  stats: string;
}[] = [
  {
    name: "My HQ Agent",
    status: "Live",
    model: "Claude 3.5 Sonnet",
    prompt:
      "You are My HQ Agent, the user's executive assistant. Triage email, draft responses in brand voice, surface high-priority decisions, and never act without approval on outbound messages.",
    integrations: [
      { name: "Gmail", active: true },
      { name: "Shopify", active: true },
      { name: "Slack", active: true },
    ],
    stats: "247 messages · 18 approvals · 99.2% uptime",
  },
  {
    name: "ORACLE",
    status: "Live",
    model: "GPT-4o",
    prompt:
      "You are ORACLE, the inbox specialist. Categorize incoming email, identify high-intent leads, and draft polished replies. Never send without user approval.",
    integrations: [
      { name: "Gmail", active: true },
      { name: "HubSpot", active: false },
    ],
    stats: "1,402 messages · 64 approvals · 98.8% uptime",
  },
  {
    name: "FORGE",
    status: "Paused",
    model: "Gemini Pro",
    prompt:
      "You are FORGE, the operations agent. Sync inventory, monitor Shopify and Amazon listings, and flag listing issues before they hurt revenue.",
    integrations: [
      { name: "Shopify", active: true },
      { name: "Amazon", active: true },
    ],
    stats: "89 messages · 12 approvals · 94.1% uptime",
  },
];

const statusClass = (s: Status) =>
  s === "Live"
    ? "bg-emerald-500/15 text-emerald-400"
    : s === "Paused"
    ? "bg-warning/15 text-warning"
    : "bg-destructive/15 text-destructive";

export default function AgentsDeployedPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Deployed Agents</h1>
        <Link
          to="/agents/new"
          className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-md hover:bg-primary/90 transition-colors duration-150"
        >
          Deploy New →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((a) => (
          <div key={a.name} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-2">
              <h2 className="text-base font-bold text-foreground">{a.name}</h2>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider", statusClass(a.status))}>
                {a.status}
              </span>
              <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors duration-150">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="mt-2">
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded">{a.model}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-2">{a.prompt}</p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {a.integrations.map((s) => (
                <span
                  key={s.name}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md",
                    s.active
                      ? "bg-primary/10 border border-primary/30 text-primary font-medium"
                      : "bg-muted/30 border border-border text-muted-foreground"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.active ? "bg-success" : "bg-muted-foreground/40")} />
                  {s.name}
                </span>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground mt-3">{a.stats}</p>

            <div className="flex gap-2 mt-4">
              <Link
                to="/agents"
                className="bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors duration-150"
              >
                Open Chat
              </Link>
              <button className="border border-border text-foreground text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-muted/30 transition-colors duration-150">
                Edit
              </button>
              <button className="text-muted-foreground hover:text-foreground text-[11px] font-medium px-3 py-1.5 transition-colors duration-150">
                {a.status === "Paused" ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
