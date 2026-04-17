import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Report = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  content: string | null;
  version_of: string | null;
  version_label: string | null;
  starred: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type Formula = {
  id: string;
  user_id: string;
  title: string;
  formula: string;
  plain_english: string | null;
  category: string | null;
  starred: boolean;
  created_at: string;
};

type Ctx = {
  reports: Report[];
  formulas: Formula[];
  loading: boolean;
  refreshReports: () => Promise<void>;
  refreshFormulas: () => Promise<void>;
  createReport: (r: Partial<Report>) => Promise<Report | null>;
  updateReport: (id: string, patch: Partial<Report>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  createFormula: (f: Partial<Formula>) => Promise<Formula | null>;
  updateFormula: (id: string, patch: Partial<Formula>) => Promise<void>;
  deleteFormula: (id: string) => Promise<void>;
};

const ReportsCtx = createContext<Ctx | null>(null);

const SEED_FORMULAS: Omit<Formula, "id" | "user_id" | "created_at">[] = [
  { title: "Gross Margin %", formula: "=(Revenue-COGS)/Revenue*100", plain_english: "Calculates gross margin as a percentage of revenue.", category: "Financial", starred: true },
  { title: "Reorder Point", formula: "=AverageDailySales*LeadTimeDays+SafetyStock", plain_english: "When to reorder based on daily sales velocity, lead time, and a safety buffer.", category: "Custom", starred: false },
  { title: "Product Cost per Unit", formula: "=SUM(Ingredients)/BatchSize", plain_english: "Total ingredient cost divided by units produced in a batch.", category: "Custom", starred: false },
  { title: "Break Even Units", formula: "=FixedCosts/(SellingPrice-VariableCostPerUnit)", plain_english: "Units you must sell to cover fixed costs.", category: "Financial", starred: false },
  { title: "YoY Growth", formula: "=(CurrentYear-PriorYear)/PriorYear*100", plain_english: "Year-over-year growth rate as a percentage.", category: "Statistical", starred: true },
  { title: "Weighted Average Cost", formula: "=SUMPRODUCT(Cost,Units)/SUM(Units)", plain_english: "Average cost weighted by quantities purchased at each price.", category: "Statistical", starred: false },
];

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  const refreshReports = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    setReports((data as Report[]) || []);
  }, [user]);

  const refreshFormulas = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("report_formulas").select("*").order("created_at", { ascending: false });
    setFormulas((data as Formula[]) || []);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setReports([]);
      setFormulas([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await Promise.all([refreshReports(), refreshFormulas()]);
      setLoading(false);
    })();
  }, [user, refreshReports, refreshFormulas]);

  // Seed default formulas on first load if vault is empty
  useEffect(() => {
    if (!user || loading || seeded || formulas.length > 0) return;
    setSeeded(true);
    (async () => {
      const rows = SEED_FORMULAS.map((f) => ({ ...f, user_id: user.id }));
      const { data } = await supabase.from("report_formulas").insert(rows).select("*");
      if (data) setFormulas(data as Formula[]);
    })();
  }, [user, loading, seeded, formulas.length]);

  const createReport = useCallback(async (r: Partial<Report>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        title: r.title || "Untitled report",
        description: r.description ?? null,
        category: r.category || "custom",
        file_url: r.file_url ?? null,
        file_name: r.file_name ?? null,
        file_type: r.file_type ?? null,
        content: r.content ?? null,
        version_of: r.version_of ?? null,
        version_label: r.version_label ?? null,
      })
      .select("*")
      .single();
    if (error || !data) return null;
    setReports((prev) => [data as Report, ...prev]);
    return data as Report;
  }, [user]);

  const updateReport = useCallback(async (id: string, patch: Partial<Report>) => {
    const { data } = await supabase.from("reports").update(patch).eq("id", id).select("*").single();
    if (data) setReports((prev) => prev.map((r) => (r.id === id ? (data as Report) : r)));
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    await supabase.from("reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const createFormula = useCallback(async (f: Partial<Formula>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("report_formulas")
      .insert({
        user_id: user.id,
        title: f.title || "Untitled formula",
        formula: f.formula || "",
        plain_english: f.plain_english ?? null,
        category: f.category ?? null,
        starred: f.starred ?? false,
      })
      .select("*")
      .single();
    if (error || !data) return null;
    setFormulas((prev) => [data as Formula, ...prev]);
    return data as Formula;
  }, [user]);

  const updateFormula = useCallback(async (id: string, patch: Partial<Formula>) => {
    const { data } = await supabase.from("report_formulas").update(patch).eq("id", id).select("*").single();
    if (data) setFormulas((prev) => prev.map((f) => (f.id === id ? (data as Formula) : f)));
  }, []);

  const deleteFormula = useCallback(async (id: string) => {
    await supabase.from("report_formulas").delete().eq("id", id);
    setFormulas((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <ReportsCtx.Provider
      value={{
        reports, formulas, loading,
        refreshReports, refreshFormulas,
        createReport, updateReport, deleteReport,
        createFormula, updateFormula, deleteFormula,
      }}
    >
      {children}
    </ReportsCtx.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsCtx);
  if (!ctx) throw new Error("useReports must be used within ReportsProvider");
  return ctx;
}
