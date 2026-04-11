import { useState } from "react";

const emails = [
  { id: 1, sender: "Marcus Reed", subject: "Re: Wholesale Sample Request", summary: "Austin bar owner wants pricing for 10-case minimum", priority: "High", time: "9:12 AM", category: "Wholesale Leads", draft: "Hi Marcus, thanks for your interest. Our 10-case minimum starts at $320 per case for the Smoked Maple Old Fashioned. I'd be happy to send samples to your Austin location this week. Let me know a good delivery window." },
  { id: 2, sender: "QuickBooks", subject: "Invoice #1042 overdue", summary: "Barrel & Oak — $2,400 outstanding, 7 days past due", priority: "High", time: "8:45 AM", category: "Finance", draft: "Hi team at Barrel & Oak, this is a friendly reminder that Invoice #1042 for $2,400 is now 7 days past due. Please let us know if there are any issues with payment processing." },
  { id: 3, sender: "Amazon Seller Central", subject: "Your Amazon listing suppressed", summary: "Smoked Maple Old Fashioned listing needs image update", priority: "Med", time: "7:30 AM", category: "Customer Service", draft: "I'll update the listing images to comply with Amazon's updated requirements. The main product image needs a pure white background." },
  { id: 4, sender: "Dev Patel", subject: "Let's connect about your product", summary: "Neon Spirits Bar owner interested in exclusive distribution", priority: "Med", time: "Yesterday", category: "Wholesale Leads", draft: "Hi Dev, great to hear from you. I'd love to discuss an exclusive distribution arrangement for Neon Spirits Bar. Are you free for a call this Thursday afternoon?" },
  { id: 5, sender: "Klaviyo", subject: "Klaviyo weekly report", summary: "Email campaign performance summary — 38.2% open rate", priority: "FYI", time: "Yesterday", category: "Press", draft: "" },
];

const tabs = ["All", "Wholesale Leads", "Customer Service", "Finance", "Press"];

export default function InboxPage() {
  const [selected, setSelected] = useState(emails[0]);
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All" ? emails : emails.filter((e) => e.category === activeTab);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">INBOX</h1>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded transition-colors duration-150 ${
              activeTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground border border-border hover:text-foreground"
            }`}
          >{t}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          {filtered.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelected(email)}
              className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${
                selected.id === email.id ? "bg-primary/10 border border-primary/30" : "bg-card border border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{email.sender}</span>
                <span className="text-[10px] text-muted-foreground">{email.time}</span>
              </div>
              <p className="text-sm text-foreground truncate">{email.subject}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{email.summary}</p>
              <span className={`inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                email.priority === "High" ? "bg-destructive/20 text-destructive" : email.priority === "Med" ? "bg-warning/20 text-warning" : "bg-muted/50 text-muted-foreground"
              }`}>{email.priority}</span>
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground">{selected.subject}</p>
            <p className="text-xs text-muted-foreground mt-1">From: {selected.sender} · {selected.time}</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chief's Summary</p>
            <p className="text-sm text-foreground mb-4">{selected.summary}</p>
          </div>
          {selected.draft && (
            <div className="border-t border-border pt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chief's Draft Response</p>
              <p className="text-sm text-foreground bg-primary/5 rounded-lg p-3 mb-4">{selected.draft}</p>
              <div className="flex gap-2">
                <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity duration-150">Approve & Send</button>
                <button className="text-xs font-medium border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted/50 transition-colors duration-150">Edit</button>
                <button className="text-xs font-medium text-muted-foreground px-4 py-2 rounded-md hover:text-foreground transition-colors duration-150">Ignore</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
