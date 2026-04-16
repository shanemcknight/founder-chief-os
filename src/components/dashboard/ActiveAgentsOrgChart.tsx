import { useState, useCallback, useRef } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import RefreshIndicator from "@/components/dashboard/RefreshIndicator";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Users,
  Activity,
  Circle,
  Pause,
  Play,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────── */

type AgentStatus = "running" | "idle" | "complete" | "error";
type ProjectStatus = "running" | "queued" | "complete" | "blocked";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  taskType: string;
  progress: number;
  status: ProjectStatus;
  description?: string;
}

interface Agent {
  id: string;
  name: string;
  model: string;
  status: AgentStatus;
  sessionCount: number;
  costToday: string;
  projects: Project[];
  teamAccess: TeamMember[];
}

/* ── Mock Data ─────────────────────────────────── */

const MOCK_AGENTS: Agent[] = [
  {
    id: "chief",
    name: "Chief",
    model: "Sonnet",
    status: "running",
    sessionCount: 12,
    costToday: "$2.40",
    projects: [
      { id: "p1", name: "Daily Brief Generation", taskType: "Content", progress: 65, status: "running", description: "Auto-generate morning briefing from all connected data sources." },
      { id: "p2", name: "Email Triage", taskType: "Inbox", progress: 100, status: "complete", description: "Categorize and prioritize incoming emails." },
      { id: "p3", name: "Weekly KPI Report", taskType: "Analytics", progress: 20, status: "queued", description: "Compile weekly performance report across channels." },
    ],
    teamAccess: [
      { id: "t1", name: "Shane", role: "Full Control" },
      { id: "t2", name: "Jordan", role: "View Only" },
    ],
  },
  {
    id: "claude-code",
    name: "Claude Code",
    model: "Opus",
    status: "running",
    sessionCount: 4,
    costToday: "$8.10",
    projects: [
      { id: "p4", name: "User OS Dashboard", taskType: "Dev", progress: 40, status: "running", description: "Build primary dashboard components and integrations." },
      { id: "p5", name: "API Integration Layer", taskType: "Dev", progress: 85, status: "running", description: "Connect Shopify, ShipStation, and Klaviyo APIs." },
    ],
    teamAccess: [
      { id: "t1", name: "Shane", role: "Full Control" },
      { id: "t3", name: "Alex", role: "Deploy Access" },
    ],
  },
  {
    id: "sub-1",
    name: "Subagent-1",
    model: "Haiku",
    status: "idle",
    sessionCount: 0,
    costToday: "$0.00",
    projects: [
      { id: "p6", name: "Social Post Scheduler", taskType: "Social", progress: 90, status: "complete", description: "Schedule and publish social media posts across platforms." },
    ],
    teamAccess: [
      { id: "t1", name: "Shane", role: "Full Control" },
    ],
  },
  {
    id: "sub-2",
    name: "Cipher",
    model: "Sonnet",
    status: "error",
    sessionCount: 1,
    costToday: "$0.30",
    projects: [
      { id: "p7", name: "Inventory Sync", taskType: "Ops", progress: 15, status: "blocked", description: "Sync inventory counts across Shopify and Amazon." },
    ],
    teamAccess: [
      { id: "t1", name: "Shane", role: "Full Control" },
      { id: "t4", name: "Maria", role: "View Only" },
    ],
  },
  {
    id: "sub-3",
    name: "Scout",
    model: "Haiku",
    status: "complete",
    sessionCount: 8,
    costToday: "$0.60",
    projects: [
      { id: "p8", name: "Competitor Price Watch", taskType: "Research", progress: 100, status: "complete", description: "Monitor competitor pricing across Amazon and DTC." },
      { id: "p9", name: "Market Trend Report", taskType: "Research", progress: 100, status: "complete", description: "Weekly market trend analysis." },
    ],
    teamAccess: [
      { id: "t1", name: "Shane", role: "Full Control" },
    ],
  },
];

