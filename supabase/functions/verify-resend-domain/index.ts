// Verifies/looks up a Resend domain for the current user and returns DNS records + verification status.
// Uses the platform-level RESEND_API_KEY (NOT a per-user key).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const fromEmail: string | undefined = body.from_email;
    if (!fromEmail || !fromEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "from_email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domain = fromEmail.split("@")[1].toLowerCase();

    // List domains in Resend account
    const listRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const listJson = await listRes.json();
    const existing = (listJson?.data || []).find(
      (d: any) => d.name?.toLowerCase() === domain
    );

    let domainRecord = existing;

    // If not found, create it
    if (!domainRecord) {
      const createRes = await fetch("https://api.resend.com/domains", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      });
      domainRecord = await createRes.json();
      if (!createRes.ok) {
        return new Response(JSON.stringify({ error: domainRecord?.message || "Failed to create domain", details: domainRecord }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch full record (records list lives on the GET-by-id endpoint)
    const detailRes = await fetch(`https://api.resend.com/domains/${domainRecord.id}`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const detail = await detailRes.json();

    const verified = detail?.status === "verified";

    // Persist verification status
    await supabase
      .from("user_email_settings")
      .update({ domain_verified: verified })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        domain,
        status: detail?.status || "pending",
        verified,
        records: detail?.records || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-resend-domain error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
