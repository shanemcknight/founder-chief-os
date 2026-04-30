// Resend webhook handler. Processes bounce/complaint/delivered events and
// stops sequences for contacts whose email hard-bounced or marked spam.
// Also handles inbound email.received events for cold outreach replies.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, resend-signature, svix-id, svix-timestamp, svix-signature",
};

const FORWARD_TO = "shane@tophatprovisions.com";
const FORWARD_FROM = "Shane McKnight <shane@outreach.tophatprovisions.com>";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySvix(secret: string, id: string, ts: string, body: string, sigHeader: string) {
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const rawBody = await req.text();

  const svixId = req.headers.get("svix-id") || req.headers.get("webhook-id") || "";
  const svixTs = req.headers.get("svix-timestamp") || req.headers.get("webhook-timestamp") || "";
  const svixSig =
    req.headers.get("svix-signature") ||
    req.headers.get("webhook-signature") ||
    req.headers.get("resend-signature") ||
    "";

  // Best-effort signature validation (Resend uses Svix headers).
  if (secret) {
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Idempotency check via svix-id
  if (svixId) {
    try {
      const { data: inserted, error: idemErr } = await supabase
        .from("webhook_events_processed")
        .insert({ svix_id: svixId })
        .select("svix_id");
      if (idemErr) {
        // Unique violation = already processed
        if ((idemErr as any).code === "23505") {
          return json({ ok: true, note: "already processed" });
        }
        console.warn("resend-webhook: idempotency insert error", idemErr);
      } else if (!inserted || inserted.length === 0) {
        return json({ ok: true, note: "already processed" });
      }
    } catch (e) {
      console.warn("resend-webhook: idempotency check failed", e);
    }
  }

  const type: string = payload?.type || "";
  const data = payload?.data || {};

  // ---------- INBOUND REPLY HANDLER ----------
  if (type === "email.received") {
    try {
      const fromEmail: string = String(data.from || "").trim();
      const subject: string = String(data.subject || "(no subject)");
      const text: string = data.text || "";
      const html: string = data.html || "";
      const messageId: string = data?.headers?.["message-id"] || data?.headers?.["Message-ID"] || "";
      const bodyText = text || html || "";

      let contact: any = null;
      let companyName = "";

      if (fromEmail) {
        try {
          const { data: contacts } = await supabase
            .from("contacts")
            .select("id, user_id, name, email, company_id")
            .ilike("email", fromEmail)
            .limit(1);
          contact = contacts?.[0] || null;

          if (contact?.company_id) {
            const { data: company } = await supabase
              .from("companies")
              .select("name")
              .eq("id", contact.company_id)
              .maybeSingle();
            companyName = company?.name || "";
          }
        } catch (e) {
          console.error("resend-webhook: contact lookup failed", e);
        }
      }

      // Log activity
      if (contact) {
        try {
          await supabase.from("activities").insert({
            user_id: contact.user_id,
            contact_id: contact.id,
            type: "email_reply",
            description: `Reply from ${fromEmail}: ${subject}`,
            subject,
            body: bodyText,
            metadata: { from: fromEmail, message_id: messageId },
          });
        } catch (e) {
          console.error("resend-webhook: activity insert failed", e);
        }

        // Pause active sequences
        try {
          await supabase
            .from("email_sequences")
            .update({
              status: "replied",
              next_send_at: null,
              replied_at: new Date().toISOString(),
            })
            .eq("contact_id", contact.id)
            .eq("status", "active");
        } catch (e) {
          console.error("resend-webhook: sequence pause failed", e);
        }
      }

      // Forward reply to Shane
      try {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (!RESEND_API_KEY) {
          console.error("resend-webhook: RESEND_API_KEY not set, skipping forward");
        } else {
          const contactName = contact?.name || "(no CRM match)";
          const mythosLink = contact
            ? `https://mythoshq.io/sales/contacts/${contact.id}`
            : "";

          const subjectPrefix = contact
            ? `[Reply from ${contact.name || fromEmail}]`
            : "[No CRM match]";
          const fwdSubject = `${subjectPrefix} ${subject}`;

          const headerText = [
            `From: ${fromEmail}`,
            `Contact: ${contactName}`,
            `Company: ${companyName}`,
            mythosLink ? `MythosHQ: ${mythosLink}` : "",
            "─────────────────────────────────────",
            "",
          ]
            .filter(Boolean)
            .join("\n");

          const fwdText = `${headerText}${bodyText}`;

          const fwdHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #222;">
              <table style="border-collapse: collapse; margin-bottom: 12px; font-size: 14px;">
                <tr><td style="padding: 2px 8px 2px 0; color: #666;"><strong>From:</strong></td><td>${escapeHtml(fromEmail)}</td></tr>
                <tr><td style="padding: 2px 8px 2px 0; color: #666;"><strong>Contact:</strong></td><td>${escapeHtml(contactName)}</td></tr>
                <tr><td style="padding: 2px 8px 2px 0; color: #666;"><strong>Company:</strong></td><td>${escapeHtml(companyName)}</td></tr>
                ${mythosLink ? `<tr><td style="padding: 2px 8px 2px 0; color: #666;"><strong>MythosHQ:</strong></td><td><a href="${mythosLink}">${mythosLink}</a></td></tr>` : ""}
              </table>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 12px 0;" />
              <div>${html || `<pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(text)}</pre>`}</div>
            </div>
          `;

          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: FORWARD_FROM,
              to: [FORWARD_TO],
              reply_to: fromEmail,
              subject: fwdSubject,
              text: fwdText,
              html: fwdHtml,
            }),
          });
          if (!resp.ok) {
            const errBody = await resp.text();
            console.error("resend-webhook: forward send failed", resp.status, errBody);
          }
        }
      } catch (e) {
        console.error("resend-webhook: forward exception", e);
      }
    } catch (e) {
      console.error("resend-webhook: email.received handler exception", e);
    }
    return json({ ok: true, type });
  }

  // ---------- DELIVERY / BOUNCE / COMPLAINT HANDLERS (unchanged) ----------
  const recipients: string[] = Array.isArray(data.to) ? data.to : data.to ? [data.to] : [];
  if (recipients.length === 0) {
    return json({ ok: true, note: "no recipient" });
  }

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
