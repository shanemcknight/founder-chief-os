import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

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
    <div className="bg-card border border-border rounded-xl p-4 w-full max-w-[300px] shadow-2xl">
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
    <section className="relative min-h-screen flex items-center grid-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-sm mb-6">
              Private Beta · Invite Only
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground mb-6">
              Your agents run the business.
              <br />
              <span className="gradient-text">You make the calls.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              MythosHQ deploys AI agents across your inbox, CRM, social media, and operations. Every agent surfaces decisions for your approval — nothing goes out without you. Connect your tools once. Your agents handle the rest.
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
