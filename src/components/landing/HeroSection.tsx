import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Mail, Share2, Clock, DollarSign, TrendingUp, Zap } from "lucide-react";

function LiveAgentActivity() {
  return (
    <div className="mt-16 mb-4">
      <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        Agents working right now
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Large Card 1 — Email Intelligence */}
        <div className="md:col-span-2 bg-card border border-border border-t-2 border-t-primary rounded-xl p-5 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_24px_hsl(170_22%_48%/0.12)] animate-fade-in opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Email Intelligence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success">Live</span>
            </div>
          </div>

          <div className="bg-background/60 rounded-lg p-3 border border-border mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-destructive/15 text-destructive text-[9px] font-bold px-1.5 rounded">HIGH</span>
              <span className="text-xs font-semibold text-foreground">B & H Sales</span>
              <span className="text-[10px] text-muted-foreground ml-auto">2 min ago</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Outstanding Invoice Reminder — $3,056</p>
            <p className="text-[10px] text-warning italic mt-1">↳ Draft reply ready — payment terms confirmed</p>
            <div className="flex gap-2 mt-2">
              <button className="bg-primary text-primary-foreground text-[9px] px-2.5 py-1 rounded">Approve Reply</button>
              <button className="border border-border text-[9px] px-2.5 py-1 rounded text-foreground">Edit</button>
            </div>
          </div>

          <div className="bg-background/60 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2">
              <span className="bg-warning/15 text-warning text-[9px] font-bold px-1.5 rounded">MED</span>
              <span className="text-xs font-semibold text-foreground">DM Transportation</span>
              <span className="text-[10px] text-muted-foreground ml-auto">14 min ago</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Partnership inquiry — supply chain strategy</p>
            <p className="text-[10px] text-warning italic mt-1">↳ Categorized as lead — intro reply drafted</p>
            <div className="flex gap-2 mt-2">
              <button className="bg-primary text-primary-foreground text-[9px] px-2.5 py-1 rounded">Approve Reply</button>
              <button className="border border-border text-[9px] px-2.5 py-1 rounded text-foreground">Edit</button>
            </div>
          </div>
        </div>

        {/* Large Card 2 — Social Publishing */}
        <div className="bg-card border border-border border-t-2 border-t-accent rounded-xl p-5 hover:border-accent/40 transition-all duration-300 hover:shadow-[0_0_24px_hsl(36_91%_44%/0.12)] animate-fade-in opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 size={16} className="text-accent" />
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Social</span>
            </div>
            <span className="text-[10px] text-muted-foreground">4 posts scheduled</span>
          </div>

          <div className="space-y-2 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
              <span className="text-[11px] text-foreground font-medium">LinkedIn post</span>
              <Clock size={10} className="text-muted-foreground ml-auto" />
              <span className="text-[10px] text-success">Going live in 2h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C13584]" />
              <span className="text-[11px] text-foreground font-medium">Instagram carousel</span>
              <span className="text-[10px] text-muted-foreground ml-auto">Tomorrow 9am</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1877F2]" />
              <span className="text-[11px] text-foreground font-medium">Facebook story</span>
              <span className="text-[10px] text-warning ml-auto">Pending approval</span>
              <button className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded ml-1">Approve</button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 text-center italic">Design + Schedule + Publish</p>
        </div>
      </div>

      {/* Small metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-300 animate-fade-in opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
          <Mail size={20} className="text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">7</p>
          <p className="text-[11px] text-muted-foreground leading-tight">emails drafted while you slept</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-300 animate-fade-in opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards]">
          <DollarSign size={20} className="text-warning mb-2" />
          <p className="text-2xl font-bold text-warning">$4,200</p>
          <p className="text-[11px] text-muted-foreground leading-tight">in invoices sent today</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-300 animate-fade-in opacity-0 [animation-delay:500ms] [animation-fill-mode:forwards]">
          <TrendingUp size={20} className="text-success mb-2" />
          <p className="text-2xl font-bold text-success">3</p>
          <p className="text-[11px] text-muted-foreground leading-tight">leads added to pipeline</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-300 animate-fade-in opacity-0 [animation-delay:600ms] [animation-fill-mode:forwards]">
          <Zap size={20} className="text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">4</p>
          <p className="text-[11px] text-muted-foreground leading-tight">posts live across 3 platforms</p>
        </div>
      </div>
    </div>
  );
}

function AgentHQMockup() {
  const items = [
    {
      type: "Email",
      typeStyle: "bg-muted text-muted-foreground",
      dot: "bg-destructive",
      desc: "Wholesale inquiry — Austin bar owner. Response drafted.",
      time: "2 min ago",
    },
    {
      type: "Social",
      typeStyle: "bg-warning/15 text-warning",
      dot: "bg-warning",
      desc: "LinkedIn post ready — scheduled 2pm",
      time: "25 min ago",
    },
    {
      type: "Invoice",
      typeStyle: "bg-primary/15 text-primary",
      dot: "bg-warning",
      desc: "Invoice #1042 overdue — $840 outstanding",
      time: "3 hr ago",
    },
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-4 w-full max-w-[288px] lg:max-w-[340px] shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-foreground tracking-wide">AGENTIC HQ</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.type + item.time} className="bg-background/50 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${item.typeStyle}`}>{item.type}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
            </div>
            <p className="text-xs text-foreground leading-relaxed mb-1">{item.desc}</p>
            <p className="text-[10px] text-muted-foreground mb-2">{item.time}</p>
            <div className="flex gap-2">
              <button className="text-[10px] font-medium bg-primary text-primary-foreground px-2.5 py-1 rounded">Approve</button>
              <button className="text-[10px] font-medium text-muted-foreground border border-border px-2.5 py-1 rounded hover:text-foreground transition-colors duration-150">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountUp({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [value, setValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const numStr = target.replace(/[^0-9.]/g, "");
          const num = parseFloat(numStr);
          const prefix = target.replace(/[0-9.,]+.*/, "");
          if (!num) {
            setValue(target);
            return;
          }
          const duration = 1500;
          const steps = 40;
          let step = 0;
          const interval = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = num * eased;
            if (num >= 100) {
              setValue(prefix + Math.round(current).toLocaleString() + suffix);
            } else {
              setValue(prefix + current.toFixed(num % 1 !== 0 ? 2 : 0) + suffix);
            }
            if (step >= steps) {
              clearInterval(interval);
              setValue(target);
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix]);

  return <span ref={ref}>{value}</span>;
}

