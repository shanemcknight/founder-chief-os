// Resend webhook handler. Processes bounce/complaint/delivered events and
// stops sequences for contacts whose email hard-bounced or marked spam.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, resend-signature, svix-id, svix-timestamp, svix-signature",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySvix(secret: string, id: string, ts: string, body: string, sigHeader: string) {
  // Resend uses Svix for signing. Header format: "v1,<base64-signature> v1,<base64>"
  // Compute HMAC-SHA256 over `${id}.${ts}.${body}` using the secret bytes.
  // The secret is a base64 string prefixed with "whsec_".
  const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes: Uint8Array;
  try {
    const bin = atob(cleanSecret);
    keyBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i);
  } catch {
    keyBytes = new TextEncoder().encode(cleanSecret);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${ts}.${body}`),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return sigHeader.split(" ").some((s) => s.split(",")[1] === expected);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const rawBody = await req.text();

  // Best-effort signature validation (Resend uses Svix headers).
  if (secret) {
    const svixId = req.headers.get("svix-id") || req.headers.get("webhook-id") || "";
    const svixTs = req.headers.get("svix-timestamp") || req.headers.get("webhook-timestamp") || "";
    const svixSig =
      req.headers.get("svix-signature") ||
      req.headers.get("webhook-signature") ||
      req.headers.get("resend-signature") ||
      "";
    if (svixId && svixTs && svixSig) {
      const ok = await verifySvix(secret, svixId, svixTs, rawBody, svixSig);
      if (!ok) {
        console.warn("resend-webhook: invalid signature");
        return json({ error: "Invalid signature" }, 401);
      }
    } else {
      console.warn("resend-webhook: missing signature headers, skipping verification");
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const type: string = payload?.type || "";
  const data = payload?.data || {};
  const recipients: string[] = Array.isArray(data.to) ? data.to : data.to ? [data.to] : [];

  if (recipients.length === 0) {
    return json({ ok: true, note: "no recipient" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let processed = 0;

  const stopForContact = async (
    email: string,
    tag: "bounced" | "spam_complaint",
    note: string,
  ) => {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, user_id, tags, notes")
      .eq("email", email);

    for (const c of contacts || []) {
      const tags = Array.isArray(c.tags) ? c.tags : [];
      const newTags = tags.includes(tag) ? tags : [...tags, tag];
      const newNotes = `${c.notes || ""}\n${note} on ${new Date().toISOString().slice(0, 10)}`.trim();

      await supabase
        .from("contacts")
        .update({ tags: newTags, notes: newNotes })
        .eq("id", c.id);

      await supabase
        .from("email_sequences")
        .update({ status: "completed" })
        .eq("contact_id", c.id);

      // Suppress future sends from this user
      await supabase.from("email_unsubscribes").insert({
        contact_id: c.id,
        email,
        user_id: c.user_id,
      });

      processed++;
    }
  };

  for (const email of recipients) {
    if (type === "email.bounced") {
      await stopForContact(email, "bounced", "Email bounced");
    } else if (type === "email.complained") {
      await stopForContact(email, "spam_complaint", "Spam complaint");
    } else if (type === "email.delivered") {
      // No-op for now.
    }
  }

  return json({ ok: true, type, processed });
});
