import { useState, useRef, useMemo } from "react";
import { X, Upload, Download, FileText, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FIELDS = ["Name", "Email", "Company", "Title", "Phone", "Location", "Website", "Tags", "Deal Value", "Notes", "Skip"] as const;
type Field = typeof FIELDS[number];

const TEMPLATE_HEADERS = ["Name", "Email", "Company", "Title", "Phone", "Location", "Website", "Tags", "Deal Value", "Notes"];

type Step = 1 | 2 | 3 | 4;
type DupeMode = "skip" | "update" | "all";

type ParsedCsv = { headers: string[]; rows: string[][] };

function parseCsv(text: string): ParsedCsv {
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (field !== "" || cur.length > 0) { cur.push(field); lines.push(cur); cur = []; field = ""; }
        if (ch === "\r" && text[i + 1] === "\n") i++;
      } else field += ch;
    }
  }
  if (field !== "" || cur.length > 0) { cur.push(field); lines.push(cur); }
  if (lines.length === 0) return { headers: [], rows: [] };
  return { headers: lines[0].map((h) => h.trim()), rows: lines.slice(1).filter((r) => r.some((c) => c.trim() !== "")) };
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => {
    const s = String(c ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function autoMap(header: string): Field {
  const h = header.trim().toLowerCase();
  if (["name", "full name", "contact name", "contact"].includes(h)) return "Name";
  if (["email", "email address", "e-mail"].includes(h)) return "Email";
  if (["company", "company name", "organization", "business"].includes(h)) return "Company";
  if (["title", "job title", "position", "role"].includes(h)) return "Title";
  if (["phone", "phone number", "mobile", "tel"].includes(h)) return "Phone";
  if (["location", "city", "address", "region"].includes(h)) return "Location";
  if (["website", "url", "site", "web"].includes(h)) return "Website";
  if (["tags", "labels", "tag"].includes(h)) return "Tags";
  if (["deal value", "value", "amount", "price", "deal"].includes(h)) return "Deal Value";
  if (["notes", "note", "description", "comment"].includes(h)) return "Notes";
  return "Skip";
}

export default function CsvImportModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { pipelines, contacts, createCompany } = useCrm();
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState<string>("");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<number, Field>>({});
  const [pipelineId, setPipelineId] = useState<string>(pipelines[0]?.id || "");
  const [stage, setStage] = useState<string>("");
  const [dupeMode, setDupeMode] = useState<DupeMode>("skip");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: { row: number; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectedPipeline = useMemo(() => pipelines.find((p) => p.id === pipelineId), [pipelines, pipelineId]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      toast.error("CSV appears to be empty");
      return;
    }
    setFileName(file.name);
    setCsv(parsed);
    const map: Record<number, Field> = {};
    parsed.headers.forEach((h, i) => { map[i] = autoMap(h); });
    setMapping(map);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = () => downloadCsv("contacts-template.csv", [TEMPLATE_HEADERS]);

  const canProceedFromMapping = useMemo(() => {
    const used = Object.values(mapping);
    return used.includes("Name") || used.includes("Email");
  }, [mapping]);

  // Inferred imported tag for filtering after import
  const importBatchTag = useMemo(() => `import-${Date.now().toString(36)}`, []);

  const runImport = async () => {
    if (!user || !csv || !selectedPipeline) return;
    setImporting(true);
    const startStage = stage || selectedPipeline.stages[0];
    const existingByEmail = new Map(contacts.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c] as const));
    let imported = 0, skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    // Pre-build rows
    const toInsert: any[] = [];
    const toUpdate: { id: string; patch: any }[] = [];
    const companyCache = new Map<string, string>();

    for (let i = 0; i < csv.rows.length; i++) {
      const row = csv.rows[i];
      const get = (f: Field) => {
        const idx = Object.entries(mapping).find(([_, v]) => v === f)?.[0];
        return idx !== undefined ? (row[Number(idx)] || "").trim() : "";
      };
      const name = get("Name");
      const email = get("Email");
      if (!name && !email) { errors.push({ row: i + 2, reason: "Missing name and email" }); continue; }

      const company = get("Company");
      const title = get("Title");
      const phone = get("Phone");
      const location = get("Location");
      const tagsRaw = get("Tags");
      const dealVal = parseFloat(get("Deal Value")) || 0;
      const notes = get("Notes");
      const tags = tagsRaw ? tagsRaw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [];
      tags.push("CSV Import", importBatchTag);

      const existing = email ? existingByEmail.get(email.toLowerCase()) : null;
      if (existing) {
        if (dupeMode === "skip") { skipped++; continue; }
        if (dupeMode === "update") {
          toUpdate.push({
            id: existing.id,
            patch: {
              name: name || existing.name,
              email: email || existing.email,
              title: title || existing.title,
              phone: phone || existing.phone,
              location: location || existing.location,
              notes: notes || existing.notes,
              value: dealVal || existing.value,
              tags: Array.from(new Set([...existing.tags, ...tags])),
              pipeline_id: selectedPipeline.id,
              stage: startStage,
            },
          });
          continue;
        }
        // dupeMode === "all" → fall through to insert
      }

      let companyId: string | null = null;
      if (company) {
        const key = company.toLowerCase();
        if (companyCache.has(key)) companyId = companyCache.get(key)!;
        else {
          const created = await createCompany({ name: company });
          if (created) { companyId = created.id; companyCache.set(key, created.id); }
        }
      }

      toInsert.push({
        user_id: user.id,
        name: name || email,
        email: email || null,
        title: title || null,
        phone: phone || null,
        location: location || null,
        notes: notes || null,
        value: dealVal,
        tags,
        company_id: companyId,
        pipeline_id: selectedPipeline.id,
        stage: startStage,
      });
    }

    // Batch insert in chunks of 200
    for (let i = 0; i < toInsert.length; i += 200) {
      const chunk = toInsert.slice(i, i + 200);
      const { error } = await supabase.from("contacts").insert(chunk);
      if (error) {
        errors.push({ row: -1, reason: `Insert batch failed: ${error.message}` });
      } else imported += chunk.length;
    }
    // Updates
    for (const u of toUpdate) {
      const { error } = await supabase.from("contacts").update(u.patch).eq("id", u.id);
      if (error) errors.push({ row: -1, reason: `Update failed: ${error.message}` });
      else imported++;
    }

    setResult({ imported, skipped, errors });
    setImporting(false);
    setStep(4);
  };

  const downloadErrorLog = () => {
    if (!result) return;
    const rows = [["Row", "Reason"], ...result.errors.map((e) => [String(e.row), e.reason])];
    downloadCsv("import-errors.csv", rows);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {step === 1 && "Import Contacts"}
              {step === 2 && "Map your columns"}
              {step === 3 && "Assign to pipeline"}
              {step === 4 && "Import complete"}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={cn("h-1 w-6 rounded-full", s <= step ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-muted/10"
                )}
              >
                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Drop your CSV file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Accepts .csv files</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  className="hidden"
                />
              </div>

              {csv && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                  <FileText size={16} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{csv.rows.length} rows · {csv.headers.length} columns</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button onClick={downloadTemplate} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Download size={12} /> Download template
                </button>
                <button
                  onClick={() => csv && setStep(2)}
                  disabled={!csv}
                  className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-primary/90"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && csv && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Match each CSV column to a MythosHQ field. At least Name or Email must be mapped.</p>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider grid grid-cols-12 gap-2">
                  <div className="col-span-5">CSV column</div>
                  <div className="col-span-1 text-center">→</div>
                  <div className="col-span-6">MythosHQ field</div>
                </div>
                {csv.headers.map((h, i) => (
                  <div key={i} className="px-3 py-2 border-t border-border grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <p className="text-sm font-medium text-foreground truncate">{h}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        e.g. {csv.rows[0]?.[i] || "—"}
                      </p>
                    </div>
                    <div className="col-span-1 text-center text-muted-foreground">→</div>
                    <div className="col-span-6">
                      <select
                        value={mapping[i] || "Skip"}
                        onChange={(e) => setMapping({ ...mapping, [i]: e.target.value as Field })}
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {FIELDS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-2">Preview (first 3 rows)</p>
                <div className="border border-border rounded-lg overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead className="bg-muted/30">
                      <tr>{csv.headers.map((h, i) => <th key={i} className="px-2 py-1.5 text-left text-muted-foreground font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {csv.rows.slice(0, 3).map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          {r.map((c, j) => <td key={j} className="px-2 py-1.5 text-foreground truncate max-w-[140px]">{c}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">← Back</button>
                <button
                  onClick={() => { setStep(3); if (selectedPipeline && !stage) setStage(selectedPipeline.stages[0]); }}
                  disabled={!canProceedFromMapping}
                  className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-primary/90"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && csv && (
            <div className="space-y-5">
              {pipelines.length === 0 ? (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm text-foreground">
                  You don't have any pipelines yet. Create one in the Pipeline page first.
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block mb-2">Pipeline</label>
                    <select
                      value={pipelineId}
                      onChange={(e) => { setPipelineId(e.target.value); const p = pipelines.find((x) => x.id === e.target.value); if (p) setStage(p.stages[0]); }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block mb-2">Starting stage</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {selectedPipeline?.stages.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block mb-2">Duplicate handling</label>
                    <div className="space-y-2">
                      {([
                        { v: "skip", t: "Skip duplicates", d: "If email already exists, skip that row" },
                        { v: "update", t: "Update existing", d: "If email matches, update the existing contact" },
                        { v: "all", t: "Import all", d: "Create a new contact even if email exists" },
                      ] as { v: DupeMode; t: string; d: string }[]).map((opt) => (
                        <label key={opt.v} className={cn(
                          "flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors",
                          dupeMode === opt.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        )}>
                          <input
                            type="radio"
                            checked={dupeMode === opt.v}
                            onChange={() => setDupeMode(opt.v)}
                            className="mt-0.5 accent-primary"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">{opt.t}</p>
                            <p className="text-xs text-muted-foreground">{opt.d}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">← Back</button>
                <button
                  onClick={runImport}
                  disabled={!pipelineId || importing}
                  className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
                >
                  {importing ? "Importing..." : `Import ${csv.rows.length} contacts →`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && result && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                  <Check size={28} className="text-emerald-500" />
                </div>
                <p className="text-base font-semibold text-foreground">{result.imported} contacts imported</p>
                {result.skipped > 0 && <p className="text-sm text-muted-foreground mt-1">{result.skipped} duplicates skipped</p>}
              </div>

              {result.errors.length > 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{result.errors.length} rows with errors</p>
                    <button onClick={downloadErrorLog} className="text-xs text-primary hover:underline mt-1">
                      Download error log
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 gap-3">
                <button
                  onClick={() => { setStep(1); setCsv(null); setFileName(""); setMapping({}); setResult(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground border border-border px-4 py-2 rounded-lg"
                >
                  Import another file
                </button>
                <button
                  onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("csv-import-tag", { detail: importBatchTag })); }}
                  className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90"
                >
                  View contacts
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
