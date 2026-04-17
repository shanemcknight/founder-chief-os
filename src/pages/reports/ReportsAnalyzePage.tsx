import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, Send, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/contexts/ReportsContext";
import { toast } from "sonner";

const QUICK_ACTIONS = [
  "Summarize this file",
  "Show me the P&L",
  "Find the top 10 products by margin",
  "Identify anomalies",
  "Build a dashboard from this",
];

type ChatMsg = { id: string; role: "user" | "agent"; content: string };

export default function ReportsAnalyzePage() {
  const { user } = useAuth();
  const { createReport } = useReports();
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setThread([]);
    // Read preview content for text/CSV; for binary just use filename
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (ext === "csv" || ext === "txt") {
      const text = await f.text();
      setFilePreview(text.slice(0, 8000));
    } else {
      setFilePreview(`[Binary ${ext.toUpperCase()} file: ${f.name}, ${(f.size / 1024).toFixed(1)} KB]`);
    }
  };

  const ensureConversation = async (): Promise<string | null> => {
    if (convId) return convId;
    if (!user) return null;
    // Use CHIEF agent (well-known id) — find any agent_id from existing convo or use a placeholder
    const agentId = "00000000-0000-0000-0000-000000000001";
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, agent_id: agentId, title: `Analyze: ${file?.name || "file"}` })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Could not start analysis session");
      return null;
    }
    setConvId(data.id);
    return data.id;
  };

  const send = async (text: string) => {
    if (!text.trim() || streaming || !file) return;
    const cId = await ensureConversation();
    if (!cId) return;

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: text };
    setThread((p) => [...p, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamBuf("");

    const messageWithContext = `I have uploaded a file: ${file.name}\n\nFile contents (first 8KB):\n${filePreview}\n\n---\nMy question: ${text}`;

    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) { setStreaming(false); return; }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: cId, agentId: "00000000-0000-0000-0000-000000000001", agentName: "CHIEF", message: messageWithContext }),
      });
      if (!resp.ok || !resp.body) {
        toast.error("Analysis failed");
        setStreaming(false);
        return;
      }
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
            if (typeof c === "string") {
              full += c;
              setStreamBuf((p) => p + c);
            }
          } catch { /* partial */ }
        }
      }
      setThread((p) => [...p, { id: `a-${Date.now()}`, role: "agent", content: full }]);
      setStreamBuf("");
      setStreaming(false);
    } catch (e) {
      console.error(e);
      toast.error("Analysis error");
      setStreaming(false);
    }
  };

  const saveAnalysis = async () => {
    if (thread.length === 0 || !file) return;
    const content = thread.map((m) => `**${m.role === "user" ? "You" : "Agent"}:** ${m.content}`).join("\n\n");
    await createReport({
      title: `Analysis: ${file.name}`,
      description: `Analysis of ${file.name}`,
      category: "Custom",
      content,
      file_name: file.name,
    });
    toast.success("Saved to Library");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground">Analyze</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a file to get started</p>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          className={cn(
            "border-dashed border-2 rounded-2xl p-16 text-center bg-muted/10 transition-colors",
            drag ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <FileSpreadsheet size={48} className="text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">Drop your Excel, CSV, QuickBooks export, or PDF</p>
          <p className="text-[11px] text-muted-foreground mb-5">Supports .xlsx .xls .csv .pdf</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 mb-4">
            <FileSpreadsheet size={18} className="text-primary" />
            <span className="text-sm font-medium text-foreground flex-1 truncate">{file.name}</span>
            <span className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
            <button
              onClick={() => { setFile(null); setThread([]); setConvId(null); setFilePreview(""); }}
              className="text-xs text-primary hover:underline"
            >
              Change file
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={streaming}
                className="border border-border text-xs text-foreground px-3 py-2 rounded-lg hover:bg-muted/30 hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 mb-4 min-h-[300px] max-h-[500px] overflow-y-auto">
            {thread.length === 0 && !streaming && (
              <p className="text-xs text-muted-foreground italic text-center py-8">
                Ask a question or pick a quick action above to start analyzing.
              </p>
            )}
            <div className="space-y-3">
              {thread.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-primary/15 border border-primary/30 text-foreground"
                      : "bg-muted/30 text-foreground"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {streaming && streamBuf && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-muted/30 rounded-xl px-3 py-2.5 text-xs whitespace-pre-wrap text-foreground">
                    {streamBuf}<span className="animate-pulse">▋</span>
                  </div>
                </div>
              )}
              {streaming && !streamBuf && (
                <p className="text-xs text-muted-foreground italic">Analyzing...</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
              placeholder="Ask anything about this file..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Send size={12} /> Send
            </button>
            {thread.length > 0 && (
              <button
                onClick={saveAnalysis}
                className="border border-border text-foreground px-3 py-2.5 rounded-lg text-xs hover:bg-muted/30 inline-flex items-center gap-1.5"
              >
                <Save size={12} /> Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
