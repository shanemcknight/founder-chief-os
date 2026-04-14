import { Link } from "react-router-dom";
import { Check, Zap, Key, HelpCircle } from "lucide-react";
import { useState } from "react";

function ByokLine() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5">
        <Key size={11} className="text-primary shrink-0" />
        <span>
          Connect your{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "#5D9992" }}
          >
            Anthropic API key
          </a>{" "}
          for unlimited tokens
        </span>
        <button
          onClick={(e) => { e.preventDefault(); setOpen(!open); }}
          className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="What is an Anthropic API key?"
        >
          <HelpCircle size={12} />
        </button>
      </div>
      {open && (
        <div className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground bg-muted/20 border border-border/50 rounded-md px-2.5 py-2">
          Your Claude.ai subscription and an Anthropic API key are two different things.
          An API key is a separate account at{" "}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#5D9992" }}>console.anthropic.com</a>
          {" "}— you pay Anthropic directly per token with no monthly fee. Takes 5 minutes to set up.
        </div>
      )}
    </div>
  );
}

const plans = [
  {
    name: "SCOUT",
    price: "Free",
    period: "",
    tokens: "500K tokens",
    seats: "1 seat",
    features: ["1 agent", "3 social accounts", "Basic CRM — 25 contacts", "100 AI email responses/mo"],
    featured: false,
    cta: "Start Free",
  },
  {
    name: "TITAN",
    price: "$49",
    period: "/mo",
    badge: "Most Popular",
    tokens: "10M tokens",
    seats: "1 seat",
    features: [
      "Unlimited agents",
      "All 7 pillars",
      "Full CRM — unlimited contacts",
      "All integrations",
      "Chief AI full access",
    ],
    featured: true,
    cta: "Start with Titan",
    byok: true,
  },
  {
    name: "ATLAS",
    price: "$79",
    period: "/mo",
    tokens: "20M tokens",
    seats: "2 seats",
    features: [
      "Everything in TITAN",
      "Priority support",
      "Advanced analytics",
      "Custom automations",
      "Team collaboration",
    ],
    featured: false,
    cta: "Start with Atlas",
    byok: true,
  },
  {
    name: "OLYMPUS",
    price: "$149",
    period: "/mo",
    tokens: "50M tokens",
    seats: "5 seats",
    features: [
      "Everything in ATLAS",
      "Local node hosting",
      "White-label",
      "Dedicated Chief AI",
      "Custom integrations",
      "SLA",
    ],
    featured: false,
    cta: "Talk to Us",
    byok: true,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">Pricing</h2>
        <p className="text-muted-foreground text-center mb-14">Start free. Scale when you're ready.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card border rounded-xl p-6 flex flex-col ${
                plan.featured ? "border-primary ring-1 ring-primary/30 relative scale-[1.02]" : "border-border"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-sm">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-sm font-semibold tracking-wide text-foreground mb-1">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap size={12} className="text-primary" />{plan.tokens}</span>
                <span>{plan.seats}</span>
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.byok && <ByokLine />}
              <Link
                to="/pricing"
                className={`text-sm font-medium text-center py-2.5 rounded-md transition-opacity duration-150 ${
                  plan.featured
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:bg-muted/50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          TITAN replaces <span className="font-semibold text-foreground">$276/mo</span> in tools. You pay <span className="font-semibold text-primary">$49</span>.
        </p>
      </div>
    </section>
  );
}
