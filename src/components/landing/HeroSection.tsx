import { Link } from "react-router-dom";

function ChiefMockup() {
  const items = [
    { label: "Email Response", desc: "Reply to wholesale inquiry from Austin bar owner" },
    { label: "Social Post", desc: "Instagram carousel: Behind the Barrel Series #4" },
    { label: "Invoice", desc: "Invoice #1042 — $2,400 overdue 7 days" },
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-4 w-72 shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-foreground">CHIEF</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="bg-background/50 rounded-lg p-3 border border-border">
            <p className="text-xs font-medium text-foreground mb-1">{item.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            <div className="flex gap-2 mt-2">
              <button className="text-[10px] font-medium bg-primary text-primary-foreground px-2.5 py-1 rounded">Approve</button>
              <button className="text-[10px] font-medium text-muted-foreground border border-border px-2.5 py-1 rounded hover:text-foreground transition-colors duration-150">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center grid-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-sm mb-6">
              Now in Public Beta →
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground mb-6">
              Run your entire business.
              <br />
              <span className="gradient-text">Tell your story.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              MYTHOS HQ is the all-in-one founder OS — with an AI Chief of Operations handling what doesn't need you, and surfacing everything that does.
            </p>
            <div className="flex gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-[#9a2f4d] transition-colors duration-150">
                Start Free →
              </Link>
              <a href="#features" className="inline-flex items-center text-sm font-medium text-foreground border border-border px-6 py-3 rounded-md hover:bg-muted/50 transition-colors duration-150">
                See How It Works
              </a>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <div className="relative" style={{ perspective: "1000px" }}>
              <div className="glow-primary rounded-xl" style={{ transform: "rotateY(-8deg) rotateX(4deg)" }}>
                <ChiefMockup />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-border pt-10">
          {[
            ["10,000+", "Founders"],
            ["99.99%", "Uptime"],
            ["7", "Pillars"],
            ["$276/mo", "Saved"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold text-foreground">{val}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
