import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Search, Bell, Sun, Moon, Menu, X,
  User, Users, CreditCard, Plug,
  Rocket, UserPlus, Key,
  BookOpen, Sparkles, MessageSquare, Brain,
  LogOut,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toggleTheme } from "@/lib/theme";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "./DashboardSidebar";

export default function DashboardTopbar() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
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

  const closeAndNavigate = (path: string) => {
    setShowUserMenu(false);
    navigate(path);
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

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center cursor-pointer"
            >
              {initials}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
                      TITAN
                    </span>
                  </div>
                </div>

                {/* Section 1 — Your Account */}
                <div className="py-1.5">
                  <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your Account</p>
                  <MenuItem icon={User} label="Profile & Settings" onClick={() => closeAndNavigate("/settings")} />
                  <MenuItem icon={Users} label="Team & Seats" onClick={() => closeAndNavigate("/settings")} />
                  <MenuItem icon={CreditCard} label="Billing & Plan" onClick={() => closeAndNavigate("/settings")} />
                  <MenuItem icon={Plug} label="Connected Integrations" onClick={() => closeAndNavigate("/settings")} />
                </div>

                <div className="mx-3 border-t border-border" />

                {/* Section 2 — Your Workspace */}
                <div className="py-1.5">
                  <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your Workspace</p>
                  <MenuItem icon={Rocket} label="Deploy New Agent" onClick={() => closeAndNavigate("/agents/new")} />
                  <MenuItem icon={UserPlus} label="Invite Teammate" onClick={() => { setShowUserMenu(false); /* TODO: open invite modal */ }} />
                  <MenuItem icon={Key} label="API Keys & Webhooks" onClick={() => closeAndNavigate("/settings")} />
                </div>

                <div className="mx-3 border-t border-border" />

                {/* Section 3 — Help & Support */}
                <div className="py-1.5">
                  <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Help & Support</p>
                  <a
                    href="https://docs.mythoshq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-1.5 text-[11px] text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <BookOpen size={13} className="text-muted-foreground shrink-0" />
                    Documentation
                    <span className="ml-auto text-[9px] text-muted-foreground">↗</span>
                  </a>
                  <MenuItem icon={Sparkles} label="What's New / Changelog" onClick={() => { setShowUserMenu(false); }} />
                  <MenuItem icon={MessageSquare} label="Send Feedback" onClick={() => { setShowUserMenu(false); setShowFeedback(true); }} />
                  <MenuItem icon={Brain} label="Talk to Chief" onClick={() => closeAndNavigate("/chief")} />
                </div>

                <div className="mx-3 border-t border-border" />

                {/* Danger Zone */}
                <div className="py-1.5">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-4 py-1.5 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={13} className="shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isMobile && (
            <button onClick={() => navigate("/agents/new")} className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md deploy-glow hover:bg-primary/90 transition-colors duration-150">
              Deploy Agent +
            </button>
          )}
        </div>
      </header>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowFeedback(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Send Feedback</h3>
              <button onClick={() => setShowFeedback(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
            <button
              onClick={() => { setShowFeedback(false); setFeedbackText(""); }}
              disabled={!feedbackText.trim()}
              className="w-full mt-3 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}

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

function MenuItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-4 py-1.5 text-[11px] text-foreground hover:bg-muted/40 transition-colors"
    >
      <Icon size={13} className="text-muted-foreground shrink-0" />
      {label}
    </button>
  );
}
