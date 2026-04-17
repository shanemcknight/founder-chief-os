import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  Upload,
  FileSpreadsheet,
  Zap,
  Wrench,
  BookOpen,
  FolderOpen,
  BarChart3,
} from "lucide-react";
import { useReports } from "@/contexts/ReportsContext";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
}: {
  icon: typeof FileSpreadsheet;
  iconColor: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={iconColor} />
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function ReportsHomePage() {
  const navigate = useNavigate();
  const { reports, formulas } = useReports();

  const stats = useMemo(() => {
    const reportsSaved = reports.length;
    const filesAnalyzed = reports.filter((r) => r.category === "analysis" || r.file_url).length;
    const toolsBuilt = reports.filter((r) => r.category === "build" || (!!r.content && !r.file_url)).length;
    const formulasSaved = formulas.length;
    return { reportsSaved, filesAnalyzed, toolsBuilt, formulasSaved };
  }, [reports, formulas]);

  const recentReports = reports.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your data, analyzed and organized.
          </p>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => navigate("/reports/analyze")}
            className="flex items-center gap-1.5 border border-border text-foreground text-xs px-3 py-2 rounded-md hover:bg-muted/30 transition-colors"
          >
            <Upload size={13} />
            Upload File
          </button>
          <button
            onClick={() => navigate("/reports/build")}
            className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-md ml-2 hover:bg-primary/90 transition-colors"
          >
            Build Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={FileSpreadsheet} iconColor="text-primary" value={stats.reportsSaved} label="Reports Saved" />
        <StatCard icon={Zap} iconColor="text-[hsl(var(--warning))]" value={stats.filesAnalyzed} label="Files Analyzed" />
        <StatCard icon={Wrench} iconColor="text-primary" value={stats.toolsBuilt} label="Tools Built" />
        <StatCard icon={BookOpen} iconColor="text-[hsl(var(--success))]" value={stats.formulasSaved} label="Formulas Saved" />
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ANALYZE */}
        <div
          onClick={() => navigate("/reports/analyze")}
          className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Analyze
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">
            Upload any file. Get instant intelligence.
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Drop an Excel, CSV, QuickBooks export, or PDF. Your agent reads it, identifies what
            matters, and delivers a plain-English analysis with key metrics highlighted. Ask
            follow-up questions. Download results.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {[".xlsx", ".csv", ".pdf", ".xls"].map((ext) => (
              <span
                key={ext}
                className="text-[9px] bg-muted text-muted-foreground px-2 py-1 rounded font-mono"
              >
                {ext}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-primary mt-3 block">Start Analyzing →</span>
        </div>

        {/* LIBRARY */}
        <div
          onClick={() => navigate("/reports/library")}
          className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FolderOpen size={20} className="text-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Library
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">
            Your reports. Organized. Always findable.
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Every report you upload or build is saved here. Filter by category — P&amp;L,
            Inventory, Costing, Cash Flow. Duplicate any report and apply it to a new time period
            in one click. Your team can access everything.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {["P&L", "Inventory", "Cash Flow"].map((c) => (
              <span
                key={c}
                className="bg-primary/10 text-primary text-[9px] px-2 py-1 rounded"
              >
                {c}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-primary mt-3 block">Open Library →</span>
        </div>

        {/* BUILD */}
        <div
          onClick={() => navigate("/reports/build")}
          className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Wrench size={20} className="text-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Build
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">
            Describe it. Your agent builds it.
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Tell your agent what you need in plain English. A product costing template for 12
            SKUs. A monthly P&amp;L with YoY comparison. A cash flow forecast. Your agent builds
            the Excel file, explains every formula, and saves it to your Library.
          </p>
          <div className="bg-muted/50 rounded-lg px-3 py-2 text-[10px] text-muted-foreground italic mt-3">
            "Build me a product costing template for 8 SKUs with variable ingredient costs and
            65% target margin..."
          </div>
          <span className="text-[11px] text-primary mt-3 block">Start Building →</span>
        </div>

        {/* VAULT */}
        <div
          onClick={() => navigate("/reports/vault")}
          className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-[0_0_16px_hsl(170_22%_48%/0.1)] transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Vault
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">
            Your formula library. Build once, reuse forever.
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Save your best Excel formulas with plain-English descriptions. Paste any formula to
            get an instant explanation. Describe what you need and your agent writes the formula.
            Your entire formula knowledge base in one place.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Gross Margin %", "Break Even Units", "Reorder Point"].map((f) => (
              <span
                key={f}
                className="border border-border text-[9px] text-muted-foreground px-2 py-1 rounded"
              >
                {f}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-primary mt-3 block">Open Vault →</span>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Recent Reports
        </h2>

        {recentReports.length > 0 ? (
          <div className="space-y-2">
            {recentReports.map((r) => {
              const stamp = r.last_used_at || r.created_at;
              const ago = stamp
                ? formatDistanceToNow(new Date(stamp), { addSuffix: true })
                : "";
              return (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSpreadsheet size={16} className="text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {r.title}
                    </span>
                    <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded shrink-0">
                      {r.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      last used {ago}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/reports/library")}
                    className="text-[11px] text-primary shrink-0 ml-3 hover:underline"
                  >
                    Open →
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-muted/20 rounded-xl p-8 text-center">
            <BarChart3 size={32} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No reports yet.</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Upload your first file to analyze it, or build a custom Excel tool with your agent.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => navigate("/reports/analyze")}
                className="border border-border text-foreground text-xs px-3 py-2 rounded-md hover:bg-muted/30 transition-colors"
              >
                Upload File →
              </button>
              <button
                onClick={() => navigate("/reports/build")}
                className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Build with Agent →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
