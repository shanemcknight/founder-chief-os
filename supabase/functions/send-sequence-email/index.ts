// Tier-aware sender: enforces per-tier monthly + daily email limits and a
// business-hours sending window (Mon-Fri 08:00-17:00 UTC by default).
// Sends due sequence emails via Resend using the platform RESEND_API_KEY.
// - Skips and unsubscribes recipients in email_unsubscribes
// - Replaces merge fields (e.g. {{first_name}}) in subject + body
// - Appends a one-click unsubscribe link to every send
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FROM_ADDR = "MythosHQ Outreach <outreach@mythoshq.io>";
const MAX_PER_RUN = 500;

// Per-tier daily send limits
const DAILY_LIMITS: Record<string, number> = {
  SCOUT: 50,
  TITAN: 200,
  ATLAS: 500,
  OLYMPUS: 2000,
};

// ---- merge field replacement ----
type MergeContact = {
  name?: string | null;
  email?: string | null;
  location?: string | null;
  company?: string | null;
  website?: string | null;
};

function applyMergeFields(template: string, contact: MergeContact): string {
  const parts = (contact.name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";
  return template
    .replace(/{{first_name}}/g, firstName)
    .replace(/{{last_name}}/g, lastName)
    .replace(/{{full_name}}/g, contact.name || "")
    .replace(/{{company}}/g, contact.company || "")
    .replace(/{{city}}/g, contact.location?.split(",")[0]?.trim() || "")
    .replace(/{{email}}/g, contact.email || "")
    .replace(/{{website}}/g, contact.website || "");
}

// ---- HMAC for unsubscribe URL ----
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const UNSUBSCRIBE_SECRET = Deno.env.get("UNSUBSCRIBE_SECRET") || "";

  const supabase = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const now = new Date();
  const nowIso = now.toISOString();
  const utcDay = now.getUTCDay(); // 0 Sun .. 6 Sat
  const utcHour = now.getUTCHours();
  const isWeekend = utcDay === 0 || utcDay === 6;
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Global business-hours gate (Mon-Fri 08:00-17:00 UTC).
  // Per-step send_window_start/end is also enforced below.
  if (isWeekend || utcHour < 8 || utcHour >= 17) {
    return new Response(
      JSON.stringify({
        skipped_business_hours: true,
        utc_day: utcDay,
        utc_hour: utcHour,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { data: dueSeqs, error: seqErr } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("status", "pending")
    .lte("next_send_at", nowIso)
    .order("next_send_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (seqErr) {
    console.error("Sequence fetch error:", seqErr);
    return new Response(JSON.stringify({ error: seqErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Per-user usage cache for this run, so we don't refetch for every sequence.
  const usageCache = new Map<
    string,
    {
      plan_tier: string;
      emails_sent_this_month: number;
      email_monthly_limit: number;
      emails_sent_today: number;
      daily_limit: number;
    }
  >();
  const dailyBlocked = new Set<string>();

  let sent = 0;
  let skipped_limit = 0;
  let skipped_daily_limit = 0;
  let skipped_no_email = 0;
  let skipped_unsubscribed = 0;
  let skipped_step_window = 0;
  let errors = 0;

  for (const seq of dueSeqs || []) {
    try {
      // Skip remaining sequences for users already over their daily cap
      if (dailyBlocked.has(seq.user_id)) {
        skipped_daily_limit++;
        continue;
      }

      // Load + roll over usage row once per user per run
      let usage = usageCache.get(seq.user_id);
      if (!usage) {
        const { data: u } = await supabase
          .from("user_usage")
          .select(
            "plan_tier, emails_sent_this_month, email_monthly_limit, emails_sent_today, last_daily_reset"
          )
          .eq("user_id", seq.user_id)
          .maybeSingle();

        if (u) {
          // Daily roll-over if last_daily_reset is in the past
          let emailsToday = u.emails_sent_today ?? 0;
          if (!u.last_daily_reset || u.last_daily_reset < todayStr) {
            await supabase
              .from("user_usage")
              .update({
                emails_sent_today: 0,
                last_daily_reset: todayStr,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", seq.user_id);
            emailsToday = 0;
          }
          const tier = (u.plan_tier || "SCOUT").toUpperCase();
          usage = {
            plan_tier: tier,
            emails_sent_this_month: u.emails_sent_this_month ?? 0,
            email_monthly_limit: u.email_monthly_limit ?? 0,
            emails_sent_today: emailsToday,
            daily_limit: DAILY_LIMITS[tier] ?? DAILY_LIMITS.SCOUT,
          };
        } else {
          // No usage row → conservative defaults
          usage = {
            plan_tier: "SCOUT",
            emails_sent_this_month: 0,
            email_monthly_limit: 0,
            emails_sent_today: 0,
            daily_limit: DAILY_LIMITS.SCOUT,
          };
        }
        usageCache.set(seq.user_id, usage);
      }

      // Monthly cap → pause sequence
      if (usage.emails_sent_this_month >= usage.email_monthly_limit) {
        await supabase
          .from("email_sequences")
          .update({ status: "paused" })
          .eq("id", seq.id);
        skipped_limit++;
        continue;
      }

      // Daily cap → skip until next hour (may be a new day)
      if (usage.emails_sent_today >= usage.daily_limit) {
        dailyBlocked.add(seq.user_id);
        skipped_daily_limit++;
        continue;
      }

      // Fetch contact + company (for merge fields)
      const { data: contact } = await supabase
        .from("contacts")
        .select("id, email, name, location, company_id")
        .eq("id", seq.contact_id)
        .maybeSingle();
      if (!contact?.email) {
        skipped_no_email++;
        continue;
      }

      // Check unsubscribes BEFORE sending
      const { data: unsub } = await supabase
        .from("email_unsubscribes")
        .select("id")
        .eq("user_id", seq.user_id)
        .eq("email", contact.email)
        .limit(1);
      if (unsub && unsub.length > 0) {
        await supabase
          .from("email_sequences")
          .update({ status: "unsubscribed" })
          .eq("id", seq.id);
        skipped_unsubscribed++;
        continue;
      }

      // Resolve company name + website (if any)
      let companyName = "";
      let companyWebsite = "";
      if (contact.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("name, website")
          .eq("id", contact.company_id)
          .maybeSingle();
        companyName = company?.name || "";
        companyWebsite = company?.website || "";
      }

      const mergeData: MergeContact = {
        name: contact.name,
        email: contact.email,
        location: contact.location,
        company: companyName,
        website: companyWebsite,
      };

      // Fetch matching template
      const { data: tpl } = await supabase
        .from("email_templates")
        .select("*")
        .eq("user_id", seq.user_id)
        .eq("sequence_name", seq.sequence_name)
        .eq("sequence_step", seq.sequence_step)
        .maybeSingle();
      if (!tpl) {
        await supabase
          .from("email_sequences")
          .update({ status: "completed" })
          .eq("id", seq.id);
        continue;
      }

      // Per-step send window (defaults 8-17 UTC). Skip without state change so
      // the next hourly tick can pick it up.
      const winStart = tpl.send_window_start ?? 8;
      const winEnd = tpl.send_window_end ?? 17;
      if (utcHour < winStart || utcHour >= winEnd) {
        skipped_step_window++;
        continue;
      }

      // Apply merge fields
      const subject = applyMergeFields(tpl.subject || "", mergeData);
      let bodyText = applyMergeFields(tpl.body_text || "", mergeData);
      let bodyHtml = tpl.body_html
        ? applyMergeFields(tpl.body_html, mergeData)
        : "";

      // Build unsubscribe URL + append footer
      const token = UNSUBSCRIBE_SECRET
        ? await hmacHex(
            UNSUBSCRIBE_SECRET,
            `${contact.id}:${seq.user_id}`,
          )
        : "";
      const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/unsubscribe?contact_id=${contact.id}&user_id=${seq.user_id}&token=${token}`;

      bodyText = `${bodyText}\n\n---\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}`;
      if (bodyHtml) {
        bodyHtml = `${bodyHtml}<hr style="margin-top:32px;border:none;border-top:1px solid #eee" /><p style="font-size:11px;color:#888;text-align:center;margin-top:12px">Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline">Unsubscribe</a></p>`;
      }

      // Send via Resend
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDR,
          to: contact.email,
          subject,
          text: bodyText,
          html: bodyHtml || undefined,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(
          `Resend send failed for sequence ${seq.id} contact ${seq.contact_id}:`,
          errText
        );
        errors++;
        continue;
      }

      // Increment monthly counter (RPC) + daily counter (direct update)
      await supabase.rpc("increment_email_count", {
        _user_id: seq.user_id,
      });
      const newDaily = usage.emails_sent_today + 1;
      await supabase
        .from("user_usage")
        .update({
          emails_sent_today: newDaily,
          last_daily_reset: todayStr,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", seq.user_id);
      usage.emails_sent_today = newDaily;
      usage.emails_sent_this_month += 1;
      if (newDaily >= usage.daily_limit) dailyBlocked.add(seq.user_id);

      // Check next step
      const nextStep = (seq.sequence_step || 1) + 1;
      const { data: nextTpl } = await supabase
        .from("email_templates")
        .select("delay_days")
        .eq("user_id", seq.user_id)
        .eq("sequence_name", seq.sequence_name)
        .eq("sequence_step", nextStep)
        .maybeSingle();

      const sentAt = new Date().toISOString();

      if (nextTpl) {
        const delayDays = nextTpl.delay_days ?? 7;
        const nextSend = new Date(
          Date.now() + delayDays * 86400000
        ).toISOString();
        await supabase
          .from("email_sequences")
          .update({
            sequence_step: nextStep,
            status: "pending",
            last_sent_at: sentAt,
            next_send_at: nextSend,
          })
          .eq("id", seq.id);
      } else {
        await supabase
          .from("email_sequences")
          .update({ status: "completed", last_sent_at: sentAt })
          .eq("id", seq.id);
      }
      sent++;
    } catch (e) {
      console.error("send loop error for sequence", seq.id, e);
      errors++;
    }
  }

  return new Response(
    JSON.stringify({
      processed: (dueSeqs || []).length,
      sent,
      skipped_limit,
      skipped_daily_limit,
      skipped_no_email,
      skipped_unsubscribed,
      skipped_step_window,
      errors,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
