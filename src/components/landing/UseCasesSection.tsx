import { Mail, Share2, TrendingUp } from "lucide-react";

const cases = [
  {
    icon: Mail,
    title: "The 2am email",
    story:
      "A wholesale buyer emails at 2am asking for pricing and availability. Your agent reads it, checks your inventory context, and drafts a professional reply in your voice. You wake up, read it, tap Approve. It's sent before you've had coffee.",
    tag: "INBOX + AGENTS",
  },
  {
    icon: Share2,
    title: "Content without the grind",
    story:
      "You describe a product story. Your agent writes the LinkedIn post, formats it for Instagram, and schedules both for optimal times. You review the calendar, approve the posts, and they go out automatically via API.",
    tag: "SOCIAL + AGENTS",
  },
  {
    icon: TrendingUp,
    title: "A lead in your inbox",
    story:
      "An inbound email arrives from a new restaurant group. Your agent flags it as HIGH priority, adds them to your CRM pipeline, and drafts an intro reply with your sample offer. One approval creates the lead and sends the email.",
    tag: "SALES + INBOX",
  },
];

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider text-center mb-3">
          REAL SCENARIOS
        </p>
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">
          This is what your day looks like.
        </h2>
        <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
          Not demos. Not hypotheticals. How founders actually use MythosHQ.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
                <Icon size={24} className="text-primary mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-3">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.story}</p>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-4">
                  {c.tag}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
