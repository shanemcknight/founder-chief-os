// Sends a one-off test email to the authenticated user using a template's
// subject + body, with placeholder merge values applied. Subject is prefixed
// with "[TEST] " so it's clearly a test in the inbox.
// Uses the per-user from address from user_email_settings (matches send-sequence-email).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_FROM = "MythosHQ Outreach <noreply@mythoshq.io>";

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

function jsonError(message: string, details: unknown, status = 500) {
  return new Response(
    JSON.stringify({ error: message, details }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return jsonError("RESEND_API_KEY not configured", "Missing platform secret RESEND_API_KEY");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Unauthorized", "Missing or malformed Authorization header", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonError("Unauthorized", userErr?.message || "Could not resolve user", 401);
    }
    const userEmail = userData.user.email;
    const userId = userData.user.id;
    if (!userEmail) {
      return jsonError("No email on user account", "User has no email address", 400);
    }

    const body = await req.json().catch(() => ({}));
    const subjectIn = typeof body?.subject === "string" ? body.subject : "";
    const bodyTextIn = typeof body?.body_text === "string" ? body.body_text : "";
    const bodyHtmlIn = typeof body?.body_html === "string" ? body.body_html : "";

    if (!subjectIn.trim() || !bodyTextIn.trim()) {
      return jsonError(
        "Subject and plain text body are required",
        "Provide both subject and body_text",
        400,
      );
    }

    // Resolve from address from user_email_settings (mirrors send-sequence-email).
    const { data: settings } = await supabase
      .from("user_email_settings")
      .select("from_name, from_email")
      .eq("user_id", userId)
      .maybeSingle();
    const fromAddr =
      settings?.from_email && settings?.from_name
        ? `${settings.from_name} <${settings.from_email}>`
        : settings?.from_email
          ? settings.from_email
          : FALLBACK_FROM;

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
        from: fromAddr,
        to: userEmail,
        subject,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("Resend POST /emails failed:", resp.status, errBody);
      return jsonError("Failed to send test email", errBody);
    }

    return new Response(
      JSON.stringify({ ok: true, sent_to: userEmail, from: fromAddr }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("send-test-email error:", e);
    return jsonError("Internal error", String(e));
  }
});
