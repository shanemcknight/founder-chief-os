const pillars = [
  { name: "COMMAND", icon: "⌘", desc: "Every business metric, every tool, one screen." },
  { name: "STORY", icon: "✦", desc: "Social publishing and email marketing, unified." },
  { name: "SALES", icon: "◎", desc: "CRM, outreach, and pipeline that closes deals." },
  { name: "INBOX", icon: "✉", desc: "Your email managed by AI. Your voice on every reply. Your approval before anything sends." },
  { name: "PUBLISH", icon: "▤", desc: "Long-form content drafted and published for you." },
  { name: "CHIEF", icon: "◈", desc: "Your AI Chief of Operations. Briefings, approvals, strategy — running in the background so you don't have to." },
  { name: "BUILD", icon: "⚙", desc: "Describe a tool. Watch it get built." },
];

export default function PillarsSection() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">The 7 Pillars</h2>
        <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">Every tool a founder needs — unified under one operating system.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <div
              key={p.name}
              className={`bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors duration-150 group ${
                i === 6 ? "sm:col-start-1 lg:col-start-2" : ""
              }`}
            >
              <span className="text-2xl mb-3 block">{p.icon}</span>
              <h3 className="text-sm font-semibold text-foreground mb-2 tracking-wide">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
