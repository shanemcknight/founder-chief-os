import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stepLabels = ["Account", "Business", "Connect", "Agent", "Meet Chief"];

const industries = ["Food & Beverage", "E-commerce", "Events & Hospitality", "Agency", "Creator", "Other"];
const goals = [
  "Grow wholesale accounts",
  "Manage email & communications",
  "Publish content consistently",
  "Run my business from one place",
  "All of the above",
];

const integrations = [
  { name: "Gmail", method: "OAuth" },
  { name: "Shopify", method: "OAuth" },
  { name: "LinkedIn", method: "OAuth" },
  { name: "Klaviyo", method: "API Key" },
  { name: "Amazon", method: "OAuth" },
  { name: "QuickBooks", method: "OAuth" },
  { name: "Stripe", method: "OAuth" },
  { name: "Slack", method: "OAuth" },
];

const agentTemplates = [
  { name: "Email Manager", description: "Reads your inbox, drafts responses in your voice, queues for approval", model: "GPT-4o" },
  { name: "Social Publisher", description: "Drafts and schedules posts across LinkedIn, Instagram, TikTok", model: "Claude 3.5" },
  { name: "Wholesale Outreach", description: "Finds prospects, drafts personalized outreach, tracks responses in CRM", model: "GPT-4o" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [connectedTools, setConnectedTools] = useState<Record<string, "connecting" | "connected">>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const navigate = useNavigate();

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const connectTool = (name: string) => {
    setConnectedTools((prev) => ({ ...prev, [name]: "connecting" }));
    setTimeout(() => setConnectedTools((prev) => ({ ...prev, [name]: "connected" })), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-2xl mb-10">
        <div className="flex items-center justify-between mb-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className={`text-[10px] font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>
      </div>

      <div className="w-full max-w-2xl">
        {step > 0 && (
          <button onClick={back} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft size={14} /> Back
          </button>
        )}

        {/* STEP 1 — Account */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">Welcome to MYTHOS HQ</h1>
              <p className="text-sm text-muted-foreground">Let's get you set up in 5 minutes.</p>
            </div>
            <div className="space-y-3">
              {["Full Name", "Email", "Password", "Confirm Password"].map((label) => (
                <div key={label}>
                  <label className="text-xs font-medium text-foreground block mb-1">{label}</label>
                  <input
                    type={label.toLowerCase().includes("password") ? "password" : label === "Email" ? "email" : "text"}
                    placeholder={label}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>
            <button onClick={next} className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors">
              Continue →
            </button>
            <p className="text-center text-xs text-muted-foreground">Already have an account? <span className="text-primary cursor-pointer hover:underline">Log in</span></p>
          </div>
        )}

        {/* STEP 2 — Business */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-foreground mb-1">Tell us about your business</h1>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Business Name</label>
                <input placeholder="Top Hat Provisions" className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Website URL</label>
                <input placeholder="https://tophatprovisions.com" className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Industry</label>
                <select className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option value="">Select industry...</option>
                  {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">Primary Goal</label>
                <div className="space-y-2">
                  {goals.map((g) => (
                    <label key={g} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGoal === g ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"
                    }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedGoal === g ? "border-primary" : "border-muted-foreground"
                      }`}>
                        {selectedGoal === g && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-xs text-foreground">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => { setSelectedGoal(selectedGoal); next(); }} className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors">
              Continue →
            </button>
          </div>
        )}

        {/* STEP 3 — Connect */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-foreground mb-1">Connect your first integration</h1>
              <p className="text-sm text-muted-foreground">One click. No developer setup required.</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {integrations.map((tool) => {
                const status = connectedTools[tool.name];
                return (
                  <div key={tool.name} className={`bg-card border rounded-xl p-4 flex flex-col items-center text-center transition-colors ${
                    status === "connected" ? "border-emerald-500/50" : "border-border"
                  }`}>
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-muted-foreground">{tool.name.charAt(0)}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground mb-1">{tool.name}</span>
                    <span className="text-[9px] text-muted-foreground mb-2">{tool.method}</span>
                    {status === "connecting" ? (
                      <span className="text-[10px] text-primary font-medium animate-pulse">Connecting...</span>
                    ) : status === "connected" ? (
                      <span className="text-[10px] font-semibold text-emerald-400">Connected ✓</span>
                    ) : (
                      <button onClick={() => connectTool(tool.name)} className="text-[10px] font-semibold text-primary border border-primary px-3 py-1 rounded hover:bg-primary/10 transition-colors">
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={next} className="text-xs text-muted-foreground hover:text-foreground transition-colors block mx-auto">Skip for now →</button>
            <button onClick={next} className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors">
              Continue →
            </button>
          </div>
        )}

        {/* STEP 4 — Agent */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-foreground mb-1">Deploy your first agent</h1>
              <p className="text-sm text-muted-foreground">Pick a template or start from scratch.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {agentTemplates.map((agent) => (
                <button
                  key={agent.name}
                  onClick={() => setSelectedAgent(agent.name)}
                  className={`bg-card border rounded-xl p-4 text-left transition-colors ${
                    selectedAgent === agent.name ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/30"
                  }`}
                >
                  <h3 className="text-sm font-bold text-foreground mb-1">{agent.name}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{agent.description}</p>
                  <span className="text-[9px] font-medium bg-muted/50 text-muted-foreground px-2 py-0.5 rounded">{agent.model}</span>
                </button>
              ))}
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors block mx-auto">Start from scratch →</button>
            <button onClick={next} className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors">
              Deploy Agent →
            </button>
          </div>
        )}

        {/* STEP 5 — Meet Chief */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-foreground mb-1">Meet your Chief of Operations</h1>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">CHIEF</span>
                <p className="text-xs text-foreground leading-relaxed">
                  Good morning. I'm Chief — your AI operating partner. I've already reviewed your connected tools and here's what I see in your business:
                </p>
              </div>

              <div className="bg-muted/20 border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                  <span className="text-[11px] text-foreground">3 unread wholesale inquiries in Gmail needing response</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                  <span className="text-[11px] text-foreground">Shopify revenue is up 14% this week — worth a LinkedIn post</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span className="text-[11px] text-foreground">All connected integrations are syncing correctly</span>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">CHIEF</span>
                <p className="text-xs text-foreground leading-relaxed">
                  I'll surface your priorities every morning, draft responses in your voice, and handle what doesn't need you. You focus on the decisions that matter.
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">SHANE</span>
                <p className="text-xs text-foreground">What should I do first?</p>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">CHIEF</span>
                <p className="text-xs text-foreground leading-relaxed">
                  Approve the onboarding checklist I've prepared for your first week. It'll take 10 minutes and set up your entire operating rhythm.
                </p>
              </div>
            </div>

            <button onClick={() => navigate("/dashboard")} className="w-full bg-primary text-primary-foreground text-base font-bold py-4 rounded-lg hover:bg-primary/90 transition-colors">
              Enter MYTHOS HQ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
