import { useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, Star, MoreHorizontal, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useReports, type Report } from "@/contexts/ReportsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["All", "P&L", "Inventory", "Costing", "Cash Flow", "Forecasting", "Custom"];

function relTime(iso: string | null) {
  if (!iso) return "Never used";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "Used today";
  if (d === 1) return "Used 1 day ago";
  if (d < 30) return `Used ${d} days ago`;
  return `Used ${Math.floor(d / 30)}mo ago`;
}

export default function ReportsLibraryPage() {
  const { user } = useAuth();
  const { reports, createReport, updateReport, deleteReport } = useReports();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [versionOf, setVersionOf] = useState<Report | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (filter !== "All" && r.category.toLowerCase() !== filter.toLowerCase()) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) &&
          !(r.description || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [reports, filter, search]);

  const versionCounts = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((r) => {
      if (r.version_of) map.set(r.version_of, (map.get(r.version_of) || 0) + 1);
    });
    return map;
  }, [reports]);

  const toggleStar = (r: Report) => updateReport(r.id, { starred: !r.starred });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-foreground">Report Library</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 border border-border text-foreground text-xs px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <Upload size={14} /> Upload Report
          </button>
          <button
            onClick={() => navigate("/reports/build")}
            className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Build New →
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
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

      <div className="mb-6 relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports and tools..."
          className="bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileSpreadsheet size={40} className="text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            {reports.length === 0 ? "Your library is empty." : "No reports match your filters."}
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            {reports.length === 0
              ? "Upload your first report or build one with AI."
              : "Try changing the category or search query."}
          </p>
          {reports.length === 0 && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 border border-border text-foreground text-xs px-4 py-2 rounded-lg hover:bg-muted/30"
              >
                <Upload size={14} /> Upload
              </button>
              <button
                onClick={() => navigate("/reports/build")}
                className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                Build with AI →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const vCount = versionCounts.get(r.id) || 0;
            return (
              <div
                key={r.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileSpreadsheet size={20} className="text-primary" />
                    <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded ml-2 capitalize">{r.category}</span>
                  </div>
                  <div className="flex items-center gap-1 relative">
                    <button onClick={() => toggleStar(r)} className="p-1 hover:bg-muted/30 rounded">
                      <Star size={14} className={r.starred ? "text-warning fill-warning" : "text-muted-foreground"} />
                    </button>
                    <button onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)} className="p-1 hover:bg-muted/30 rounded">
                      <MoreHorizontal size={14} className="text-muted-foreground" />
                    </button>
                    {openMenu === r.id && (
                      <div className="absolute right-0 top-7 bg-card border border-border rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                        <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted/30 text-foreground" onClick={() => { const t = prompt("New title", r.title); if (t) updateReport(r.id, { title: t }); setOpenMenu(null); }}>Rename</button>
                        {r.file_url && <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted/30 text-foreground" onClick={() => { window.open(r.file_url!, "_blank"); setOpenMenu(null); }}>Download</button>}
                        <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted/30 text-foreground" onClick={() => { navigate("/reports/build"); setOpenMenu(null); }}>Open in Build</button>
                        <button className="w-full text-left text-xs px-3 py-1.5 hover:bg-muted/30 text-destructive" onClick={() => { if (confirm("Delete this report?")) deleteReport(r.id); setOpenMenu(null); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-foreground mt-2">{r.title}</h3>
                {r.description && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{r.description}</p>}
                {(vCount > 0 || r.version_label) && (
                  <span className="inline-block w-fit text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded mt-2">
                    {r.version_label ? `${r.version_label}` : `${vCount + 1} versions`}
                  </span>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">{relTime(r.last_used_at || r.created_at)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { updateReport(r.id, { last_used_at: new Date().toISOString() }); if (r.file_url) window.open(r.file_url, "_blank"); }}
                      className="border border-border text-foreground text-[10px] px-2.5 py-1.5 rounded hover:bg-muted/30"
                    >
                      Open
                    </button>
                    <button
                      onClick={async () => {
                        const dup = await createReport({ ...r, title: `${r.title} (copy)`, version_of: null, version_label: null });
                        if (dup) toast.success("Duplicated");
                      }}
                      className="border border-border text-foreground text-[10px] px-2.5 py-1.5 rounded hover:bg-muted/30"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => setVersionOf(r)}
                      className="bg-primary/10 text-primary text-[10px] px-2.5 py-1.5 rounded hover:bg-primary/20"
                    >
                      New Version
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpload && user && (
        <UploadModal
          userId={user.id}
          onClose={() => setShowUpload(false)}
          onSave={async (file, meta) => {
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
            const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
            const { error: upErr } = await supabase.storage.from("reports").upload(path, file);
            if (upErr) {
              toast.error("Upload failed: " + upErr.message);
              return;
            }
            const { data: signed } = await supabase.storage.from("reports").createSignedUrl(path, 60 * 60 * 24 * 365);
            await createReport({
              title: meta.title,
              description: meta.description,
              category: meta.category,
              file_url: signed?.signedUrl || null,
              file_name: file.name,
              file_type: ext,
            });
            toast.success("Report uploaded");
            setShowUpload(false);
          }}
        />
      )}

      {versionOf && (
        <NewVersionModal
          report={versionOf}
          onClose={() => setVersionOf(null)}
          onSave={async (label) => {
            await createReport({
              title: versionOf.title,
              description: versionOf.description,
              category: versionOf.category,
              file_url: versionOf.file_url,
              file_name: versionOf.file_name,
              file_type: versionOf.file_type,
              version_of: versionOf.id,
              version_label: label,
            });
            toast.success("New version created");
            setVersionOf(null);
          }}
        />
      )}
    </div>
  );
}

function UploadModal({ userId, onClose, onSave }: { userId: string; onClose: () => void; onSave: (f: File, meta: { title: string; description: string; category: string }) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Custom");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Upload Report</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className={cn(
              "border-dashed border-2 rounded-xl p-8 text-center transition-colors",
              drag ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <Upload size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground mb-1">Drop your Excel, CSV, or PDF here</p>
            <button onClick={() => inputRef.current?.click()} className="text-primary text-xs hover:underline">or browse files</button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-foreground flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-primary" />
              <span className="flex-1 truncate">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
            </select>
            <button
              disabled={!title}
              onClick={() => onSave(file, { title, description, category })}
              className="w-full bg-primary text-primary-foreground text-xs py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Save to Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewVersionModal({ report, onClose, onSave }: { report: Report; onClose: () => void; onSave: (label: string) => void }) {
  const [label, setLabel] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(true);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">New Version</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Original: <span className="text-foreground font-medium">{report.title}</span></p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Version label (e.g. Q2 2026)"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <input type="checkbox" checked={autoUpdate} onChange={(e) => setAutoUpdate(e.target.checked)} className="rounded border-border" />
          Update date references automatically
        </label>
        <button
          disabled={!label}
          onClick={() => onSave(label)}
          className="w-full bg-primary text-primary-foreground text-xs py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          Create Version
        </button>
      </div>
    </div>
  );
}
