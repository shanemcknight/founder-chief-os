import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Mail,
  FileText,
  Brain,
  Wrench,
  Settings,
  PlusCircle,
  LogOut,
  Calendar,
  ShieldCheck,
  LayoutGrid,
  Library,
  BarChart3,
  Lightbulb,
  ChevronRight,
  Inbox,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  MessageCircle,
  Cpu,
  Users,
  Building2,
  ListChecks,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import UpcomingTasksWidget from "@/components/dashboard/UpcomingTasksWidget";

const socialSubItems = [
  { label: "Calendar", path: "/social/calendar", icon: Calendar },
  { label: "Approvals", path: "/social/approvals", icon: ShieldCheck },
  { label: "Pipeline", path: "/social/pipeline", icon: LayoutGrid },
  { label: "Library", path: "/social/library", icon: Library },
  { label: "Performance", path: "/social/performance", icon: BarChart3 },
  { label: "Strategy", path: "/social/strategy", icon: Lightbulb },
];

const inboxSubItems = [
  { label: "Mail", path: "/inbox/mail", icon: Mail, countKey: "mail" as const },
  { label: "Approvals", path: "/inbox/approvals", icon: CheckCircle2, countKey: "approvals" as const },
  { label: "Queue", path: "/inbox/queue", icon: Clock, countKey: "queue" as const, amber: true },
  { label: "Alerts", path: "/inbox/alerts", icon: AlertTriangle, countKey: "alerts" as const },
  { label: "Activity", path: "/inbox/activity", icon: Activity, countKey: null },
];

// Mock counts
const AGENTS_PENDING_APPROVALS = 3;
const AGENTS_CHAT_UNREAD = 2;

const agentsSubItems = [
  { label: "Chat", path: "/agents", icon: MessageCircle, badge: AGENTS_CHAT_UNREAD, badgeStyle: "primary" as const, exact: true },
  { label: "Deep Research", path: "/agents/research", icon: Search, badge: 0, badgeStyle: "primary" as const },
  { label: "Approvals", path: "/agents/approvals", icon: ShieldCheck, badge: AGENTS_PENDING_APPROVALS, badgeStyle: "destructive" as const },
  { label: "Activity", path: "/agents/activity", icon: Activity, badge: 0 },
  { label: "Deployed", path: "/agents/deployed", icon: Cpu, badge: 0 },
];

const salesSubItems = [
  { label: "Dashboard", path: "/sales", icon: LayoutDashboard, exact: true },
  { label: "Pipeline", path: "/sales/pipeline", icon: LayoutGrid },
  { label: "Contacts", path: "/sales/contacts", icon: Users },
  { label: "Companies", path: "/sales/companies", icon: Building2 },
  { label: "Tasks", path: "/sales/tasks", icon: ListChecks },
  { label: "Prospects", path: "/sales/prospects", icon: Search },
];

const reportsSubItems = [
  { label: "Analyze", path: "/reports/analyze", icon: BarChart3 },
  { label: "Library", path: "/reports/library", icon: Library },
  { label: "Build", path: "/reports/build", icon: Wrench },
  { label: "Vault", path: "/reports/vault", icon: ShieldCheck },
];

const mainNavAfterInbox = [
  { label: "PUBLISH", path: "/publish", icon: FileText },
  { label: "BUILD", path: "/build", icon: Wrench },
  { label: "CALENDAR", path: "/calendar", icon: Calendar },
];

