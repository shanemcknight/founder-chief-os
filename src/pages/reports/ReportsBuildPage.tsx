import { useState } from "react";
import { FileSpreadsheet, Send, Download, ExternalLink, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/contexts/ReportsContext";
import { toast } from "sonner";

type ChatMsg = { id: string; role: "user" | "agent"; content: string };
type BuildSpec = { fileName: string; sheets: { name: string; rows: (string | number | null)[][] }[]; formulas: string[] };
type BuildResult = { fileName: string; base64: string; rowCount: number; colCount: number; formulas: string[] };

const SYSTEM_INSTRUCTION = `You are an Excel specialist. When the user asks for a spreadsheet, respond with TWO parts:
1. A short plain-text explanation (1-3 sentences) of what you built.
2. A JSON spec wrapped in [[BUILD]] ... [[/BUILD]] tags.

The JSON shape:
{ "fileName": "report.xlsx", "sheets": [{ "name": "Sheet1", "rows": [["Header1","Header2"],["A",1]] }], "formulas": ["=SUM(A1:A10) — totals column A"] }

Use Excel formula strings (starting with =) directly in cell values where appropriate. Keep names <= 31 chars. If the user asks a clarifying question or just chats, respond normally without [[BUILD]] tags.`;

export default function ReportsBuildPage() {
  const { user } = useAuth();
  const { createReport, createFormula } = useReports();
  const [convId, setConvId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatMsg[]>([
    {
      id: "intro",
      role: "agent",
      content: "I'm your Excel specialist. Tell me what you need and I'll build it.\n\nExamples:\n• Product costing template for 12 SKUs with variable ingredients\n• Monthly P&L with YoY comparison columns\n• Inventory tracker with reorder alerts\n• Cash flow forecast for next 6 months",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const [current, setCurrent] = useState<BuildResult | null>(null);
  const [history, setHistory] = useState<BuildResult[]>([]);

  const ensureConv = async (): Promise<string | null> => {
    if (convId) return convId;
    if (!user) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, agent_id: "00000000-0000-0000-0000-000000000002", title: "Excel build session" })
      .select("id")
      .single();
    if (error || !data) { toast.error("Could not start session"); return null; }
    setConvId(data.id);
    return data.id;
  };

  const parseBuildSpec = (text: string): BuildSpec | null => {
    const m = text.match(/\[\[BUILD\]\]([\s\S]*?)\[\[\/BUILD\]\]/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  };

  const generateXlsx = async (spec: BuildSpec): Promise<BuildResult | null> => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) return null;
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reports-build-xlsx`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sheets: spec.sheets, fileName: spec.fileName }),
      });
      if (!resp.ok) { toast.error("Build failed"); return null; }
      const data = await resp.json();
      return { ...data, formulas: spec.formulas || [] };
    } catch { return null; }
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const cId = await ensureConv();
    if (!cId) return;

    const userText = input.trim();
    setInput("");
    setThread((p) => [...p, { id: `u-${Date.now()}`, role: "user", content: userText }]);
    setStreaming(true);
    setStreamBuf("");

    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) { setStreaming(false); return; }

    const augmented = `${SYSTEM_INSTRUCTION}\n\nUser: ${userText}`;

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: cId, agentId: "00000000-0000-0000-0000-000000000002", agentName: "CHIEF", message: augmented }),
      });
      if (!resp.ok || !resp.body) { toast.error("Build failed"); setStreaming(false); return; }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (typeof c === "string") { full += c; setStreamBuf((p) => p + c); }
          } catch { /* partial */ }
        }
      }
      const spec = parseBuildSpec(full);
      const cleanText = spec ? full.replace(/\[\[BUILD\]\][\s\S]*?\[\[\/BUILD\]\]/, "").trim() : full;
      setThread((p) => [...p, { id: `a-${Date.now()}`, role: "agent", content: cleanText || "Building..." }]);
      setStreamBuf("");
      setStreaming(false);

      if (spec) {
        const result = await generateXlsx(spec);
        if (result) {
          if (current) setHistory((h) => [current, ...h].slice(0, 5));
          setCurrent(result);
          toast.success("File ready");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Build error");
      setStreaming(false);
    }
  };

  const downloadXlsx = (result: BuildResult) => {
    const bin = atob(result.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToLibrary = async () => {
    if (!current || !user) return;
    const path = `${user.id}/${crypto.randomUUID()}-${current.fileName}`;
    const bin = atob(current.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const { error } = await supabase.storage.from("reports").upload(path, blob);
    if (error) { toast.error("Save failed"); return; }
    const { data: signed } = await supabase.storage.from("reports").createSignedUrl(path, 60 * 60 * 24 * 365);
    await createReport({
      title: current.fileName.replace(/\.xlsx?$/i, ""),
      description: "Built with AI",
      category: "Custom",
      file_url: signed?.signedUrl || null,
      file_name: current.fileName,
      file_type: "xlsx",
    });
    toast.success("Saved to Library");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground">Build</h1>
        <p className="text-sm text-muted-foreground mt-1">Describe what you need. Your agent builds it.</p>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-220px)]">
        {/* LEFT — conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-300px)] space-y-3">
            {thread.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary/15 border border-primary/30 text-foreground" : "bg-muted/30 text-foreground"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-muted/30 rounded-xl px-3 py-2.5 text-xs whitespace-pre-wrap text-foreground">
                  {streamBuf || "Building your file..."}{streamBuf && <span className="animate-pulse">▋</span>}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Describe the spreadsheet you need..."
              disabled={streaming}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Send size={12} /> Send
            </button>
          </div>
        </div>

        {/* RIGHT — output */}
        <div className="w-[360px] shrink-0 bg-card border border-border rounded-xl p-5 self-start">
          <h3 className="text-sm font-semibold text-foreground mb-4">Current Build</h3>
          {!current ? (
            <p className="text-xs text-muted-foreground text-center py-12">Your built file will appear here</p>
          ) : (
            <div>
              <div className="text-center mb-4">
                <FileSpreadsheet size={32} className="text-primary mx-auto" />
                <p className="text-sm font-semibold text-foreground mt-2">{current.fileName}</p>
                <p className="text-[11px] text-muted-foreground">{current.rowCount} rows · {current.colCount} cols</p>
              </div>
              <div className="space-y-2">
                <button onClick={() => downloadXlsx(current)} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 inline-flex items-center justify-center gap-1.5">
                  <Download size={14} /> Download as Excel (.xlsx)
                </button>
                <button onClick={() => window.open("https://sheets.new", "_blank")} className="w-full border border-border text-foreground py-2.5 rounded-lg text-sm hover:bg-muted/30 inline-flex items-center justify-center gap-1.5">
                  <ExternalLink size={14} /> Open in Google Sheets
                </button>
                <button onClick={saveToLibrary} className="w-full bg-muted/30 text-foreground py-2.5 rounded-lg text-sm hover:bg-muted/50 inline-flex items-center justify-center gap-1.5">
                  <Save size={14} /> Save to Library
                </button>
              </div>
              {current.formulas?.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Formulas used</p>
                  <ul className="space-y-1.5">
                    {current.formulas.map((f, i) => {
                      const [head, ...rest] = f.split("—");
                      return (
                        <li key={i} className="text-[11px] text-foreground flex items-start justify-between gap-2">
                          <span className="flex-1 font-mono">{head.trim()}</span>
                          <button
                            onClick={async () => {
                              await createFormula({ title: rest.join("—").trim() || head.trim(), formula: head.trim(), plain_english: rest.join("—").trim(), category: "Custom" });
                              toast.success("Saved to Vault");
                            }}
                            className="text-primary text-[10px] shrink-0 hover:underline"
                          >
                            Save to Vault
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Previous builds</p>
              <ul className="space-y-1.5">
                {history.map((h, i) => (
                  <li key={i} className="text-[11px] text-foreground flex items-center justify-between gap-2">
                    <span className="flex-1 truncate">{h.fileName}</span>
                    <button onClick={() => downloadXlsx(h)} className="text-primary hover:underline text-[10px]">Download</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
