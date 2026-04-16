import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function ChiefMockup() {
  const items = [
    { label: "Email Response", desc: "Reply to wholesale inquiry from Austin bar owner" },
    { label: "Social Post", desc: "Instagram carousel: Behind the Barrel Series #4" },
    { label: "Invoice", desc: "Invoice #1042 — $2,400 overdue 7 days" },
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-4 w-full max-w-[288px] shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-foreground">CHIEF</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="bg-background/50 rounded-lg p-3 border border-border">
            <p className="text-xs font-medium text-foreground mb-1">{item.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            <div className="flex gap-2 mt-2">
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
              Private Beta — Invite Only
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground mb-6">
              Run your entire business.
              <br />
              <span className="gradient-text">Tell your story.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              MYTHOS HQ is the all-in-one user OS — with an AI Chief of Operations handling what doesn't need you, and surfacing everything that does.
            </p>
            <div className="flex gap-3">
              <Link to="/beta" className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors duration-150">
                Join the Waitlist →
              </Link>
              <a href="#features" className="inline-flex items-center text-sm font-medium text-foreground border border-border px-6 py-3 rounded-md hover:bg-muted/50 transition-colors duration-150">
                See How It Works
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-center">
            <div className="relative" style={{ perspective: "1000px", background: "radial-gradient(ellipse at 75% 50%, rgba(181,65,101,0.06) 0%, transparent 60%)" }}>
              <div className="glow-primary rounded-xl" style={{ transform: "rotateY(-8deg) rotateX(4deg)" }}>
                <ChiefMockup />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-border pt-10">
          {([
            ["10,000+", "Users"],
            ["99.99%", "Uptime"],
            ["7", "Pillars"],
            ["$276/mo", "Saved"],
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
