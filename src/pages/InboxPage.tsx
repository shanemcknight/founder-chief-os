import { useState } from "react";

const filters = ["All", "Wholesale Leads", "Customer Service", "Finance", "Press"];

const emails = [
  {
    id: 1,
    priority: "HIGH",
    sender: "Bar & Spirits Co, Austin",
    email: "mike@barandspirits.com",
    subject: "Wholesale Inquiry — Ginger Beer BIB Pricing",
    summary: "Bar owner asking about 3-gal BIB pricing and minimum order. High intent.",
    time: "9:14am",
    category: "Wholesale Leads",
    body: "Hey Shane — we run a cocktail bar in East Austin and have been using your Ginger Beer in our Moscow Mules for a few months now. Customers love it. We're looking at switching to bag-in-box to cut costs and reduce waste behind the bar. Can you send over pricing for the 3-gallon BIB format, along with minimum order quantities and typical lead time? We'd also be open to trying any other mixers you carry.",
    draft: "Hey Mike — thanks for reaching out, and glad to hear your customers are loving the Ginger Beer. For the 3-gallon BIB format, we're at $135 per unit with a 6-unit minimum on first orders. Lead time is typically 5–7 business days from order confirmation. I'd love to send you a free sample of our Tonic Water BIB as well — it pairs great with the gin programs most Austin bars are running right now. Let me know where to ship and I'll get it out this week.\n\nHave the best day of your life,\nShane",
  },
  {
    id: 2,
    priority: "HIGH",
    sender: "QuickBooks",
    email: "notifications@quickbooks.intuit.com",
    subject: "Invoice #1042 is 14 days overdue",
    summary: "Invoice for $840 outstanding. Recommend sending reminder today.",
    time: "8:02am",
    category: "Finance",
    body: "This is a reminder that Invoice #1042, issued to Barrel & Oak on March 28, 2026, for $840.00 is now 14 days past due. The invoice covers a shipment of 12x Ginger Beer BIB units delivered on March 25. Please follow up with your customer to arrange payment.",
    draft: "Hey team at Barrel & Oak — just a friendly heads-up that Invoice #1042 for $840 is now 14 days past due. I know things get busy, so just wanted to surface this in case it slipped through. You can pay via the link in the original invoice email, or let me know if you'd prefer to arrange a different method. Appreciate you!\n\nHave the best day of your life,\nShane",
  },
  {
    id: 3,
    priority: "MED",
    sender: "Amazon Seller Central",
    email: "seller-notifications@amazon.com",
    subject: "Your listing has been suppressed",
    summary: "Ginger Beer BIB listing flagged — missing bullet point. Easy fix.",
    time: "Yesterday",
    category: "Customer Service",
    body: "Your listing for 'Top Hat Provisions Ginger Beer — 3 Gallon Bag-in-Box' (ASIN: B09XYZ1234) has been suppressed due to incomplete product information. Specifically, the listing is missing a required bullet point in the product description. Please update your listing to restore visibility in search results.",
    draft: "I've identified the issue — the fifth bullet point on the BIB listing was removed during last week's update. I've prepared the corrected listing copy with all five bullet points restored. Approve this and I'll push the update to Amazon immediately.\n\nHave the best day of your life,\nShane",
  },
  {
    id: 4,
    priority: "MED",
    sender: "James Whitfield",
    email: "james@whitfieldgroup.com",
    subject: "Following up on our conversation",
    summary: "Potential wholesale partner from SF. Wants to schedule a call.",
    time: "Yesterday",
    category: "Wholesale Leads",
    body: "Shane — great meeting you at the trade show last week. I run a group of four cocktail bars in the SF Bay Area and we're actively looking for a premium mixer supplier. Your Ginger Beer stood out. Would love to set up a call this week to talk pricing, distribution, and whether you do custom labeling for bar programs.",
    draft: "James — great connecting at the show, and glad the Ginger Beer made an impression. I'd love to set up a call — how does Thursday at 2pm PT work? We absolutely do custom labeling for bar programs, and I can walk you through pricing tiers for multi-location accounts. I'll send a calendar invite shortly.\n\nHave the best day of your life,\nShane",
  },
  {
    id: 5,
    priority: "FYI",
    sender: "Klaviyo",
    email: "reports@klaviyo.com",
    subject: "Your weekly email performance report",
    summary: "Open rate 38.2%, up 4.1% vs last week. No action needed.",
    time: "Mon",
    category: "Press",
    body: "Here's your weekly performance summary for Top Hat Provisions. Your campaigns achieved a 38.2% open rate this week, up from 34.1% last week. Click-through rate held steady at 4.8%. Your best-performing email was 'Behind the Barrel: How We Source Our Ginger' with a 52% open rate. No issues detected with deliverability.",
    draft: "No response needed — this is an automated report. Open rate is trending up nicely at 38.2%. I'll flag it if anything drops below 30% or if deliverability issues appear.\n\n— Chief",
  },
];

const priorityClass: Record<string, string> = {
  HIGH: "bg-destructive/15 text-destructive",
  MED: "bg-warning/15 text-warning",
  FYI: "bg-muted text-muted-foreground",
};

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState(1);
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All" ? emails : emails.filter((e) => e.category === activeFilter);
  const selected = emails.find((e) => e.id === selectedId)!;

  return (
    <div className="flex h-full -m-6">
      {/* Email List — Left 60% */}
      <div className="w-[60%] border-r border-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground mb-3">Inbox</h1>
          <div className="flex gap-1 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors duration-150 ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((email) => {
            const isSelected = email.id === selectedId;
            return (
              <button
                key={email.id}
                onClick={() => setSelectedId(email.id)}
                className={`w-full text-left p-4 border-b border-border transition-colors duration-150 ${
                  isSelected
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-muted/30 border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityClass[email.priority]}`}>
                    {email.priority}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">{email.sender}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{email.time}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate mb-0.5">{email.subject}</p>
                <p className="text-[11px] text-muted-foreground truncate">Chief: {email.summary}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Email Detail — Right 40% */}
      <div className="w-[40%] flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-semibold text-foreground">{selected.sender}</p>
            <span className="text-[10px] text-muted-foreground shrink-0">{selected.time}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">{selected.email}</p>
          <p className="text-sm font-bold text-foreground">{selected.subject}</p>
        </div>

        <div className="p-4 flex-1">
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{selected.body}</p>

          <div className="border-t border-border mt-5 pt-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Chief's Draft Response
            </p>
            <div className="bg-primary/5 border border-border rounded-lg p-3">
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{selected.draft}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-[#9a2f4d] transition-colors duration-150">
              Approve & Send
            </button>
            <button className="text-xs font-medium text-foreground border border-border px-4 py-2 rounded-md hover:bg-muted/50 transition-colors duration-150">
              Edit Draft
            </button>
            <button className="text-xs font-medium text-muted-foreground px-3 py-2 hover:text-foreground transition-colors duration-150">
              Ignore
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Sending as: shane@tophatprovisions.com · via Gmail
          </p>
        </div>
      </div>
    </div>
  );
}
