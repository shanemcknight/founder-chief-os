import { Plug, Bot, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Plug,
    title: "Connect your tools",
    body: "Link your email, CRM, social accounts, and business tools. MythosHQ works with what you already use — Outlook, Gmail, Shopify, QuickBooks, LinkedIn, and more.",
  },
  {
    num: "02",
    icon: Bot,
    title: "Deploy your agents",
    body: "Choose from pre-built agent templates or deploy your own. Each agent is trained on your business — your voice, your workflows, your priorities. One click and they're live.",
  },
  {
    num: "03",
    icon: CheckCircle,
    title: "Approve and go",
    body: "Every agent action surfaces in AGENTIC HQ for your review. Reply to that email, post to LinkedIn, create that invoice — one click approves it. Nothing goes out without you.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider text-center mb-3">
          HOW IT WORKS
        </p>
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">
          Three steps to an AI-powered business.
        </h2>
        <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
          No technical setup. No prompt engineering. Just connect, deploy, and approve.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative">
                <div className="bg-card border border-border rounded-xl p-6 h-full">
                  <p className="text-6xl font-bold text-primary/20 mb-4 leading-none">{step.num}</p>
                  <Icon size={32} className="text-primary mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 w-10 items-center justify-center text-primary/40 z-10">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
