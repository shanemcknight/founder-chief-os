const pillars = [
  {
    name: "COMMAND",
    icon: "⌘",
    desc: "Your business at a glance. KPIs, agent activity, urgent items, and your daily timeline — all above the fold. The nerve center of your operation.",
    tag: "Dashboard",
  },
  {
    name: "INBOX",
    icon: "✉",
    desc: "AI reads every email, categorizes by urgency, and drafts replies in your voice. You approve before anything sends. Connect Gmail and Outlook — both at once.",
    tag: "Email",
  },
  {
    name: "SOCIAL",
    icon: "✦",
    desc: "Full social calendar with month, week, and day views. Schedule posts across LinkedIn, Instagram, Facebook, Twitter, and Pinterest. Auto-publish or manual — you choose per post.",
    tag: "Publishing",
  },
  {
    name: "SALES",
    icon: "◎",
    desc: "A complete CRM with pipeline stages, contact management, activity tracking, and Apollo-powered prospecting. Your agents surface leads from your inbox automatically.",
    tag: "CRM",
  },
  {
    name: "AGENTS",
    icon: "◈",
    desc: "Deploy specialized AI agents for any business function. Each agent has its own soul — trained on your business context. Chat with them, review their work, approve their actions.",
    tag: "AI Agents",
  },
  {
    name: "PUBLISH",
    icon: "▤",
    desc: "Long-form content drafted and scheduled for you. Blog posts, email sequences, product descriptions — written in your brand voice and queued for your approval.",
    tag: "Content",
  },
  {
    name: "BUILD",
    icon: "⚙",
    desc: "Deploy new agents, configure workflows, and connect new integrations — without writing a line of code. Your operating system grows as your business grows.",
    tag: "Automation",
  },
  {
    name: "REPORTS",
    icon: "▦",
    desc: "Upload any file for instant AI analysis. Build custom Excel tools with your agent. Save your best reports and formulas in one organized library. Your data, finally working for you.",
    tag: "Intelligence",
  },
];

export default function PillarsSection() {
  return (
    <section id="features" className="pt-8 pb-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">Every function of your business.</h2>
        <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
          Seven pillars. One dashboard. One approval workflow.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p) => (
            <div
              key={p.name}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors duration-150 group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl block">{p.icon}</span>
                <span className="text-[9px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">
                  {p.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2 tracking-wide">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
