import { useState } from "react";
import { ChevronRight, Home, Layers, MessageSquareQuote, Camera, Award } from "lucide-react";
import { cn } from "@/lib/utils";

// Strategy sub-views rendered inline
type StrategyView = "home" | "pillars" | "voice" | "shots";

interface StrategyCard { id: StrategyView; label: string; icon: React.ElementType; description: string }

const NAV_CARDS: StrategyCard[] = [
  { id: "pillars", label: "Content Pillars", icon: Layers, description: "Strategic themes that guide every post" },
  { id: "voice", label: "Brand Voice", icon: MessageSquareQuote, description: "Tone directives and platform-specific voice" },
  { id: "shots", label: "Shot List", icon: Camera, description: "What to film and capture" },
];

export default function SocialStrategyPage() {
  const [view, setView] = useState<StrategyView>("home");

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-1.5 text-sm shrink-0">
        <button onClick={() => setView("home")} className="text-muted-foreground hover:text-foreground transition-colors"><Home className="w-4 h-4" /></button>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="text-muted-foreground">Strategy</span>
        {view !== "home" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-foreground font-medium capitalize">{NAV_CARDS.find(c => c.id === view)?.label || view}</span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {view === "home" && <StrategyHome onNavigate={setView} />}
        {view === "pillars" && <PillarsView />}
        {view === "voice" && <VoiceView />}
        {view === "shots" && <ShotsView />}
      </div>
    </div>
  );
}

function StrategyHome({ onNavigate }: { onNavigate: (v: StrategyView) => void }) {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Strategy Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform guides, brand voice, content pillars, and shot lists.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {NAV_CARDS.map(card => (
          <button key={card.id} onClick={() => onNavigate(card.id)} className="text-left bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all group">
            <card.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-sm font-semibold text-foreground">{card.label}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{card.description}</div>
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Platform Quick Reference</h2>
        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: "📸", name: "Instagram", role: "Visual-first. The craft.", cadence: "4-5x/week" },
            { icon: "📘", name: "Facebook", role: "The storyteller. Long-form.", cadence: "3-4x/week" },
            { icon: "🎵", name: "TikTok", role: "Unhinged. Raw. BTS.", cadence: "5-7x/week" },
            { icon: "💼", name: "LinkedIn", role: "The stage. Authority.", cadence: "3-4x/week" },
            { icon: "📌", name: "Pinterest", role: "The guide. Searchable.", cadence: "5-10x/week" },
          ].map(p => (
            <div key={p.name} className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">{p.icon}</div>
              <div className="text-xs font-semibold text-foreground">{p.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{p.role}</div>
              <div className="text-[10px] text-primary font-medium mt-1">{p.cadence}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PillarsView() {
  const pillars = [
    { emoji: "🏗️", name: "Behind the Build", description: "Raw footage, factory tours, R&D, process", platforms: ["TikTok", "Instagram", "YouTube"] },
    { emoji: "📊", name: "Industry Authority", description: "Data, trends, thought leadership", platforms: ["LinkedIn", "YouTube"] },
    { emoji: "🎉", name: "Social Proof", description: "Events, testimonials, partnerships", platforms: ["Instagram", "Facebook", "LinkedIn"] },
    { emoji: "🍹", name: "Product Showcase", description: "Recipes, use cases, setups", platforms: ["Pinterest", "Instagram", "TikTok"] },
    { emoji: "💡", name: "Education", description: "How-tos, pour cost math, system guides", platforms: ["YouTube", "LinkedIn", "TikTok"] },
    { emoji: "🤝", name: "Culture & Values", description: "Team, mission, user stories", platforms: ["Facebook", "Instagram", "LinkedIn"] },
    { emoji: "📣", name: "Announcements", description: "New products, launches, milestones", platforms: ["All"] },
  ];
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-xl font-bold text-foreground">Content Pillars</h1><p className="text-sm text-muted-foreground mt-1">Strategic themes for every post.</p></div>
      <div className="space-y-3">
        {pillars.map((p, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
            <span className="text-2xl">{p.emoji}</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              <div className="flex gap-1.5 mt-2">{p.platforms.map(pl => <span key={pl} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{pl}</span>)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceView() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const platforms = [
    { id: "instagram", emoji: "📸", label: "Instagram — The Craft", color: "#E1306C", voice: "Confident and intentional. The image does the talking.", tone: ["Visual-first", "Intentional", "Clean", "Cool"] },
    { id: "facebook", emoji: "📘", label: "Facebook — The Storyteller", color: "#1877F2", voice: "A knowledgeable friend writing you a personal letter.", tone: ["Warm", "Personal", "Narrative", "User-led"] },
    { id: "tiktok", emoji: "🎵", label: "TikTok — Unhinged & Raw", color: "#666", voice: "Talking to you like you're standing in the bar.", tone: ["Unfiltered", "Direct", "Industry insider", "No polish"] },
    { id: "linkedin", emoji: "💼", label: "LinkedIn — The Stage", color: "#0A66C2", voice: "A TED Talk from the most credentialed person in the room.", tone: ["Authoritative", "Generous", "Data-driven", "Inspirational"] },
    { id: "pinterest", emoji: "📌", label: "Pinterest — The Guide", color: "#E60023", voice: "The helpful expert who organizes your life and your bar.", tone: ["Searchable", "Practical", "Occasion-aware", "Clear"] },
  ];
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-xl font-bold text-foreground">Brand Voice</h1><p className="text-sm text-muted-foreground mt-1">First person. Real numbers. No corporate speak.</p></div>
      <div className="space-y-2">
        {platforms.map(pv => (
          <div key={pv.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => setExpanded(expanded === pv.id ? null : pv.id)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors">
              <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: pv.color }} />
              <span className="text-lg">{pv.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{pv.label}</div>
                <div className="text-xs text-muted-foreground italic mt-0.5">"{pv.voice}"</div>
              </div>
            </button>
            {expanded === pv.id && (
              <div className="px-5 pb-5 pt-1 border-t border-border">
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pv.tone.map(t => <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: pv.color + "15", color: pv.color }}>{t}</span>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShotsView() {
  const shots = [
    { category: "🎬 First 5 Videos", items: [
      { title: "Formula Lab Walkthrough", desc: "Walk through the lab, explain what you're making and why", duration: "60-90s" },
      { title: "BIB Install Time-Lapse", desc: "Capture a full bag-in-box install from start to pour", duration: "30-45s" },
      { title: "Pour Cost Math on a Napkin", desc: "Write out the real numbers — their cost vs yours", duration: "45-60s" },
    ]},
    { category: "📷 Always Capture", items: [
      { title: "Raw Pour Shots", desc: "Close-up pours, bubbles, ice, garnish — every shoot", duration: "10-15s each" },
      { title: "Behind the Scenes", desc: "What the workspace actually looks like mid-production", duration: "15-30s" },
    ]},
    { category: "🔄 Rotate Monthly", items: [
      { title: "Customer Spotlight", desc: "Film or screenshot a real customer using the product", duration: "30-60s" },
      { title: "Seasonal Recipe", desc: "New cocktail or mocktail recipe for the current season", duration: "60-90s" },
    ]},
  ];
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div><h1 className="text-xl font-bold text-foreground">Shot Lists & Filming</h1><p className="text-sm text-muted-foreground mt-1">What to capture, how long, and where to use it.</p></div>
      {shots.map(cat => (
        <div key={cat.category}>
          <h2 className="text-sm font-semibold text-foreground mb-3">{cat.category}</h2>
          <div className="space-y-2">
            {cat.items.map((s, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{s.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{s.duration}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
