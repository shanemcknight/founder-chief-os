import { useState, useRef, useEffect } from "react";
import { Send, Mail, MessageCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

const SUPPORT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-support`;

const OPENING_MESSAGE = `Hi! I'm the MythosHQ Customer Support Agent. I'm here to help you get the most out of MythosHQ.

I can help with:
- Setting up your email integrations (Gmail + Outlook)
- Deploying and configuring your agents
- Understanding your plan and billing
- Using any of the 8 pillars — INBOX, SOCIAL, SALES, REPORTS, AGENTS, COMMAND, PUBLISH, BUILD
- Connecting your tools — Shopify, QuickBooks, LinkedIn, and more
- Troubleshooting anything that isn't working

What do you need help with today?`;

const ESCALATION_KEYWORDS = [
  "human", "person", "frustrated", "broken", "escalate", "billing",
  "refund", "cancel", "speak to", "not working", "help me",
];

type Msg = { role: "user" | "assistant"; content: string; escalate?: boolean };

function AgentAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
      <MessageCircle size={14} className="text-primary" />
    </div>
  );
}

export default function SupportPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: OPENING_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const escalate = ESCALATION_KEYWORDS.some((k) => text.toLowerCase().includes(k));
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "", escalate }]);
    setSending(true);

    try {
      const resp = await fetch(SUPPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("Failed to reach support");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (typeof c === "string") {
              acc += c;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc, escalate };
                return copy;
              });
            }
          } catch {
            /* partial */
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Sorry — I hit a snag reaching the support brain. Email **hello@mythoshq.io** and our team will jump in.",
          escalate: true,
        };
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={20} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">MythosHQ Support</h1>
          <p className="text-sm text-muted-foreground">AI-powered support · Always available</p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[11px] text-success">Online</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div ref={scrollRef} className="min-h-[400px] max-h-[60vh] overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === "assistant" ? (
                  <div className="flex gap-3 items-start">
                    <AgentAvatar />
                    <div className="flex-1 min-w-0">
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-foreground max-w-[85%] prose prose-sm prose-invert max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_strong]:text-foreground">
                        {m.content ? (
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        ) : (
                          <span className="inline-flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
                          </span>
                        )}
                      </div>
                      {m.escalate && m.content && (
                        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mt-2 max-w-[85%]">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">Want to talk to a human?</p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Our team typically responds within a few hours.
                              </p>
                              <button
                                onClick={() =>
                                  window.open(
                                    "mailto:hello@mythoshq.io?subject=MythosHQ Support Request",
                                    "_blank",
                                  )
                                }
                                className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg mt-3 inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                              >
                                <Mail size={12} />
                                Email our Support Team →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground max-w-[85%] whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4 flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything about MythosHQ..."
              rows={2}
              className="resize-none flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 min-h-0"
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="bg-primary p-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} className="text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
