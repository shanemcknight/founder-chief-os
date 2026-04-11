const briefing = [
  { text: "Invoice #1042 from Barrel & Oak is 7 days overdue — $2,400.", action: "Send Reminder" },
  { text: "Amazon listing suppressed: Smoked Maple Old Fashioned needs new images.", action: "Fix Listing" },
  { text: "3 wholesale leads haven't been contacted in 48+ hours.", action: "View Leads" },
  { text: "LinkedIn post scheduled for tomorrow needs your approval.", action: "Review Post" },
  { text: "Klaviyo campaign click-through rate dropped 2% — investigate.", action: "View Report" },
];

const chat = [
  { role: "user" as const, text: "What's the most urgent thing right now?" },
  { role: "chief" as const, text: "The Barrel & Oak invoice. It's $2,400 and 7 days overdue. I've drafted a follow-up email — just needs your approval in Inbox." },
  { role: "user" as const, text: "What about the Amazon listing?" },
  { role: "chief" as const, text: "Your Smoked Maple Old Fashioned listing got suppressed because the main image doesn't meet Amazon's updated background requirements. I can generate a compliant image and resubmit if you approve." },
  { role: "user" as const, text: "Do it. What else should I focus on today?" },
  { role: "chief" as const, text: "Three wholesale leads are going cold — Midnight Lounge, Craft & Pour, and a new one from Dev Patel at Neon Spirits Bar. I've drafted personalized outreach for each. After that, approve tomorrow's LinkedIn post and you're clear for the day." },
];

const activityLog = [
  "Drafted email reply to Marcus Reed (wholesale inquiry)",
  "Drafted follow-up for Invoice #1042 — Barrel & Oak",
  "Scheduled LinkedIn post: Q2 Revenue Milestone",
  "Flagged Amazon listing suppression — Smoked Maple Old Fashioned",
  "Generated outreach sequence for 3 wholesale prospects",
];

export default function ChiefPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">CHIEF</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Today's Briefing — April 11</h2>
          <div className="space-y-2">
            {briefing.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3">
                <p className="text-sm text-foreground mb-2">{item.text}</p>
                <button className="text-[10px] font-medium bg-primary text-primary-foreground px-2.5 py-1 rounded hover:opacity-90 transition-opacity duration-150">{item.action}</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Chat</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {chat.map((msg, i) => (
              <div key={i} className={`text-sm p-3 rounded-lg ${msg.role === "chief" ? "bg-primary/10" : "bg-muted/30"}`}>
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">{msg.role === "chief" ? "CHIEF" : "You"}</span>
                <p className="text-foreground">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Activity Log</h2>
          <div className="space-y-2">
            {activityLog.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
