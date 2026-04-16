import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Sparkles, Info, CheckCircle2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const stepLabels = ["Choose Model", "Configure", "Connect Integrations", "Choose Channels"];

const models = [
  { name: "GPT-4o", provider: "OpenAI", desc: "Best for email, outreach, and complex reasoning", latency: "~40ms", cost: "$$", badge: null },
  { name: "Claude 3.5 Sonnet", provider: "Anthropic", desc: "Best for long-form content, nuanced writing, publishing", latency: "~55ms", cost: "$$", badge: null },
  { name: "Gemini Pro", provider: "Google", desc: "Best for research, data analysis, multi-step tasks", latency: "~48ms", cost: "$", badge: null },
  { name: "Llama 3 (Local)", provider: "Local", desc: "Runs on your own hardware via MYTHOS Node. Private, fast, free.", latency: "~12ms", cost: "Free", badge: "OLYMPUS" },
];

const integrationsList = [
  { name: "Gmail", defaultOn: true },
  { name: "Shopify", defaultOn: false },
  { name: "Amazon", defaultOn: false },
  { name: "Klaviyo", defaultOn: true },
  { name: "LinkedIn", defaultOn: true },
  { name: "Slack", defaultOn: true },
  { name: "CRM", defaultOn: true },
  { name: "QuickBooks", defaultOn: false },
];

const channels = [
  { name: "MYTHOS Dashboard", desc: "Always active in your dashboard", locked: true, defaultOn: true },
  { name: "Slack", desc: "Agent will respond in your connected Slack workspace", locked: false, defaultOn: false },
  { name: "Telegram", desc: "Agent responds via Telegram bot", locked: false, defaultOn: false },
  { name: "Discord", desc: "Agent responds in your Discord server", locked: false, defaultOn: false },
  { name: "API Endpoint", desc: "Unique URL — https://api.mythoshq.io/agents/[id]/chat", locked: false, defaultOn: false },
  { name: "Web Widget", desc: "Embed a chat widget on any website", locked: false, defaultOn: false },
];

