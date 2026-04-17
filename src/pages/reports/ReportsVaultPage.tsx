import { useMemo, useState } from "react";
import { Star, X, Copy, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReports, type Formula } from "@/contexts/ReportsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["All", "Lookup", "Financial", "Statistical", "Date", "Text", "Custom"];

export default function ReportsVaultPage() {
  const { formulas, createFormula, updateFormula, deleteFormula } = useReports();
  const [filter, setFilter] = useState("All");
  const [showExplain, setShowExplain] = useState(false);
  const [showBuild, setShowBuild] = useState(false);
  const [editing, setEditing] = useState<Formula | null>(null);

  const filtered = useMemo(() => {
    if (filter === "All") return formulas;
    return formulas.filter((f) => (f.category || "").toLowerCase() === filter.toLowerCase());
  }, [formulas, filter]);

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">Formula Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Your saved Excel formulas and snippets. Build once, reuse forever.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExplain(true)}
            className="border border-border text-foreground text-xs px-3 py-2 rounded-lg hover:bg-muted/30"
          >
            Explain a Formula
          </button>
          <button
            onClick={() => setShowBuild(true)}
            className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-lg hover:bg-primary/90"
          >
            Build a Formula
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 mt-4 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors",
              filter === c
                ? "bg-primary/15 text-primary border border-primary/30"
                : "border border-border text-muted-foreground hover:bg-muted/30"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((f) => (
          <div key={f.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase">{f.category || "Custom"}</span>
              <button onClick={() => updateFormula(f.id, { starred: !f.starred })} className="p-1 hover:bg-muted/30 rounded">
                <Star size={14} className={f.starred ? "text-warning fill-warning" : "text-muted-foreground"} />
              </button>
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1">{f.title}</h3>
            {f.plain_english && <p className="text-[11px] text-muted-foreground mt-1 mb-3">{f.plain_english}</p>}
            <div className="bg-background/80 rounded-lg px-3 py-2 font-mono text-[11px] text-primary break-all">{f.formula}</div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { navigator.clipboard.writeText(f.formula); toast.success("Copied"); }}
                className="text-[10px] text-foreground border border-border px-2 py-1 rounded hover:bg-muted/30 inline-flex items-center gap-1"
              >
                <Copy size={11} /> Copy
              </button>
              <button
                onClick={() => setEditing(f)}
                className="text-[10px] text-foreground border border-border px-2 py-1 rounded hover:bg-muted/30 inline-flex items-center gap-1"
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={() => { if (confirm("Delete this formula?")) deleteFormula(f.id); }}
                className="text-[10px] text-destructive border border-border px-2 py-1 rounded hover:bg-destructive/10 inline-flex items-center gap-1"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showExplain && <ExplainModal onClose={() => setShowExplain(false)} onSave={async (title, formula, plain) => { await createFormula({ title, formula, plain_english: plain, category: "Custom" }); toast.success("Saved to Vault"); setShowExplain(false); }} />}
      {showBuild && <BuildFormulaModal onClose={() => setShowBuild(false)} onSave={async (title, formula, plain) => { await createFormula({ title, formula, plain_english: plain, category: "Custom" }); toast.success("Saved to Vault"); setShowBuild(false); }} />}
      {editing && <EditModal formula={editing} onClose={() => setEditing(null)} onSave={async (patch) => { await updateFormula(editing.id, patch); toast.success("Updated"); setEditing(null); }} />}
    </div>
  );
}

async function callAgent(prompt: string): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) return "";
  // Create a one-shot conversation
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return "";
  const { data: conv } = await supabase
    .from("conversations")
    .insert({ user_id: userData.user.id, agent_id: "00000000-0000-0000-0000-000000000003", title: "Vault helper" })
    .select("id")
    .single();
  if (!conv) return "";
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ conversationId: conv.id, agentId: "00000000-0000-0000-0000-000000000003", agentName: "CHIEF", message: prompt }),
  });
  if (!resp.ok || !resp.body) return "";
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
        if (typeof c === "string") full += c;
      } catch { /* partial */ }
    }
  }
  return full;
}

function ExplainModal({ onClose, onSave }: { onClose: () => void; onSave: (title: string, formula: string, plain: string) => void }) {
  const [formula, setFormula] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    if (!formula.trim()) return;
    setLoading(true);
    const result = await callAgent(`Explain this Excel formula in 1-2 plain English sentences. Just the explanation, no preamble:\n\n${formula}`);
    setExplanation(result.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Explain a Formula</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <textarea
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="Paste your formula here, e.g. =VLOOKUP(A2,B:D,3,FALSE)"
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono mb-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <button onClick={explain} disabled={!formula.trim() || loading} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50 mb-3">
          {loading ? "Explaining..." : "Explain it"}
        </button>
        {explanation && (
          <>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-foreground mb-3 whitespace-pre-wrap">{explanation}</div>
            <button onClick={() => onSave(formula.slice(0, 40), formula, explanation)} className="w-full border border-border text-foreground py-2 rounded-lg text-xs hover:bg-muted/30">
              Save to Vault
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BuildFormulaModal({ onClose, onSave }: { onClose: () => void; onSave: (title: string, formula: string, plain: string) => void }) {
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState<{ formula: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const build = async () => {
    if (!desc.trim()) return;
    setLoading(true);
    const out = await callAgent(`Create an Excel formula for this need. Respond ONLY with this exact format:\nFORMULA: <the formula starting with =>\nEXPLANATION: <one short sentence>\n\nNeed: ${desc}`);
    const fMatch = out.match(/FORMULA:\s*(.+?)(?:\n|$)/);
    const eMatch = out.match(/EXPLANATION:\s*(.+?)(?:\n|$)/);
    if (fMatch) setResult({ formula: fMatch[1].trim(), explanation: eMatch?.[1].trim() || "" });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Build a Formula</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. Calculate the reorder point based on average daily sales and lead time"
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs mb-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <button onClick={build} disabled={!desc.trim() || loading} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50 mb-3">
          {loading ? "Building..." : "Build it"}
        </button>
        {result && (
          <>
            <div className="bg-background/80 rounded-lg p-3 font-mono text-[11px] text-primary mb-2 break-all">{result.formula}</div>
            {result.explanation && <p className="text-xs text-muted-foreground mb-3">{result.explanation}</p>}
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(result.formula); toast.success("Copied"); }} className="flex-1 border border-border text-foreground py-2 rounded-lg text-xs hover:bg-muted/30">Copy</button>
              <button onClick={() => onSave(desc.slice(0, 40), result.formula, result.explanation)} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-xs hover:bg-primary/90">Save to Vault</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditModal({ formula, onClose, onSave }: { formula: Formula; onClose: () => void; onSave: (patch: Partial<Formula>) => void }) {
  const [title, setTitle] = useState(formula.title);
  const [f, setF] = useState(formula.formula);
  const [plain, setPlain] = useState(formula.plain_english || "");
  const [cat, setCat] = useState(formula.category || "Custom");
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Edit Formula</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
          <textarea value={f} onChange={(e) => setF(e.target.value)} placeholder="Formula" rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          <textarea value={plain} onChange={(e) => setPlain(e.target.value)} placeholder="Plain English explanation" rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
            {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => onSave({ title, formula: f, plain_english: plain, category: cat })} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
