import { useState, useRef, useEffect } from "react";
import { Search, Bell, Sun, Moon, Menu, X, Settings, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toggleTheme } from "@/lib/theme";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "./DashboardSidebar";

export default function DashboardTopbar() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={() => setShowDrawer(true)} className="text-muted-foreground hover:text-foreground mr-1">
              <Menu size={18} />
            </button>
          )}
          <span className="text-sm tracking-tight text-foreground">
            <span className="font-bold">MYTHOS</span>{" "}
            <span className="font-normal text-xs text-primary">HQ</span>
          </span>
        </div>

        {!isMobile && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search agents, logs, contacts..."
                className="w-full text-xs bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => { toggleTheme(); setDark(!dark); }}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            className="relative w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label="Notifications"
          >
            <Bell size={14} />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
            SM
          </div>
          {!isMobile && (
            <button onClick={() => navigate("/agents/new")} className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md deploy-glow hover:bg-primary/90 transition-colors duration-150">
              Deploy Agent +
            </button>
          )}
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      {isMobile && showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-[260px] bg-card border-r border-border h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-bold text-foreground">Menu</span>
              <button onClick={() => setShowDrawer(false)} className="text-muted-foreground"><X size={18} /></button>
            </div>
            <div onClick={() => setShowDrawer(false)}>
              <DashboardSidebar />
            </div>
          </div>
          <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={() => setShowDrawer(false)} />
        </div>
      )}
    </>
  );
}
