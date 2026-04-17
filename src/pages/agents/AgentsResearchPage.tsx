import { useEffect, useRef, useState } from "react";
import { Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { streamAgentChat } from "@/lib/agentChat";
import { RESEARCH_AGENT_ID } from "@/lib/agents";
import { useReports, type Report } from "@/contexts/ReportsContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "What are the fastest growing beverage trends in the US for 2026?",
  "Analyze the competitive landscape for craft cocktail mixers",
  "What should I know about selling to Whole Foods as a small CPG brand?",
  "How are independent restaurants using AI in their operations right now?",
  "What are the best practices for Amazon listing optimization in 2026?",
];

type Phase = "empty" | "researching" | "result";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function readTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

export default function AgentsResearchPage() {
  const { reports, createReport, refreshReports } = useReports();
  const researchReports = reports.filter((r) => r.category === "research");

  const [phase, setPhase] = useState<Phase>("empty");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [reportTitle, setReportTitle] = useState<string>("");
  const [reportBody, setReportBody] = useState<string>("");
  const [reportDate, setReportDate] = useState<string>("");
  const [streamBuffer, setStreamBuffer] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [savedThisSession, setSavedThisSession] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Animate progress steps while researching
  useEffect(() => {
    if (phase !== "researching") {
      setProgressStep(0);
      return;
    }
    setProgressStep(1);
    const t1 = setTimeout(() => setProgressStep(2), 1000);
    const t2 = setTimeout(() => setProgressStep(3), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  const handleNewResearch = () => {
    setPhase("empty");
    setActiveId(null);
    setReportTitle("");
    setReportBody("");
    setReportDate("");
    setStreamBuffer("");
    setSavedThisSession(false);
    setInput("");
    setFollowUp("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const runResearch = async (question: string, isFollowUp = false) => {
    if (!question.trim() || streaming) return;
    const q = question.trim();
    if (isFollowUp) setFollowUp("");
    else setInput("");

    setStreaming(true);
    setStreamBuffer("");
    setReportTitle(q);
    setReportDate(new Date().toISOString());
    setSavedThisSession(false);
    setPhase("researching");

    // Create a transient conversation row so agent-chat can persist messages
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("Please sign in first");
      setStreaming(false);
      setPhase("empty");
      return;
    }
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .insert({
        user_id: userData.user.id,
        agent_id: RESEARCH_AGENT_ID,
        title: q.slice(0, 80),
      })
      .select("id")
      .single();
    if (convErr || !conv) {
      toast.error("Could not start research");
      setStreaming(false);
      setPhase("empty");
      return;
    }

    let buffer = "";
    await streamAgentChat(
      {
        conversationId: conv.id,
        agentId: RESEARCH_AGENT_ID,
        agentName: "RESEARCH",
        message: q,
      },
      {
        onDelta: (chunk) => {
          buffer += chunk;
          setStreamBuffer(buffer);
        },
        onError: (err) => {
          toast.error(err.message);
          setStreaming(false);
          setPhase("empty");
        },
        onDone: () => {
          setStreaming(false);
          if (buffer.trim()) {
            setReportBody(buffer);
            setPhase("result");
          } else {
            setPhase("empty");
          }
        },
      },
    );
  };

  const handleSaveToLibrary = async () => {
    if (!reportTitle || !reportBody) return;
    const created = await createReport({
      title: reportTitle,
      description: "Deep research report",
      category: "research",
      content: reportBody,
    });
    if (created) {
      toast.success("Saved to Reports Library");
      setSavedThisSession(true);
      setActiveId(created.id);
      refreshReports();
    } else {
      toast.error("Could not save report");
    }
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(`${reportTitle}\n\n${reportBody}`);
      toast.success("Report copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const openSavedReport = (r: Report) => {
    setActiveId(r.id);
    setReportTitle(r.title);
    setReportBody(r.content || "");
    setReportDate(r.created_at);
    setSavedThisSession(true);
    setPhase("result");
  };

  // Render markdown-ish content into sections + sources
  const rendered = renderReport(reportBody);

  return (
    <div className="h-full min-h-0 -m-4 md:-m-6 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-2">
          <Brain size={20} className="text-primary mt-0.5" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Deep Research</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Always deep. Always cited. Saved to your Reports Library.
            </p>
          </div>
        </div>
        <button
          onClick={handleNewResearch}
          className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          New Research
        </button>
      </div>

      {/* Two columns */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* History */}
        <div className="w-[260px] shrink-0 flex flex-col">
          <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Previous Research
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {researchReports.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center mt-8">
                No research yet. Ask your first question below.
              </p>
            )}
            {researchReports.map((r) => {
              const isActive = r.id === activeId;
              return (
                <button
                  key={r.id}
                  onClick={() => openSavedReport(r)}
                  className={cn(
                    "w-full text-left bg-card border rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(r.created_at)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {phase === "empty" && (
            <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full pb-6">
              <div className="text-center">
                <Brain size={48} className="text-primary/30 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground">What do you need to know?</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 mb-8">
                  Deep Research reads across multiple sources, synthesizes what matters, and delivers a cited report — not a chat bubble.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-w-lg mx-auto mb-8 w-full">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setInput(p)}
                    className="bg-card border border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary/40 text-xs text-foreground text-left transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="bg-background border border-border rounded-xl p-4 max-w-lg mx-auto w-full">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={3}
                  placeholder="Ask anything — markets, competitors, trends, strategy..."
                  className="w-full resize-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded-md p-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runResearch(input);
                  }}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>Deep mode</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
                    <span>Web search</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground" />
                    <span>Cited sources</span>
                  </div>
                  <button
                    onClick={() => runResearch(input)}
                    disabled={!input.trim()}
                    className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Research →
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "researching" && (
            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
              <div className="bg-card border border-border rounded-xl p-6 w-full">
                <Brain size={24} className="text-primary animate-pulse" />
                <p className="text-sm font-semibold text-foreground mt-3">Researching...</p>
                <div className="space-y-1.5 mt-3">
                  {progressStep >= 1 && (
                    <p className="text-[11px] text-muted-foreground">● Searching across sources...</p>
                  )}
                  {progressStep >= 2 && (
                    <p className="text-[11px] text-muted-foreground">● Reading and synthesizing...</p>
                  )}
                  {progressStep >= 3 && (
                    <p className="text-[11px] text-muted-foreground">● Building your report...</p>
                  )}
                </div>
                {streamBuffer && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
                    <p className="text-[11px] text-muted-foreground whitespace-pre-wrap line-clamp-6">
                      {streamBuffer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === "result" && (
            <div className="max-w-3xl mx-auto w-full">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <h2 className="text-base font-bold text-foreground">{reportTitle}</h2>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-1">
                    <Brain size={12} />
                    <span>Deep Research</span>
                    <span>·</span>
                    <span>{reportDate ? formatDate(reportDate) : ""}</span>
                    <span>·</span>
                    <span>{readTime(reportBody)}</span>
                  </div>
                </div>

                <div className="px-6 py-5">
                  {rendered.sections.map((s, i) => (
                    <div key={i} className="mb-4">
                      {s.heading && (
                        <h3 className="text-sm font-semibold text-foreground mb-2">{s.heading}</h3>
                      )}
                      {s.paragraphs.map((p, j) => (
                        <p
                          key={j}
                          className="text-sm text-foreground leading-relaxed mb-3"
                          dangerouslySetInnerHTML={{ __html: highlightFootnotes(p) }}
                        />
                      ))}
                    </div>
                  ))}

                  {rendered.sources.length > 0 && (
                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Sources
                      </h4>
                      <ol className="space-y-1.5">
                        {rendered.sources.map((src, i) => (
                          <li key={i} className="text-[11px] text-foreground">
                            <span className="text-muted-foreground mr-1.5">[{i + 1}]</span>
                            {src.url ? (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                {src.label || src.url}
                              </a>
                            ) : (
                              <span>{src.label}</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-5 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleSaveToLibrary}
                    disabled={savedThisSession}
                    className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {savedThisSession ? "Saved ✓" : "Save to Reports Library"}
                  </button>
                  <button
                    onClick={handleCopyReport}
                    className="border border-border text-foreground text-xs px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    Copy Report
                  </button>
                  <button
                    onClick={handleNewResearch}
                    className="border border-border text-foreground text-xs px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    New Research
                  </button>
                </div>
              </div>

              {/* Follow-up */}
              <div className="bg-background border border-border rounded-xl p-4 mt-4">
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  rows={2}
                  placeholder="Ask a follow-up question..."
                  className="w-full resize-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded-md p-1"
                />
                <div className="flex items-center justify-end mt-2">
                  <button
                    onClick={() => runResearch(followUp, true)}
                    disabled={!followUp.trim() || streaming}
                    className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Go →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Lightweight markdown-ish parser for research reports ---

type ParsedSection = { heading: string | null; paragraphs: string[] };
type ParsedSource = { label: string; url: string | null };

function renderReport(text: string): { sections: ParsedSection[]; sources: ParsedSource[] } {
  if (!text) return { sections: [], sources: [] };

  // Split off "Sources" section if present
  const lines = text.split(/\r?\n/);
  let sourcesIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(#+\s*)?sources\s*:?\s*$/i.test(lines[i])) {
      sourcesIdx = i;
      break;
    }
  }

  const bodyLines = sourcesIdx === -1 ? lines : lines.slice(0, sourcesIdx);
  const sourceLines = sourcesIdx === -1 ? [] : lines.slice(sourcesIdx + 1);

  // Build sections
  const sections: ParsedSection[] = [];
  let current: ParsedSection = { heading: null, paragraphs: [] };
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length) {
      current.paragraphs.push(buffer.join(" ").trim());
      buffer = [];
    }
  };

  const flushSection = () => {
    flushBuffer();
    if (current.heading || current.paragraphs.length) sections.push(current);
    current = { heading: null, paragraphs: [] };
  };

  for (const raw of bodyLines) {
    const line = raw.trim();
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/) || line.match(/^\*\*(.+?)\*\*\s*:?$/);
    if (headingMatch) {
      flushSection();
      current.heading = headingMatch[1].trim();
      continue;
    }
    if (!line) {
      flushBuffer();
      continue;
    }
    buffer.push(line);
  }
  flushSection();

  // Parse sources: "[1] Label — url" / "1. Label - url" / bare urls
  const sources: ParsedSource[] = [];
  for (const raw of sourceLines) {
    const line = raw.trim();
    if (!line) continue;
    const cleaned = line.replace(/^\[?\d+\]?\.?\s*/, "");
    const urlMatch = cleaned.match(/(https?:\/\/[^\s)]+)/);
    const url = urlMatch ? urlMatch[1] : null;
    let label = cleaned;
    if (url) label = cleaned.replace(url, "").replace(/[—\-–]\s*$/, "").trim() || url;
    sources.push({ label, url });
  }

  return { sections, sources };
}

function highlightFootnotes(html: string) {
  // escape HTML
  const escaped = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // [n] -> superscript styled
  return escaped.replace(/\[(\d+)\]/g, '<sup class="text-primary text-[10px]">[$1]</sup>');
}
