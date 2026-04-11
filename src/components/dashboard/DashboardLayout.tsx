import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MessageCircle, X, LayoutDashboard, Mail, BookOpen, Brain, MoreHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ChiefPanel from "@/components/dashboard/ChiefPanel";
import { useIsMobile } from "@/hooks/use-mobile";

const mobileTabItems = [
  { label: "COMMAND", path: "/dashboard", icon: LayoutDashboard },
  { label: "INBOX", path: "/inbox", icon: Mail },
  { label: "STORY", path: "/story", icon: BookOpen },
  { label: "CHIEF", path: "/chief", icon: Brain },
  { label: "More", path: "", icon: MoreHorizontal },
];

export default function DashboardLayout() {
  const isMobile = useIsMobile();
  const [showChief, setShowChief] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardTopbar />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <DashboardSidebar />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
        {!isMobile && <ChiefPanel />}
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around h-14 z-40">
          {mobileTabItems.map((item) => {
            const Icon = item.icon;
            if (item.label === "More") {
              return (
                <button key="more" onClick={() => setShowMoreMenu(!showMoreMenu)} className="flex flex-col items-center gap-0.5 text-muted-foreground">
                  <Icon size={18} />
                  <span className="text-[9px]">More</span>
                </button>
              );
            }
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <Icon size={18} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* Mobile more menu */}
      {isMobile && showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end">
          <div className="w-full bg-card border-t border-border rounded-t-2xl p-4 pb-8 space-y-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-foreground">Navigation</span>
              <button onClick={() => setShowMoreMenu(false)} className="text-muted-foreground"><X size={18} /></button>
            </div>
            {[
              { label: "SALES", path: "/sales" },
              { label: "PUBLISH", path: "/publish" },
              { label: "BUILD", path: "/build" },
              { label: "Settings", path: "/settings" },
              { label: "Deploy Agent", path: "/agents/new" },
            ].map((item) => (
              <NavLink key={item.path} to={item.path} onClick={() => setShowMoreMenu(false)}
                className={`block text-sm font-medium px-3 py-2.5 rounded-md ${location.pathname === item.path ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted/30"}`}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Chief FAB */}
      {isMobile && !showChief && (
        <button onClick={() => setShowChief(true)} className="fixed bottom-18 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg deploy-glow">
          <MessageCircle size={20} />
        </button>
      )}

      {/* Mobile Chief drawer */}
      {isMobile && showChief && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end">
          <div className="w-full h-[80vh] bg-card border-t border-border rounded-t-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-bold text-foreground">CHIEF</span>
              <button onClick={() => setShowChief(false)} className="text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChiefPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
