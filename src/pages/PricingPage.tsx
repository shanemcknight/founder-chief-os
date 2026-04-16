import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Check, Zap, Key, HelpCircle, Bot } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";

function ByokLine() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5">
        <Key size={11} className="text-primary shrink-0" />
        <span>
          Connect{" "}
          <Link to="/settings" className="hover:underline" style={{ color: "#5D9992" }}>
            your own API key
          </Link>{" "}
          for unlimited tokens
        </span>
        <button
          onClick={(e) => { e.preventDefault(); setOpen(!open); }}
          className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="What is BYOK?"
        >
          <HelpCircle size={12} />
        </button>
      </div>
      {open && (
        <div className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground bg-muted/20 border border-border/50 rounded-md px-2.5 py-2">
          Connect your Anthropic, OpenAI, or Google API key in{" "}
          <Link to="/settings" className="hover:underline" style={{ color: "#5D9992" }}>Settings → Agent Settings</Link>
          . You pay the AI provider directly — no markup, no token limits. Takes 2 minutes to set up.
        </div>
      )}
    </div>
  );
}

const plans = [
  {
    key: "scout",
    name: "SCOUT",
    price: "$0",
    period: "/mo",
    agents: "1 Agent",
    tokens: "500K tokens/mo",
    seats: "1 seat",
    features: [
      "3 integrations",
      "Basic inbox triage",
      "3 social accounts",
      "100 AI email responses/mo",
    ],
    cta: "Get Started",
    byok: false,
  },
  {
    key: "titan",
    name: "TITAN",
    price: "$49",
    period: "/mo",
    badge: "Most Popular",
    agents: "3 Agents",
    tokens: "10M tokens/mo",
    seats: "1 seat",
    features: [
      "All 7 pillars",
      "All integrations",
      "Full CRM — unlimited contacts",
      "BYOK unlocks unlimited tokens",
    ],
    cta: "Subscribe",
    byok: true,
  },
  {
    key: "atlas",
    name: "ATLAS",
    price: "$79",
    period: "/mo",
    agents: "10 Agents",
    tokens: "20M tokens/mo",
    seats: "2 seats",
    features: [
      "Everything in TITAN",
      "Priority support",
      "Advanced analytics",
      "Custom automations",
      "Team collaboration",
    ],
    cta: "Subscribe",
    byok: true,
  },
  {
    key: "olympus",
    name: "OLYMPUS",
    price: "$149",
    period: "/mo",
    agents: "Unlimited Agents",
    tokens: "50M tokens/mo",
    seats: "5 seats",
    features: [
      "Everything in ATLAS",
      "Local node hosting",
      "White-label",
      "Dedicated Chief AI",
      "Custom integrations",
      "SLA",
    ],
    cta: "Subscribe",
    byok: true,
  },
];

const whyAgents = [
  {
    icon: Bot,
    title: "Deploy once. Run forever.",
    body: "Each agent watches your business 24/7 — reading emails, monitoring orders, tracking leads. You only see what needs a decision.",
  },
  {
    icon: Zap,
    title: "One click approval.",
    body: "Your agent drafts the response, creates the order, schedules the post. You approve in AGENTIC HQ. Done.",
  },
  {
    icon: Key,
    title: "Connect your own AI key.",
    body: "TITAN and above: connect your Anthropic, OpenAI, or Google key for unlimited tokens. You pay the provider directly.",
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (planKey === "scout") {
      navigate("/dashboard");
      return;
    }

    setLoading(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("stripe-checkout", {
        body: {
          plan: planKey,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
      });

      if (resp.data?.url) {
        window.location.href = resp.data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = subscription?.plan || "scout";

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <section className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-foreground text-center mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">
            Start free. Scale when you're ready. Every plan includes Chief AI.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.key && user;
              return (
                <div
                  key={plan.key}
                  className={`bg-card border rounded-xl p-6 flex flex-col relative ${
                    plan.badge
                      ? "border-primary ring-1 ring-primary/30 scale-[1.02]"
                      : "border-border"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-sm">
                      {plan.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-4 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}

                  <h3 className="text-sm font-semibold tracking-wide text-foreground mb-1">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>

                  {/* Hero metric — agent count, the primary value driver */}
                  <div className="mb-3 pb-3 border-b border-border">
                    <p className="text-2xl font-bold text-primary leading-none">{plan.agents}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Deployed Agents</p>
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

                  <button
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={!!isCurrent || loading === plan.key}
                    className={`text-sm font-medium text-center py-2.5 rounded-md transition-opacity duration-150 disabled:opacity-50 ${
                      plan.badge
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {loading === plan.key ? "Redirecting..." : isCurrent ? "Current Plan" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Why agents matter explainer */}
          <div className="mt-16">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-4">
              Why Agents Matter
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {whyAgents.map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-lg p-4 text-center">
                  <item.icon size={20} className="text-primary mb-2 mx-auto" />
                  <p className="text-xs font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10">
            <span className="font-semibold text-foreground">3 agents</span> running your business.{" "}
            <span className="font-semibold text-primary">$49/mo</span>.
          </p>
        </div>
      </section>
    </div>
  );
}
