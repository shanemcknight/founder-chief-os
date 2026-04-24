// Sends a one-off test email to the authenticated user using a template's
// subject + body, with placeholder merge values applied. Subject is prefixed
// with "[TEST] " so it's clearly a test in the inbox.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FROM_ADDR = "MythosHQ Outreach <outreach@mythoshq.io>";

const PLACEHOLDERS: Record<string, string> = {
  first_name: "Alex",
  last_name: "Johnson",
  full_name: "Alex Johnson",
  company: "Acme Co",
  city: "San Francisco",
  email: "alex@acmeco.com",
  website: "acmeco.com",
};

function applyPlaceholders(template: string): string {
  let out = template || "";
  for (const [key, value] of Object.entries(PLACEHOLDERS)) {
    out = out.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = (claimsData.claims as any).email as string | undefined;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "No email on user account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const subjectIn = typeof body?.subject === "string" ? body.subject : "";
    const bodyTextIn = typeof body?.body_text === "string" ? body.body_text : "";
    const bodyHtmlIn = typeof body?.body_html === "string" ? body.body_html : "";

    if (!subjectIn.trim() || !bodyTextIn.trim()) {
      return new Response(
        JSON.stringify({ error: "Subject and plain text body are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const subject = `[TEST] ${applyPlaceholders(subjectIn)}`;
    const text = applyPlaceholders(bodyTextIn);
    const html = bodyHtmlIn ? applyPlaceholders(bodyHtmlIn) : undefined;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDR,
        to: userEmail,
        subject,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Test send failed:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to send test email" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, sent_to: userEmail }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("send-test-email error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
