const columns = [
  {
    title: "New Lead",
    cards: [
      { company: "Midnight Lounge", contact: "Jake Torres", value: "$3,200", days: 2 },
      { company: "Craft & Pour", contact: "Lisa Chen", value: "$1,800", days: 1 },
    ],
  },
  {
    title: "Contacted",
    cards: [
      { company: "Barrel & Oak", contact: "Marcus Reed", value: "$4,500", days: 5 },
    ],
  },
  {
    title: "Sampling",
    cards: [
      { company: "The Copper Still", contact: "Anna Walsh", value: "$2,400", days: 8 },
      { company: "Neon Spirits Bar", contact: "Dev Patel", value: "$6,000", days: 3 },
    ],
  },
  {
    title: "Closed",
    cards: [
      { company: "Highline Cocktails", contact: "Sam Rivera", value: "$5,100", days: 0 },
    ],
  },
];

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">SALES</h1>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.title}</h3>
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{col.cards.length}</span>
            </div>
            <div className="space-y-2">
              {col.cards.map((card) => (
                <div key={card.company} className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors duration-150">
                  <p className="text-sm font-semibold text-foreground">{card.company}</p>
                  <p className="text-xs text-muted-foreground">{card.contact}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-medium text-foreground">{card.value}</span>
                    <span className="text-[10px] text-muted-foreground">{card.days}d in stage</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Add Contact</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <input placeholder="Company name" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Contact name" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Deal value" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <button className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity duration-150 w-full">Add to Pipeline</button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Apollo Prospect Search</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <input placeholder="Search prospects..." className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <button className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity duration-150">Search</button>
            </div>
            <div className="text-xs text-muted-foreground text-center py-4">Enter a search query to find prospects via Apollo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