export default function AgentDeployPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Record<string, boolean>>(
    Object.fromEntries(integrationsList.map((i) => [i.name, i.defaultOn]))
  );
  const [channelState, setChannelState] = useState<Record<string, boolean>>(
    Object.fromEntries(channels.map((c) => [c.name, c.defaultOn]))
  );
  const [deployed, setDeployed] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [hasByokKey, setHasByokKey] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImportSoul = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setSystemPrompt(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("anthropic_api_key")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.anthropic_api_key) setHasByokKey(true);
      });
  }, [user]);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleDeploy = () => {
    setDeployed(true);
    setConfetti(true);
  };

  useEffect(() => {
    if (confetti) {
      const t = setTimeout(() => setConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confetti]);

  const activeIntegrations = Object.entries(integrations).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Close */}
        <button onClick={() => navigate(-1)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
          <X size={18} />
        </button>

        {/* Confetti */}
        {confetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}%`,
                  backgroundColor: ["#5D9992", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"][i % 5],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="p-6">
          {/* Success state */}
          {deployed ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Agent deployed. Hermes is live.</h2>
              <p className="text-sm text-muted-foreground">Your agent is now active and listening on the channels you selected.</p>
              <div className="flex items-center justify-center gap-3 pt-4">
                <button onClick={() => navigate("/chief")} className="text-sm font-semibold bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
                  View Agent
                </button>
                <button onClick={() => navigate("/dashboard")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground mb-1">Deploy a New Agent</h2>
                <div className="flex items-center gap-1 mb-3">
                  {stepLabels.map((label, i) => (
                    <div key={label} className="flex items-center gap-1 flex-1">
                      <div className={`h-1.5 rounded-full flex-1 transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Step {step + 1} of 4: {stepLabels[step]}</p>
              </div>

              {/* STEP 1 — Choose Model */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {models.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setSelectedModel(m.name)}
                        className={`bg-background border rounded-xl p-4 text-left transition-colors ${
                          selectedModel === m.name ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-muted-foreground">{m.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-bold text-foreground">{m.name}</h3>
                              {m.badge && <span className="text-[8px] font-bold bg-warning/15 text-warning px-1.5 py-0.5 rounded">{m.badge}</span>}
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{m.desc}</p>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-muted-foreground">Latency: <span className="text-foreground font-medium">{m.latency}</span></span>
                          <span className="text-muted-foreground">Cost: <span className="text-foreground font-medium">{m.cost}</span></span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {hasByokKey ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-emerald-400 font-medium">✓ Using your API key — all models unlocked</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border" style={{ borderColor: "#5D9992", backgroundColor: "rgba(93,153,146,0.06)" }}>
                      <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#5D9992" }} />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Unlock all models</span> —{" "}
                        {(() => {
                          const selected = models.find((m) => m.name === selectedModel);
                          const provider = selected && selected.provider !== "Local" ? selected.provider : null;
                          return provider
                            ? `Connect your ${provider} API key for this model in `
                            : "Connect your API key for this model in ";
                        })()}
                        <Link to="/settings" className="font-medium underline underline-offset-2" style={{ color: "#5D9992" }}>
                          Settings → Integrations
                        </Link>{" "}
                        to bypass token limits and use any model regardless of your plan.
                      </p>
                    </div>
                  )}
                  <button onClick={next} disabled={!selectedModel} className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">
                    Continue →
                  </button>
                </div>
              )}

              {/* STEP 2 — Configure */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Agent Name</label>
                    <input placeholder="e.g. Email Manager, Social Publisher, Outreach Bot" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-foreground">System Prompt</label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md border border-primary/30 hover:border-primary/50 bg-primary/5"
                      >
                        <Upload size={11} />
                        Import soul.md
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md,.txt,text/markdown,text/plain"
                        className="hidden"
                        onChange={handleImportSoul}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">Have an existing agent? Import their instruction file to pre-fill the prompt.</p>
                    <textarea
                      rows={6}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Describe your agent's role, tone, and instructions. Example: You are Chief's email assistant. You read incoming emails, score them by priority, and draft responses in Shane's voice — warm, direct, and always ending with 'Have the best day of your life.'"
                      className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-foreground">Creativity (Temperature)</label>
                      <span className="text-[11px] text-muted-foreground font-mono">0.7</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full accent-primary" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Precise</span><span>Creative</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={back} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                    <button onClick={next} className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 — Connect Integrations */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Which tools should this agent have access to?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {integrationsList.map((integ) => (
                      <button
                        key={integ.name}
                        onClick={() => setIntegrations((prev) => ({ ...prev, [integ.name]: !prev[integ.name] }))}
                        className={`bg-background border rounded-lg p-3 text-center transition-colors ${
                          integrations[integ.name] ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground">{integ.name.charAt(0)}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-foreground block">{integ.name}</span>
                        <span className={`text-[9px] font-medium ${integrations[integ.name] ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {integrations[integ.name] ? "ON" : "OFF"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {activeIntegrations.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      This agent will have access to: <span className="text-foreground font-medium">{activeIntegrations.join(", ")}</span>
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={back} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                    <button onClick={next} className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 — Choose Channels */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Where should this agent listen and respond?</p>
                  <div className="space-y-2">
                    {channels.map((ch) => (
                      <div key={ch.name} className={`flex items-center justify-between bg-background border rounded-lg p-3 transition-colors ${
                        channelState[ch.name] ? "border-primary/30" : "border-border"
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{ch.name}</span>
                            {ch.locked && <span className="text-[8px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">ALWAYS ON</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{ch.desc}</p>
                        </div>
                        <button
                          onClick={() => !ch.locked && setChannelState((prev) => ({ ...prev, [ch.name]: !prev[ch.name] }))}
                          className={`w-10 h-5 rounded-full relative transition-colors ${
                            channelState[ch.name] ? "bg-primary" : "bg-muted"
                          } ${ch.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            channelState[ch.name] ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={back} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                    <button onClick={handleDeploy} className="flex-1 bg-primary text-primary-foreground text-sm font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors">
                      Deploy Agent →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
