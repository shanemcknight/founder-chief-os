import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Brain, Users, ChevronRight, CheckCircle2, Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PROMPT =
  "You are Chief, an AI Chief of Staff for my business. You think like a co-founder, operate like a chief of staff, and execute like a senior operator. You protect my time ruthlessly, think in systems not tasks, and bias toward action. Every interaction should either deliver a decision-ready insight or remove something from my plate. Never create more work than you eliminate.";

const STEP_LABELS = ["Connect Inbox", "Deploy Agent", "Invite Team"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Step 1
  const [connecting, setConnecting] = useState<"outlook" | "gmail" | null>(null);
  const [inboxConnected, setInboxConnected] = useState(false);

  // Step 2
  const [agentName, setAgentName] = useState("Chief");
  const [showPrompt, setShowPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [deploying, setDeploying] = useState(false);
  const [agentDeployed, setAgentDeployed] = useState(false);

  // Step 3
  const [inviteEmail, setInviteEmail] = useState("");

  const advanceTo = (next: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    setStep(next);
  };

  // ---------- Step 1 — connect inbox ----------
  const connectProvider = async (provider: "outlook" | "gmail") => {
    if (!user) return;
    setConnecting(provider);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("You must be logged in to connect");
        return;
      }
      const sessionRes = await supabase.functions.invoke("create-nango-session", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (sessionRes.error) {
        toast.error("Failed to create connection session");
        return;
      }
      const connectSessionToken = sessionRes.data?.token;
      if (!connectSessionToken) {
        toast.error("No session token returned from server");
        return;
      }
      const { default: Nango } = await import("@nangohq/frontend");
      const nango = new Nango({ connectSessionToken });
      const integrationId = provider === "outlook" ? "microsoft" : "google-mail";
      const result = await nango.auth(integrationId);

      const { error: insertError } = await supabase.from("email_accounts").insert({
        user_id: user.id,
        provider,
        nango_connection_id: result.connectionId,
        email_address: result.connectionId,
        display_name: provider === "outlook" ? "Outlook" : "Gmail",
      });
      if (insertError) {
        toast.error(insertError.message || "Failed to save connection");
        return;
      }
      setInboxConnected(true);
      toast.success("Inbox connected");
      setTimeout(() => advanceTo(1), 1500);
    } catch (err: any) {
      toast.error(err?.message || `Failed to connect ${provider}`);
    } finally {
      setConnecting(null);
    }
  };

  // ---------- Step 2 — deploy agent ----------
  const deployAgent = async () => {
    if (!user) return;
    setDeploying(true);
    try {
      const { error } = await supabase.from("conversations").insert({
        user_id: user.id,
        title: `${agentName} — General`,
        agent_id: crypto.randomUUID(),
      });
      if (error) {
        toast.error(error.message || "Failed to deploy agent");
        setDeploying(false);
        return;
      }
      setTimeout(() => {
        setDeploying(false);
        setAgentDeployed(true);
        setTimeout(() => advanceTo(2), 1500);
      }, 1000);
    } catch (err: any) {
      setDeploying(false);
      toast.error(err?.message || "Failed to deploy agent");
    }
  };

  // ---------- Step 3 — finish ----------
  const finishOnboarding = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("user_id", user.id);
    }
    navigate("/dashboard");
  };

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    toast.success("Invite sent");
    setInviteEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 pb-12">
        {/* Logo */}
        <h1 className="text-sm font-bold text-foreground text-center pt-12">MYTHOS HQ</h1>

        {/* Progress */}
        <div className="mt-8">
          <div className="flex items-center">
            {STEP_LABELS.map((_, i) => {
              const done = completedSteps.has(i) && i !== step;
              const active = i === step;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${
                      done
                        ? "bg-success"
                        : active
                        ? "bg-primary"
                        : "bg-muted border border-border"
                    }`}
                  >
                    {done && <Check size={8} className="text-success-foreground" strokeWidth={3} />}
                  </div>
                  {i < STEP_LABELS.length - 1 && <div className="h-px bg-border flex-1 mx-2" />}
                </div>
              );
            })}
          </div>
          <div className="flex items-center mt-2">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={`flex-1 ${i === STEP_LABELS.length - 1 ? "flex-none" : ""}`}>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step card */}
        <div className="bg-card border border-border rounded-xl p-8 mt-8">
          {/* STEP 1 */}
          {step === 0 && (
            <div>
              {inboxConnected ? (
                <div className="flex flex-col items-center py-6">
                  <CheckCircle2 size={32} className="text-success mb-3" />
                  <p className="text-base font-semibold text-success text-center">Inbox connected!</p>
                </div>
              ) : (
                <>
                  <Mail size={40} className="text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-foreground text-center">Connect your inbox</h2>
                  <p className="text-sm text-muted-foreground text-center mb-6 mt-2">
                    MythosHQ reads your email so your agent can triage, prioritize, and draft replies for you.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => connectProvider("outlook")}
                      disabled={connecting !== null}
                      className="w-full flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Mail size={20} className="text-[#0078D4] shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground">Microsoft Outlook</p>
                        <p className="text-xs text-muted-foreground">Office 365, Outlook.com</p>
                      </div>
                      {connecting === "outlook" ? (
                        <Loader2 size={16} className="text-muted-foreground animate-spin" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </button>

                    <button
                      onClick={() => connectProvider("gmail")}
                      disabled={connecting !== null}
                      className="w-full flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        G
                      </span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-foreground">Gmail</p>
                        <p className="text-xs text-muted-foreground">Gmail, Google Workspace</p>
                      </div>
                      {connecting === "gmail" ? (
                        <Loader2 size={16} className="text-muted-foreground animate-spin" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => advanceTo(1)}
                    className="text-xs text-muted-foreground hover:text-foreground text-center block mt-4 cursor-pointer w-full"
                  >
                    Skip for now — I'll connect later
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div>
              {agentDeployed ? (
                <div className="flex flex-col items-center py-6">
                  <Sparkles size={32} className="text-success mb-3" />
                  <p className="text-base font-semibold text-success text-center">Your agent is live!</p>
                </div>
              ) : (
                <>
                  <Brain size={40} className="text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-foreground text-center">Deploy your first agent</h2>
                  <p className="text-sm text-muted-foreground text-center mb-6 mt-2">
                    Your agent thinks like a chief of staff — triaging your inbox, drafting replies, and surfacing what needs your attention.
                  </p>

                  <label className="text-xs font-medium text-foreground mb-1 block">Agent Name</label>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPrompt((v) => !v)}
                    className="text-xs text-primary cursor-pointer mt-3 block"
                  >
                    Customize instructions {showPrompt ? "↑" : "↓"}
                  </button>
                  {showPrompt && (
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="bg-background border border-border rounded-lg p-3 text-xs resize-none min-h-[120px] w-full focus:outline-none focus:ring-1 focus:ring-primary mt-2 text-foreground"
                    />
                  )}

                  <button
                    onClick={deployAgent}
                    disabled={deploying || !agentName.trim()}
                    className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 mt-6 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deploying ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Deploying…
                      </>
                    ) : (
                      "Deploy Agent →"
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div>
              <Users size={40} className="text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground text-center">Invite your team</h2>
              <p className="text-sm text-muted-foreground text-center mb-6 mt-2">
                Add teammates so they can collaborate with your agents.
              </p>

              <div className="flex">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={sendInvite}
                  className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary/90 ml-2 transition-colors"
                >
                  Send Invite
                </button>
              </div>

              <button
                onClick={finishOnboarding}
                className="w-full border border-border text-sm font-semibold py-3 rounded-lg hover:bg-muted/30 mt-4 text-foreground transition-colors"
              >
                Go to Dashboard →
              </button>

              <button
                onClick={finishOnboarding}
                className="text-xs text-muted-foreground hover:text-foreground text-center block mt-3 cursor-pointer w-full"
              >
                Skip — go to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
