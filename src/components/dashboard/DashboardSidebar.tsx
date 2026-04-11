import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "COMMAND", path: "/dashboard", icon: "⌘" },
  { label: "STORY", path: "/story", icon: "✦" },
  { label: "SALES", path: "/sales", icon: "◎" },
  { label: "INBOX", path: "/inbox", icon: "✉" },
  { label: "PUBLISH", path: "/publish", icon: "▤" },
  { label: "CHIEF", path: "/chief", icon: "◈" },
  { label: "BUILD", path: "/build", icon: "⚙" },
];

export default function DashboardSidebar() {
  const location = useLocation();

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.path === "/dashboard"
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
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}

        <div className="border-t border-border my-3" />

        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
            location.pathname === "/settings"
              ? "text-primary bg-primary/10 border-l-2 border-primary -ml-[2px] pl-[14px]"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span className="text-base">⚙</span>
          Settings
        </NavLink>
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">SM</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Shane M.</p>
            <span className="text-[10px] font-semibold bg-accent/20 text-accent px-1.5 py-0.5 rounded-sm">TITAN</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
