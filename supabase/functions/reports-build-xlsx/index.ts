// POST /reports-build-xlsx — generates an .xlsx file from a sheets spec, returns base64
// Body: { sheets: [{ name: string, rows: (string|number|null)[][] }] }
// Returns: { fileName, base64, rowCount, colCount }

import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sheets, fileName } = await req.json();
    if (!Array.isArray(sheets) || sheets.length === 0) {
      return new Response(JSON.stringify({ error: "sheets array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wb = XLSX.utils.book_new();
    let totalRows = 0;
    let maxCols = 0;

    for (const s of sheets) {
      const name = (s.name || "Sheet1").slice(0, 31);
      const rows = Array.isArray(s.rows) ? s.rows : [];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name);
      totalRows += rows.length;
      if (rows.length > 0) maxCols = Math.max(maxCols, rows[0].length || 0);
    }

    const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const bytes = new Uint8Array(ab);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as never);
    }
    const base64 = btoa(binary);

    return new Response(JSON.stringify({
      fileName: fileName || "report.xlsx",
      base64,
      rowCount: totalRows,
      colCount: maxCols,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("reports-build-xlsx error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
