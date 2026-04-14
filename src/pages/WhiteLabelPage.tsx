import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import FooterSection from "@/components/landing/FooterSection";
import { Badge } from "@/components/ui/badge";
import { Package, UtensilsCrossed, Briefcase, Palette, Bot, Plug, Rocket } from "lucide-react";

const CALENDLY = "https://calendly.com/shane-tophatprovisions/30min";
const MAILTO = "mailto:hello@mythoshq.io?subject=White Label Discovery";

/* ── Reusable tiny components ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">{children}</p>;
}
function SectionHeadline({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{children}</h2>;
}
function DarkCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

/* ── WHO WE BUILD FOR data ── */
const industries = [
  { icon: Package, title: "CPG & Beverage Brands", body: "DTC, Amazon, wholesale, co-manufacturing. We understand the full channel stack and what it takes to run it lean." },
  { icon: UtensilsCrossed, title: "Food & Beverage Operations", body: "Multi-location restaurants, hospitality groups, catering operations. From Toast to QuickBooks to scheduling — we connect what you already use." },
  { icon: Briefcase, title: "Founder-Led Businesses", body: "Any industry. If you're a founder running a real operation with a real team and real complexity — we build for you." },
];

/* ── WHAT YOU GET data ── */
const features = [
  { title: "YOUR BRAND, YOUR SYSTEM", icon: Palette, body: "Your logo, your colors, your name. Your team opens a dashboard that looks and feels like an internal tool built just for them — because it was." },
  { title: "AGENTIC AI BUILT IN", icon: Bot, body: "Not a chat window bolted on. Agents embedded into every workflow — reading your data, drafting responses, surfacing decisions, taking action. You approve. They execute." },
  { title: "CONNECTED TO YOUR STACK", icon: Plug, body: "We integrate with what you already use. QuickBooks, your email, your CRM, your POS, your scheduling system. Nothing gets replaced. Everything gets smarter." },
  { title: "ACTIVATED BY OUR TEAM", icon: Rocket, body: "We don't hand you software and a help doc. We build it, connect it, train it on your business, and onboard your team. You show up to a working system." },
];

/* ── TIMELINE data ── */
const steps = [
  { num: "01", title: "DISCOVERY", price: "Starting at $3,000", body: "We map your operation, your tools, your workflows, and your goals. You receive a complete system design and integration roadmap before we build anything.", note: "Scope and investment determined by operation size." },
  { num: "02", title: "BUILD & ACTIVATION", price: "Custom scoped after Discovery", body: "We build your branded system, connect your integrations, deploy your agents, and onboard your team. 30 days of dedicated support included.", note: "" },
  { num: "03", title: "OPERATE", price: "$1,500 – $3,500/mo", body: "Ongoing system management, new agent builds, monthly strategy session, and priority support. Your system evolves as your business does.", note: "" },
];

/* ── PRICING data ── */
const pricingCards = [
  {
    title: "DISCOVERY SPRINT",
    price: "Starting at $3,000",
    items: ["Operation audit & workflow mapping", "Integration design", "Custom system architecture", "Full roadmap document", "1 strategy session"],
    cta: "Start Here →",
    ctaVariant: "outline" as const,
    note: "Investment scales with operation size. Applied as credit toward your Build.",
    featured: false,
  },
  {
    title: "BUILD & ACTIVATION",
    price: "Custom Scoped",
    items: ["Fully branded custom dashboard", "All integrations connected", "Agents trained on your business", "Team onboarding", "30 days activation support"],
    cta: "Book a Discovery Call →",
    ctaVariant: "default" as const,
    note: "Scoped and priced after Discovery Sprint.",
    featured: true,
  },
  {
    title: "MONTHLY RETAINER",
    price: "$1,500 – $3,500/mo",
    items: ["System maintenance & updates", "New agent builds", "Monthly strategy session", "Priority support", "Quarterly optimization review"],
    cta: "Let's Talk →",
    ctaVariant: "outline" as const,
    note: "Hourly engagements available on request.",
    featured: false,
  },
];