const linkClass = (isActive: boolean) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
    isActive
      ? "text-primary bg-primary/10 border-l-2 border-primary -ml-[2px] pl-[14px]"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
  }`;

export default function DashboardSidebar() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const inboxCounts = useInboxCounts();

  const isSocialActive = location.pathname.startsWith("/social");
  const isInboxActive = location.pathname.startsWith("/inbox");
  const isAgentsActive = location.pathname.startsWith("/agents");
  const isSalesActive = location.pathname.startsWith("/sales");
  const isReportsActive = location.pathname.startsWith("/reports");
  const [socialOpen, setSocialOpen] = useState(isSocialActive);
  const [inboxOpen, setInboxOpen] = useState(isInboxActive);
  const [agentsOpen, setAgentsOpen] = useState(isAgentsActive);
  const [salesOpen, setSalesOpen] = useState(isSalesActive);
  const [reportsOpen, setReportsOpen] = useState(isReportsActive);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showSocialSub = socialOpen;
  const showInboxSub = inboxOpen;
  const showAgentsSub = agentsOpen;

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
      <div className="px-4 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-[10px] text-muted-foreground">Online</span>
      </div>

      <nav className="flex-1 py-1 px-2 space-y-0.5">
        {/* COMMAND */}
        <NavLink to="/dashboard" className={linkClass(location.pathname === "/dashboard")}>
          <LayoutDashboard size={16} />
          COMMAND
        </NavLink>

        {/* INBOX — expandable */}
        <button
          onClick={() => setInboxOpen(!inboxOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
            isInboxActive
              ? "text-[#B54165] bg-[#B54165]/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Inbox size={16} />
          <span className="flex-1 text-left">INBOX</span>
          {inboxCounts.total > 0 && (
            <span className="text-[9px] font-bold bg-destructive text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {inboxCounts.total}
            </span>
          )}
          <ChevronRight size={14} className={cn("opacity-50 transition-transform duration-200", inboxOpen && "rotate-90")} />
        </button>

        {showInboxSub && (
          <div className="ml-3 pl-3 border-l border-border/40 space-y-0.5 py-1">
            {inboxSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const count = item.countKey ? inboxCounts[item.countKey] : 0;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-150",
                    isActive
                      ? "text-[#B54165] bg-[#B54165]/10 font-medium border-l-2 border-[#B54165] -ml-[2px] pl-[10px]"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon size={14} />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center",
                        item.amber
                          ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}

        {/* SOCIAL — expandable */}
        <button
          onClick={() => setSocialOpen(!socialOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
            isSocialActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <BookOpen size={16} />
          <span className="flex-1 text-left">SOCIAL</span>
          <ChevronRight size={14} className={cn("opacity-50 transition-transform duration-200", socialOpen && "rotate-90")} />
        </button>

        {showSocialSub && (
          <div className="ml-3 pl-3 border-l border-border/40 space-y-0.5 py-1">
            {socialSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-150",
                    isActive
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        )}

        {/* AGENTS — expandable */}
        <button
          onClick={() => setAgentsOpen(!agentsOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
            isAgentsActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Brain size={16} />
          <span className="flex-1 text-left">AGENTS</span>
          <ChevronRight size={14} className={cn("opacity-50 transition-transform duration-200", agentsOpen && "rotate-90")} />
        </button>

        {showAgentsSub && (
          <div className="ml-3 pl-3 border-l border-border/40 space-y-0.5 py-1">
            {agentsSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-150",
                    isActive
                      ? "text-primary bg-primary/10 font-medium border-l-2 border-primary -ml-[2px] pl-[10px]"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon size={14} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center",
                        item.badgeStyle === "destructive"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}

        {/* SALES — expandable */}
        <button
          onClick={() => setSalesOpen(!salesOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
            isSalesActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Target size={16} />
          <span className="flex-1 text-left">SALES</span>
          <ChevronRight size={14} className={cn("opacity-50 transition-transform duration-200", salesOpen && "rotate-90")} />
        </button>

        {salesOpen && (
          <div className="ml-3 pl-3 border-l border-border/40 space-y-0.5 py-1">
            {salesSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-150",
                    isActive
                      ? "text-primary bg-primary/10 font-medium border-l-2 border-primary -ml-[2px] pl-[10px]"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon size={14} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* PUBLISH + BUILD */}
        {mainNavAfterInbox.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} className={linkClass(isActive)}>
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}

        {/* REPORTS — navigates AND expands */}
        <NavLink
          to="/reports"
          end
          onClick={() => setReportsOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
            isReportsActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <BarChart3 size={16} />
          <span className="flex-1 text-left">REPORTS</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setReportsOpen(!reportsOpen);
            }}
            className="p-0.5 -m-0.5"
            aria-label="Toggle reports submenu"
          >
            <ChevronRight size={14} className={cn("opacity-50 transition-transform duration-200", reportsOpen && "rotate-90")} />
          </button>
        </NavLink>

        {reportsOpen && (
          <div className="ml-3 pl-3 border-l border-border/40 space-y-0.5 py-1">
            {reportsSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-150",
                    isActive
                      ? "text-primary bg-primary/10 font-medium border-l-2 border-primary -ml-[2px] pl-[10px]"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon size={14} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* CALENDAR */}
        {mainNavAfterInbox.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} className={linkClass(isActive)}>
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="border-t border-border my-3" />

        {/* Upcoming Tasks Widget */}
        <div className="px-1 mb-3">
          <UpcomingTasksWidget />
        </div>

        <div className="border-t border-border my-3" />

        <NavLink to="/agents/new" className={linkClass(location.pathname === "/agents/new")}>
          <PlusCircle size={16} />
          Deploy New
        </NavLink>

        <NavLink to="/settings" className={linkClass(location.pathname === "/settings")}>
          <Settings size={16} />
          Settings
        </NavLink>
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center text-white"
            style={{
              background: "linear-gradient(145deg, rgba(93,153,146,0.9), rgba(61,110,104,0.95))",
              border: "1px solid rgba(93,153,146,0.6)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 8px rgba(93,153,146,0.3)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" title="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
