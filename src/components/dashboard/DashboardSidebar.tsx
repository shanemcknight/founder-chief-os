import { NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "COMMAND", path: "/dashboard", icon: LayoutDashboard },
  { label: "SOCIAL", path: "/social", icon: BookOpen },
  { label: "SALES", path: "/sales", icon: Target },
  { label: "INBOX", path: "/inbox", icon: Mail },
  { label: "PUBLISH", path: "/publish", icon: FileText },
  { label: "CHIEF", path: "/chief", icon: Brain },
  { label: "BUILD", path: "/build", icon: Wrench },
];

export default function DashboardSidebar() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
      <div className="px-4 py-4 flex items-center gap-2">
        <span className="text-sm tracking-tight text-foreground">
          <span className="font-bold">MYTHOS</span>{" "}
          <span className="font-normal text-xs text-primary">HQ</span>
        </span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>

      <nav className="flex-1 py-1 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "text-primary bg-primary/10 border-l-2 border-primary -ml-[2px] pl-[14px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="border-t border-border my-3" />

        <NavLink
          to="/agents/new"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
            location.pathname === "/agents/new"
              ? "text-primary bg-primary/10 border-l-2 border-primary -ml-[2px] pl-[14px]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <PlusCircle size={16} />
          Deploy New
        </NavLink>

        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
            location.pathname === "/settings"
              ? "text-primary bg-primary/10 border-l-2 border-primary -ml-[2px] pl-[14px]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