export default function WhiteLabelPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* ─── SECTION 1: HERO ─── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-primary border-primary/40 text-xs tracking-wide">
            Custom Builds · Enterprise · White Label
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-4">
            Your business deserves its own operating system.
          </h1>
          <p className="text-xl md:text-2xl font-semibold mb-4 gradient-text">
            Built for you. Branded as yours. Running on day one.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            We design and activate custom Agentic AI operating systems for founders and operators who are ready to run their entire business from one intelligent dashboard — built around how they work, not how a SaaS company thinks they should.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-primary-foreground px-8 py-3.5 rounded-md hover:bg-primary/90 transition-colors duration-150">
              Book a Discovery Call →
            </a>
            <a href={MAILTO} className="inline-flex items-center gap-1 text-sm font-medium border border-border text-foreground px-8 py-3.5 rounded-md hover:bg-accent/10 transition-colors duration-150">
              Email us at hello@mythoshq.io
            </a>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: PROOF STRIP ─── */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <DarkCard>
            <p className="text-foreground leading-relaxed">
              MYTHOS HQ is Customer #1. We built this system to run Top Hat Provisions — a multi-channel CPG brand operating across Shopify, Amazon, wholesale, and events. It manages email, CRM, social content, Klaviyo, QuickBooks, and fulfillment from one dashboard. Now we build it for others.
            </p>
            <p className="text-muted-foreground text-sm italic mt-4">
              Shane McKnight · Founder, Top Hat Provisions &amp; Culture Cocktails
            </p>
          </DarkCard>
        </div>
      </section>

      {/* ─── SECTION 3: WHO WE BUILD FOR ─── */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Our Expertise</SectionLabel>
            <SectionHeadline>We know your industry.</SectionHeadline>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {industries.map((ind) => (
              <DarkCard key={ind.title}>
                <ind.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{ind.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ind.body}</p>
              </DarkCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: WHAT YOU GET ─── */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>What We Build</SectionLabel>
            <SectionHeadline>One system. Every function. Completely yours.</SectionHeadline>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <DarkCard key={f.title}>
                <f.icon className="w-7 h-7 text-primary mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </DarkCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: HOW WE WORK (TIMELINE) ─── */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>The Process</SectionLabel>
            <SectionHeadline>From first call to full operation — in weeks, not months.</SectionHeadline>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-px bg-border" />
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold mb-4 mx-auto md:mx-0 relative z-10">
                  {s.num}
                </div>
                <DarkCard>
                  <h3 className="text-base font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-primary text-sm font-medium mb-3">{s.price}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{s.body}</p>
                  {s.note && <p className="text-xs text-muted-foreground italic">{s.note}</p>}
                </DarkCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: INVESTMENT ─── */}
      <section className="pb-20 px-6" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Investment</SectionLabel>
            <SectionHeadline>Straightforward pricing. No surprises.</SectionHeadline>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Fixed-fee packages so you know exactly what you're getting — and what you're paying — before we start.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingCards.map((card) => (
              <DarkCard key={card.title} className={card.featured ? "border-primary ring-1 ring-primary/20" : ""}>
                <h3 className="text-base font-semibold text-foreground mb-1">{card.title}</h3>
                <p className="text-primary text-lg font-bold mb-4">{card.price}</p>
                <ul className="space-y-2 mb-6">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={CALENDLY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center text-sm font-medium py-2.5 rounded-md transition-colors duration-150 ${
                    card.ctaVariant === "default"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border text-foreground hover:bg-accent/10"
                  }`}
                >
                  {card.cta}
                </a>
                <p className="text-xs text-muted-foreground mt-3 italic">{card.note}</p>
              </DarkCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: ABOUT SHANE ─── */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>Who Builds This</SectionLabel>
          <SectionHeadline>Built by an operator, for operators.</SectionHeadline>
          <DarkCard className="text-left">
            <p className="text-foreground leading-relaxed mb-4">
              Shane McKnight spent 25 years building and running beverage and food programs at scale — 22 professional stadiums, 13 Coachellas, 13 Super Bowls, and programs for Salesforce, Google, Meta, and Stanford. He formulated the original Kirkland Hard Seltzer for Costco.
            </p>
            <p className="text-foreground leading-relaxed">
              He built MYTHOS HQ because he needed it. Not to learn about AI — to run his actual business better. That experience is what he brings to every custom build.
            </p>
          </DarkCard>
        </div>
      </section>

      {/* ─── SECTION 8: FINAL CTA ─── */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Ready to see what this looks like for your operation?
          </h2>
          <p className="text-muted-foreground mb-8">
            Book a 30-minute discovery call. No pitch. Just a real conversation about your business.
          </p>
          <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-primary-foreground px-8 py-3.5 rounded-md hover:bg-primary/90 transition-colors duration-150 mb-4">
            Book Your Discovery Call →
          </a>
          <p className="text-sm text-muted-foreground">
            Or email <a href={MAILTO} className="text-primary hover:underline">hello@mythoshq.io</a>
          </p>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
