import { useState } from "react";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toggleTheme } from "@/lib/theme";

export default function DashboardTopbar() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm tracking-tight text-foreground">
          <span className="font-bold">MYTHOS</span>{" "}
          <span className="font-normal text-xs text-primary">HQ</span>
        </span>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search agents, logs, contacts..."
            className="w-full text-xs bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
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
        <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-[#9a2f4d] transition-colors duration-150">
          Deploy Agent +
        </button>
      </div>
    </header>
  );
}
