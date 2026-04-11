import { Link } from "react-router-dom";

const plans = [
  {
    name: "SCOUT",
    price: "Free",
    period: "",
    features: ["1 agent", "3 social accounts", "Basic CRM — 25 contacts", "100 AI email responses/mo"],
    featured: false,
  },
  {
    name: "TITAN",
    price: "$49",
    period: "/mo",
    badge: "Most Popular",
    features: [
      "Unlimited agents",
      "All 7 pillars",
      "Full CRM — unlimited contacts",
      "All integrations",
      "5 team seats",
      "Chief AI full access",
    ],
    featured: true,
  },
  {
    name: "OLYMPUS",
    price: "$199",
    period: "/mo",
    features: [
      "Everything in TITAN",
      "Local node hosting",
      "White-label",
      "Dedicated Chief AI",
      "Custom integrations",
      "SLA",
    ],
    featured: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">Pricing</h2>
        <p className="text-muted-foreground text-center mb-14">Start free. Scale when you're ready.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card border rounded-xl p-6 flex flex-col ${
                plan.featured ? "border-primary glow-primary relative border-t-2 border-t-primary" : "border-border"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-sm">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-sm font-semibold tracking-wide text-foreground mb-1">{plan.name}</h3>
              <div className="mb-5">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4 text-success mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/onboarding"
                className={`text-sm font-medium text-center py-2.5 rounded-md transition-opacity duration-150 ${
                  plan.featured
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:bg-muted/50"
                }`}
              >
                Get Started
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
