import { Search, MoreHorizontal } from "lucide-react";

const pipelineColumns = [
  {
    title: "NEW LEAD",
    count: 3,
    cards: [
      { biz: "The Rusty Nail, Portland OR", contact: "Marcus T.", value: "$135/mo", days: 1, note: "Follow up with BIB pricing" },
      { biz: "Highball Hotel Bar, Nashville", contact: "Sarah K.", value: "$270/mo", days: 2, note: "Send sample kit" },
      { biz: "Pacific Rim Catering, Seattle", contact: "David L.", value: "$540/mo", days: 0, note: "New — needs outreach" },
    ],
  },
  {
    title: "CONTACTED",
    count: 4,
    cards: [
      { biz: "The Mixing Bowl, Denver", contact: "Chris R.", value: "$135/mo", days: 5, note: "Awaiting response" },
      { biz: "Barrel & Branch, Austin", contact: "Jen M.", value: "$405/mo", days: 3, note: "Interested, wants sample" },
      { biz: "Blue Agave, Phoenix", contact: "Tom W.", value: "$270/mo", days: 7, note: "Follow up today" },
      { biz: "Coastal Events Co", contact: "Amy P.", value: "$810/mo", days: 4, note: "Large event caterer" },
    ],
  },
  {
    title: "SAMPLING",
    count: 2,
    cards: [
      { biz: "Sip & Savor, SF", contact: "Mike B.", value: "$135/mo", days: 12, note: "Sample delivered, follow up" },
      { biz: "Grove Street Bistro, Oakland", contact: "Lisa N.", value: "$270/mo", days: 8, note: "Tasting next week" },
    ],
  },
  {
    title: "CLOSED",
    count: 6,
    cards: [
      { biz: "Redwood Tap House", value: "$405/mo" },
      { biz: "Citrus & Rye", value: "$270/mo" },
      { biz: "The Brass Monkey", value: "$135/mo" },
      { biz: "Velvet Lounge", value: "$540/mo" },
      { biz: "Iron Horse Saloon", value: "$270/mo" },
      { biz: "Ember & Oak", value: "$405/mo" },
    ],
  },
];

const prospects = [
  { biz: "The Interval Bar & Café", loc: "Long Now Foundation, SF", contact: "Maria Santos", title: "Bar Manager", email: "m***@***.org" },
  { biz: "Trick Dog", loc: "Mission District, SF", contact: "Scott Baird", title: "Owner", email: "s***@***.com" },
  { biz: "Smuggler's Cove", loc: "Hayes Valley, SF", contact: "Martin Cate", title: "Owner", email: "m***@***.com" },
];

export default function SalesPage() {
  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Pipeline</h1>
        <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          Add Contact +
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-3">
        {pipelineColumns.map((col) => (
          <div key={col.title} className="min-h-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{col.title}</h3>
              <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{col.count}</span>
            </div>
            <div className="space-y-2">
              {col.title === "CLOSED"
                ? col.cards.map((card) => (
                    <div key={card.biz} className="bg-card/50 border border-border rounded-lg p-2.5 opacity-75">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-foreground truncate">{card.biz}</p>
                        <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded shrink-0 ml-2">Won</span>
                      </div>
                      <p className="text-[10px] text-warning font-medium mt-0.5">{card.value}</p>
                    </div>
                  ))
                : col.cards.map((card: any) => (
                    <div key={card.biz} className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-xs font-semibold text-foreground leading-tight">{card.biz}</p>
                        <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
                          <MoreHorizontal size={13} />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{card.contact}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] font-medium text-warning">Est. {card.value}</span>
                        <span className="text-[10px] text-muted-foreground">Day {card.days}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{card.note}</p>
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>

      {/* Apollo Prospect Search */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-foreground">Find New Prospects</h2>
          <span className="text-[9px] text-muted-foreground border border-border rounded px-1.5 py-0.5">powered by Apollo</span>
        </div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            defaultValue="bar owners San Francisco"
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            placeholder="Search by city, business type, or keyword... e.g. 'bar owners in Austin TX'"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {prospects.map((p) => (
            <div key={p.biz} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground mb-0.5">{p.biz}</p>
              <p className="text-[10px] text-muted-foreground mb-2">{p.loc}</p>
              <p className="text-[11px] text-foreground">{p.contact}</p>
              <p className="text-[10px] text-muted-foreground mb-1">{p.title}</p>
              <p className="text-[10px] text-muted-foreground font-mono mb-3">{p.email}</p>
              <button className="w-full text-[11px] font-medium bg-primary text-primary-foreground py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                Add to Pipeline
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}