/* ── Status helpers ────────────────────────────── */

const agentStatusConfig: Record<AgentStatus, { label: string; dotClass: string; cardClass: string }> = {
  running: { label: "Running", dotClass: "bg-[hsl(var(--success))]", cardClass: "border-[hsl(var(--success))]/30" },
  idle: { label: "Idle", dotClass: "bg-muted-foreground", cardClass: "border-border opacity-60" },
  complete: { label: "Complete", dotClass: "bg-[hsl(var(--success))]", cardClass: "border-[hsl(var(--success))]/20" },
  error: { label: "Error", dotClass: "bg-[hsl(var(--destructive))]", cardClass: "border-[hsl(var(--destructive))]/30" },
};

const projectStatusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  running: { label: "Running", color: "text-[hsl(var(--success))]" },
  queued: { label: "Queued", color: "text-[hsl(var(--warning))]" },
  complete: { label: "Complete", color: "text-[hsl(var(--success))]" },
  blocked: { label: "Blocked", color: "text-[hsl(var(--destructive))]" },
};

/* ── Sub-components ────────────────────────────── */

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cfg = projectStatusConfig[project.status];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-background/50 border border-border rounded-lg p-3 hover:bg-accent/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-foreground truncate">{project.name}</span>
        <span className={cn("text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{project.taskType}</Badge>
        <span className="text-[10px] text-muted-foreground">{project.progress}%</span>
      </div>
      <Progress value={project.progress} className="h-1.5" />
    </button>
  );
}

function ProjectDetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const cfg = projectStatusConfig[project.status];
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-card border-l border-border z-50 shadow-2xl animate-in slide-in-from-right-full duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">{project.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>
      <ScrollArea className="h-[calc(100%-57px)]">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{project.taskType}</Badge>
            <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Progress</p>
            <Progress value={project.progress} className="h-2 mb-1" />
            <p className="text-xs text-foreground font-medium">{project.progress}%</p>
          </div>
          {project.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{project.description}</p>
            </div>
          )}
          {project.status === "running" && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Console Output</p>
              <div className="bg-background rounded-lg p-3 font-mono text-[11px] text-muted-foreground space-y-1 max-h-40 overflow-auto">
                <p>[12:04:02] Processing batch 14/22…</p>
                <p>[12:04:05] API response: 200 OK</p>
                <p>[12:04:08] Writing results to store…</p>
                <p className="text-[hsl(var(--success))]">[12:04:09] Batch 14 complete ✓</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {project.status === "running" && (
              <Button variant="outline" size="sm" className="gap-1.5"><Pause size={12} /> Pause</Button>
            )}
            {(project.status === "queued" || project.status === "blocked") && (
              <Button variant="outline" size="sm" className="gap-1.5"><Play size={12} /> Start</Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function AgentNode({ agent, showTeam, onProjectClick }: { agent: Agent; showTeam: boolean; onProjectClick: (p: Project) => void }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = agentStatusConfig[agent.status];
  const visibleProjects = expanded ? agent.projects.slice(0, 3) : [];
  const hasMore = agent.projects.length > 3;

  return (
    <div className="flex flex-col items-center min-w-[220px]">
      {/* Connection line from top */}
      <div className="w-px h-6 bg-border" />

      {/* Agent card */}
      <div className={cn("bg-card border-2 rounded-xl p-4 w-[220px] transition-all", cfg.cardClass)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", cfg.dotClass)} />
            <span className="text-sm font-bold text-primary">{agent.name}</span>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{agent.model}</Badge>
          <span className={cn("text-[10px] font-medium", agentStatusConfig[agent.status].label === "Error" ? "text-destructive" : "text-muted-foreground")}>{cfg.label}</span>
        </div>
        {expanded && (
          <div className="mt-2 pt-2 border-t border-border space-y-1 text-[11px] text-muted-foreground">
            <div className="flex justify-between"><span>Sessions</span><span className="text-foreground">{agent.sessionCount}</span></div>
            <div className="flex justify-between"><span>Cost Today</span><span className="text-foreground">{agent.costToday}</span></div>
            <div className="flex justify-between"><span>Projects</span><span className="text-foreground">{agent.projects.length}</span></div>
          </div>
        )}
      </div>

      {/* Projects */}
      {expanded && visibleProjects.length > 0 && (
        <div className="flex flex-col items-center mt-0">
          <div className="w-px h-4 bg-border" />
          <div className="space-y-2 w-[220px]">
            {visibleProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => onProjectClick(p)} />
            ))}
            {hasMore && (
              <button className="text-[11px] text-primary hover:underline w-full text-center">
                View All ({agent.projects.length})
              </button>
            )}
          </div>
        </div>
      )}

      {expanded && agent.projects.length === 0 && (
        <div className="mt-2">
          <div className="w-px h-4 bg-border mx-auto" />
          <p className="text-[11px] text-muted-foreground italic text-center">No active projects</p>
        </div>
      )}

      {/* Team access */}
      {showTeam && expanded && (
        <div className="mt-3 w-[220px]">
          <div className="flex items-center gap-1 mb-1.5">
            <Users size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">Team Access</span>
          </div>
          <div className="space-y-1">
            {agent.teamAccess.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-background/50 border border-dashed border-border rounded px-2 py-1">
                <span className="text-[11px] text-foreground">{m.name}</span>
                <span className="text-[10px] text-muted-foreground">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────── */

export default function ActiveAgentsOrgChart() {
  const [zoom, setZoom] = useState(1);
  const [showTeam, setShowTeam] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const agentsRefresh = useAutoRefresh({ intervalMs: 10 * 1000 });

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.15, 2)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.15, 0.4)), []);
  const handleFit = useCallback(() => setZoom(1), []);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Active Agents</h2>
          <Badge variant="secondary" className="text-[10px]">{MOCK_AGENTS.length} agents</Badge>
          <RefreshIndicator agoLabel={agentsRefresh.agoLabel} isRefreshing={agentsRefresh.isRefreshing} onRefresh={agentsRefresh.refresh} intervalLabel="15 sec" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Team Access</span>
            <Switch checked={showTeam} onCheckedChange={setShowTeam} className="scale-75" />
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut}><ZoomOut size={12} /></Button>
            <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn}><ZoomIn size={12} /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFit}><Maximize2 size={12} /></Button>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="overflow-auto bg-card border border-border rounded-xl p-6 min-h-[400px]">
        <div
          className="transition-transform duration-200 origin-top-left"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
          {/* CEO Node */}
          <div className="flex flex-col items-center">
            <div className="bg-[#B54165]/15 border-2 border-[#B54165]/40 rounded-xl px-6 py-3 text-center">
              <div className="flex items-center gap-2 justify-center">
                <Circle size={8} fill="#B54165" className="text-[#B54165]" />
                <span className="text-sm font-bold text-foreground">Shane McKnight</span>
              </div>
              <span className="text-[11px] text-muted-foreground">CEO · User OS</span>
            </div>

            {/* Vertical line down */}
            <div className="w-px h-8 bg-border" />

            {/* Horizontal connector */}
            <div className="relative w-full flex justify-center">
              <div className="absolute top-0 h-px bg-border" style={{ width: `${Math.min(MOCK_AGENTS.length * 260, 1300)}px`, left: '50%', transform: 'translateX(-50%)' }} />
            </div>

            {/* Agent nodes */}
            <div className="flex gap-6 justify-center flex-wrap pt-0">
              {MOCK_AGENTS.map((agent) => (
                <AgentNode
                  key={agent.id}
                  agent={agent}
                  showTeam={showTeam}
                  onProjectClick={setSelectedProject}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project detail panel */}
      {selectedProject && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedProject(null)} />
          <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
        </>
      )}
    </div>
  );
}
