import { useState } from "react";
import { Check } from "lucide-react";

const priorities = [
  { summary: "Wholesale inquiry — Austin bar owner. Response drafted.", actions: ["Approve", "Edit"] },
  { summary: "LinkedIn post ready to publish — scheduled 2pm", actions: ["Approve", "Edit"] },
  { summary: "Invoice #1042 overdue — $840 outstanding", actions: ["View", "Dismiss"] },
];

const mockChat = [
  { role: "user" as const, text: "What's the most urgent thing today?" },
  { role: "chief" as const, text: "The Austin wholesale inquiry. Bar owner asked about BIB pricing. I've drafted a response — approve it and it goes out in your voice. Want me to also add them to the CRM pipeline?" },
];

export default function ChiefPanel() {
  const [input, setInput] = useState("");
  const [dismissed, setDismissed] = useState<number[]>([]);

  const handleApprove = (index: number) => {
    setDismissed((prev) => [...prev, index]);
  };

  return (
    <aside className="w-full md:w-[300px] shrink-0 md:border-l border-border bg-card flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <span className="text-sm font-bold text-foreground tracking-wide">CHIEF</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today's Priorities</p>
          <div className="space-y-2">
            {priorities.map((item, i) => {
              const isDismissed = dismissed.includes(i);
              if (isDismissed) {
                return (
                  <div key={i} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 flex items-center gap-2 transition-all duration-500">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Approved</span>
                  </div>
                );
              }
              return (
                <div key={i} className="bg-background/50 border border-border rounded-lg p-2.5 transition-all duration-300">
                  <p className="text-xs text-foreground leading-relaxed mb-2">{item.summary}</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleApprove(i)} className="text-[10px] font-medium bg-primary text-primary-foreground px-2 py-1 rounded transition-colors duration-150 hover:bg-primary/90">
                      {item.actions[0]}
                    </button>
                    <button className="text-[10px] font-medium text-muted-foreground border border-border px-2 py-1 rounded hover:text-foreground transition-colors duration-150">
                      {item.actions[1]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border" />

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
          <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors duration-150">→</button>
        </div>
      </div>
    </aside>
  );
}
