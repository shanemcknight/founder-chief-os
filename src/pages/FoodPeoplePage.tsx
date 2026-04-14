import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, ChefHat, BarChart3, Mail as MailIcon, Calendar, FileSpreadsheet, Building2, Users, UserCheck, UtensilsCrossed } from "lucide-react";

const CALENDLY = "https://calendly.com/shane-tophatprovisions/30min";
const MAILTO = "mailto:hello@mythoshq.io?subject=Food%20People%20—%20Discovery%20Call";

const FoodPeoplePage = () => (
  <div className="min-h-screen bg-[#1A1D21] text-white font-sans">
    {/* ── HERO ── */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#5D9992]/8 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20 text-center relative z-10">
        <Badge className="mb-8 border-[#D97706]/50 text-[#D97706] bg-[#D97706]/10 hover:bg-[#D97706]/10 text-xs tracking-wide">
          Custom Proposal · Food People Restaurant Group
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
          Your people run great restaurants.
        </h1>
        <p className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-[#5D9992] to-[#D97706] bg-clip-text text-transparent mb-6">
          Let's give them more time to prove it.
        </p>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed mb-10">
          A custom Agentic AI operating system — built around your existing stack, branded as your own — so your five leaders can focus on hospitality, not administration.
        </p>
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="bg-[#5D9992] hover:bg-[#5D9992]/90 text-white text-base px-8 py-6 rounded-lg">
            Book a Discovery Call with Shane →
          </Button>
        </a>
      </div>
    </section>

    {/* ── INSIGHT CARD ── */}
    <section className="max-w-4xl mx-auto px-6 pb-24">
      <div className="bg-[#222529] border border-white/[0.06] rounded-2xl p-8 sm:p-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">The difference between tools and a system.</h2>
        <p className="text-gray-400 leading-relaxed mb-5">
          Your team already uses Toast, QuickBooks, Outlook, Teams, and scheduling tools that work. The gap isn't the tools — it's the time your leaders spend moving between them, pulling data, sending updates, and chasing answers that should surface automatically.
        </p>
        <p className="text-gray-400 leading-relaxed">
          A custom Agentic AI system connects everything you already have. Your agents read across every tool, surface what needs attention, and draft the response — your leaders review and approve. The work gets done. Your people stay focused on the floor.
        </p>
      </div>
    </section>

    {/* ── YOUR STACK CONNECTED ── */}
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <p className="text-[#5D9992] text-xs font-semibold tracking-[0.2em] uppercase mb-3">Your Tools. Connected.</p>
      <h2 className="text-3xl sm:text-4xl font-bold mb-12">We build around what you already use.</h2>
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { icon: <BarChart3 className="w-5 h-5 text-[#5D9992]" />, title: "TOAST POS", body: "Live sales, cover counts, and location performance surfaced automatically to leadership. No report pulls. No manual rollups." },
          { icon: <FileSpreadsheet className="w-5 h-5 text-[#5D9992]" />, title: "QUICKBOOKS", body: "P&L by location, food cost variance, and invoice management — your AI Chief reads the numbers and flags what needs a decision before it becomes a problem." },
          { icon: <MailIcon className="w-5 h-5 text-[#5D9992]" />, title: "MICROSOFT OUTLOOK & TEAMS", body: "Email managed by AI. Every draft written in your voice, reviewed before it sends. The right message gets to the right person — automatically." },
          { icon: <Calendar className="w-5 h-5 text-[#5D9992]" />, title: "SCHEDULING SYSTEM", body: "Labor costs, shift coverage, and exceptions surfaced to the right manager in real time. No more chasing the schedule." },
          { icon: <ChefHat className="w-5 h-5 text-[#5D9992]" />, title: "EXCEL & RECIPE COSTING", body: "Food cost builds, recipe costing, and operational reports — out of spreadsheets and into dashboards your team actually uses." },
          { icon: <Building2 className="w-5 h-5 text-[#5D9992]" />, title: "40 LOCATIONS, ONE VIEW", body: "Every location. Every metric. Visible to your five leaders from one screen — with the ability to drill into any restaurant in seconds." },
        ].map((c) => (
          <div key={c.title} className="bg-[#222529] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              {c.icon}
              <h3 className="text-sm font-bold tracking-wide text-white/90">{c.title}</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── YOUR TEAM'S EXPERIENCE ── */}
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <p className="text-[#5D9992] text-xs font-semibold tracking-[0.2em] uppercase mb-3">Built for your people</p>
      <h2 className="text-3xl sm:text-4xl font-bold mb-12">The right information for the right person.</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { icon: <Users className="w-6 h-6 text-[#D97706]" />, title: "YOUR 5 LEADERS", body: "A morning briefing across all 40 locations. Revenue, labor, cost variances, and anything that needs a decision — waiting for them when the day starts. More time for strategy. Less time on status updates." },
          { icon: <UserCheck className="w-6 h-6 text-[#D97706]" />, title: "YOUR 40 GENERAL MANAGERS", body: "Their dashboard shows their restaurant. Their numbers. Their team. Their day. Clean, simple, and built for operators — not analysts." },
          { icon: <UtensilsCrossed className="w-6 h-6 text-[#D97706]" />, title: "YOUR CHEFS & KITCHEN LEADS", body: "Recipe builds, cost targets, and variance alerts in one place. Spend more time in the kitchen and less time in spreadsheets." },
        ].map((c) => (
          <div key={c.title} className="bg-[#222529] border border-white/[0.06] rounded-xl p-7">
            <div className="mb-4">{c.icon}</div>
            <h3 className="text-sm font-bold tracking-wide text-white/90 mb-3">{c.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── HOW IT WORKS ── */}
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <p className="text-[#5D9992] text-xs font-semibold tracking-[0.2em] uppercase mb-3">The Process</p>
      <h2 className="text-3xl sm:text-4xl font-bold mb-12">From first conversation to full operation — in weeks.</h2>
      <div className="grid md:grid-cols-3 gap-5 relative">
        {/* connecting line */}
        <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-[#5D9992] to-[#D97706] opacity-40" />
        {[
          { step: "01", label: "DISCOVERY", price: "$7,500 · 2 weeks", body: "We spend two weeks with your leadership team. Map every workflow, every tool, every reporting need across all 40 locations. You receive a complete system design and integration plan before we build a single thing." },
          { step: "02", label: "BUILD & ACTIVATION", price: "Scoped after Discovery", body: "We build your branded system, connect your full stack, train your agents on your operation, and onboard your five leaders. 30 days of dedicated activation support included." },
          { step: "03", label: "OPERATE", price: "$3,500/mo", body: "Ongoing system management, new agents as your operation grows, monthly strategy sessions, and priority support. Your system evolves as Food People grows." },
        ].map((s) => (
          <div key={s.step} className="bg-[#222529] border border-white/[0.06] rounded-xl p-7 relative">
            <div className="w-10 h-10 rounded-full bg-[#5D9992]/20 text-[#5D9992] flex items-center justify-center text-sm font-bold mb-5">{s.step}</div>
            <h3 className="text-sm font-bold tracking-wide text-white/90 mb-1">{s.label}</h3>
            <p className="text-[#D97706] text-sm font-semibold mb-4">{s.price}</p>
            <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── WHY SHANE ── */}
    <section className="max-w-4xl mx-auto px-6 pb-24">
      <p className="text-[#5D9992] text-xs font-semibold tracking-[0.2em] uppercase mb-3">Who builds this</p>
      <h2 className="text-3xl sm:text-4xl font-bold mb-8">Built by someone who has run your operation.</h2>
      <div className="bg-[#222529] border border-white/[0.06] rounded-2xl p-8 sm:p-12">
        <p className="text-gray-400 leading-relaxed mb-5">
          Shane McKnight spent 25 years building food and beverage programs at scale — 22 professional stadiums, 13 Coachellas, 13 Super Bowls, and activations for Salesforce, Google, Meta, and Stanford. He understands operations that run on hospitality, culture, and people.
        </p>
        <p className="text-gray-400 leading-relaxed">
          He built MYTHOS HQ to run his own business — not as a technology experiment, but because he needed it. That's what he builds for clients: systems that actually work for operators, built by someone who has stood in the same place you have.
        </p>
      </div>
    </section>

    {/* ── FINAL CTA ── */}
    <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-4">Let's talk about Food People.</h2>
      <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
        30 minutes with Shane. We'll walk through your current stack and show you exactly what we'd build — before you commit to anything.
      </p>
      <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
        <Button size="lg" className="bg-[#5D9992] hover:bg-[#5D9992]/90 text-white text-base px-8 py-6 rounded-lg mb-4">
          Book a Call with Shane →
        </Button>
      </a>
      <p className="text-gray-500 text-sm">
        Or reach Warren and James directly:{" "}
        <a href={MAILTO} className="text-[#5D9992] hover:underline">hello@mythoshq.io</a>
      </p>
      <p className="text-gray-600 text-xs italic mt-8">
        This page was prepared specifically for the Food People Restaurant Group leadership team.
      </p>
    </section>

    {/* ── FOOTER ── */}
    <footer className="border-t border-white/[0.06] py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-white font-bold tracking-wider text-sm">MYTHOS HQ</span>
        <a href="mailto:hello@mythoshq.io" className="text-gray-500 text-sm hover:text-gray-400">hello@mythoshq.io</a>
      </div>
    </footer>
  </div>
);

export default FoodPeoplePage;
