import { useState } from "react";
import { toggleTheme } from "@/lib/theme";

export default function DashboardTopbar() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm tracking-tight text-foreground"><span className="font-bold">MYTHOS</span> <span className="font-normal text-xs text-primary">HQ</span></span>
      </div>
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search anything..." className="w-full text-xs bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => { toggleTheme(); setDark(!dark); }}
          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
          aria-label="Toggle theme"
        >
          {dark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        <button className="relative w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150" aria-label="Notifications">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">SM</div>
        <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-[#9a2f4d] transition-colors duration-150">Deploy Agent</button>
      </div>
    </header>
  );
}
