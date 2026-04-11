import { useState } from "react";

const briefingItems = [
  "Invoice #1042 is 7 days overdue — $2,400 from Barrel & Oak.",
  "Amazon listing suppressed: Smoked Maple Old Fashioned.",
  "3 wholesale leads waiting in inbox since yesterday.",
];

const approvalQueue = [
  { type: "Email Response", desc: "Reply to Austin bar owner about sample pricing", id: 1 },
  { type: "Social Post", desc: "LinkedIn: Q2 revenue milestone announcement", id: 2 },
  { type: "Invoice", desc: "Send reminder for Invoice #1042 — $2,400", id: 3 },
];

const mockChat = [
  { role: "user" as const, text: "What should I focus on today?" },
  { role: "chief" as const, text: "Three things: approve the wholesale reply sitting in inbox, fix that Amazon listing before it costs you rank, and sign off on tomorrow's LinkedIn post. Everything else is handled." },
];

export default function ChiefPanel() {
  const [input, setInput] = useState("");

  return (
    <aside className="w-[300px] shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <span className="text-sm font-bold text-foreground tracking-wide">CHIEF</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today's Briefing</p>
          <div className="space-y-2">
            {briefingItems.map((item, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-lg p-2.5">
                <p className="text-xs text-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Approval Queue</p>
          <div className="space-y-2">
            {approvalQueue.map((item) => (
              <div key={item.id} className="bg-background/50 border border-border rounded-lg p-2.5">
                <p className="text-[10px] font-semibold text-foreground mb-0.5">{item.type}</p>
                <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                <div className="flex gap-1.5">
                  <button className="text-[10px] font-medium bg-primary text-primary-foreground px-2 py-1 rounded transition-opacity duration-150 hover:opacity-90">Approve</button>
                  <button className="text-[10px] font-medium text-muted-foreground border border-border px-2 py-1 rounded hover:text-foreground transition-colors duration-150">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chat</p>
          <div className="space-y-2">
            {mockChat.map((msg, i) => (
              <div key={i} className={`text-xs p-2.5 rounded-lg ${msg.role === "chief" ? "bg-primary/10 text-foreground" : "bg-muted/50 text-foreground"}`}>
                <span className="font-semibold text-[10px] block mb-1">{msg.role === "chief" ? "CHIEF" : "You"}</span>
                {msg.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Chief anything..."
            className="flex-1 text-xs bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-2 rounded-md hover:opacity-90 transition-opacity duration-150">→</button>
        </div>
      </div>
    </aside>
  );
}