export default function HeroSection() {
  return (
    <section className="relative grid-bg overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 lg:px-16 pt-16 pb-16 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-20 items-center">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-sm mb-6">
              Private Beta · Invite Only
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-foreground mb-6">
              Less noise. More story.
              <br />
              <span className="gradient-text">Scale What Matters.</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Emails read, written and ready for approval. Leads tracked. Orders placed. Invoices sent. Socials designed, scheduled, and live. All of it done. You are not alone.
            </p>
            <div className="flex gap-3">
              <Link to="/beta" className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors duration-150">
                Start Free →
              </Link>
              <a href="#how-it-works" className="inline-flex items-center text-sm font-medium text-foreground border border-border px-6 py-3 rounded-md hover:bg-muted/50 transition-colors duration-150">
                See How It Works
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-center">
            <div className="relative" style={{ perspective: "1000px", background: "radial-gradient(ellipse at 75% 50%, hsl(var(--primary) / 0.08) 0%, transparent 60%)" }}>
              <div className="glow-primary rounded-xl" style={{ transform: "rotateY(-8deg) rotateX(4deg)" }}>
                <AgentHQMockup />
              </div>
            </div>
          </div>
        </div>

        <LiveAgentActivity />

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-border pt-10">
          {([
            ["7", "Pillars"],
            ["1-Click", "Approvals"],
            ["3", "Agents min"],
            ["$49/mo", "to start"],
          ] as const).map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold text-foreground"><CountUp target={val} /></p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
