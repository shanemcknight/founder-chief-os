// Verifies/looks up a Resend domain for the current user and returns DNS records + verification status.
// Uses the platform-level RESEND_API_KEY (NOT a per-user key).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonError(message: string, details: unknown, status = 500) {
  return new Response(
    JSON.stringify({ error: message, details }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return jsonError("RESEND_API_KEY not configured", "Missing platform secret RESEND_API_KEY");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Unauthorized", "Missing auth header", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return jsonError("Unauthorized", userErr?.message || "No user", 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const fromEmail: string | undefined = body.from_email;
    if (!fromEmail || !fromEmail.includes("@")) {
      return jsonError("from_email required", "Provide a valid from_email like name@yourdomain.com", 400);
    }

    const domain = fromEmail.split("@")[1].toLowerCase();

    // 1. List domains in Resend account
    const listRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const listJson = await listRes.json();
    if (!listRes.ok) {
      console.error("Resend GET /domains failed", listRes.status, listJson);
      return jsonError(
        "Failed to list domains in Resend",
        listJson?.message || JSON.stringify(listJson),
      );
    }

    let domainRecord = (listJson?.data || []).find(
      (d: any) => d.name?.toLowerCase() === domain,
    );

    // 2. If not found, create it
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
        console.error("Resend POST /domains failed", createRes.status, domainRecord);
        return jsonError(
          "Failed to create domain in Resend",
          domainRecord?.message || JSON.stringify(domainRecord),
        );
      }
    }

    // 3. Fetch full record (records list lives on the GET-by-id endpoint)
    const detailRes = await fetch(`https://api.resend.com/domains/${domainRecord.id}`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const detail = await detailRes.json();
    if (!detailRes.ok) {
      console.error("Resend GET /domains/:id failed", detailRes.status, detail);
      return jsonError(
        "Failed to fetch domain details from Resend",
        detail?.message || JSON.stringify(detail),
      );
    }

    let status: string = detail?.status || "pending";

    // 4. If pending / not_started, trigger verify
    if (status !== "verified") {
      const verifyRes = await fetch(
        `https://api.resend.com/domains/${domainRecord.id}/verify`,
        { method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}` } },
      );
      // Re-fetch detail to get latest status
      const recheck = await fetch(`https://api.resend.com/domains/${domainRecord.id}`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      });
      const recheckJson = await recheck.json();
      if (recheck.ok) status = recheckJson?.status || status;
    }

    const verified = status === "verified";

    // Persist verification status + domain id
    await supabase
      .from("user_email_settings")
      .update({ domain_verified: verified, resend_domain_id: domainRecord.id })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        domain,
        domain_id: domainRecord.id,
        status,
        verified,
        records: detail?.records || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-resend-domain error:", err);
    return jsonError("Internal error during domain verification", String(err));
  }
});
