// Edge function: send-sequence-email
// Processes due email sequence sends. Runs hourly via pg_cron.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Sequence {
  id: string;
  user_id: string;
  contact_id: string | null;
  pipeline_id: string | null;
  sequence_name: string;
  sequence_step: number;
  status: string;
  next_send_at: string | null;
  last_sent_at: string | null;
}

interface Contact {
  id: string;
  email: string | null;
  name: string | null;
}

interface Template {
  id: string;
  user_id: string;
  sequence_name: string;
  sequence_step: number;
  subject: string;
  body_text: string;
  body_html: string | null;
  delay_days: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const stats = {
    processed: 0,
    sent: 0,
    skipped_no_key: 0,
    skipped_no_contact_email: 0,
    skipped_no_template: 0,
    completed: 0,
    advanced: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const nowIso = new Date().toISOString();

    // 1. Pending sequences due to send
    const { data: sequences, error: seqErr } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("status", "pending")
      .lte("next_send_at", nowIso);

    if (seqErr) throw seqErr;

    const due = (sequences || []) as Sequence[];

    for (const seq of due) {
      stats.processed++;
      try {
        if (!seq.contact_id) {
          stats.skipped_no_contact_email++;
          continue;
        }

        // a. Contact
        const { data: contact } = await supabase
          .from("contacts")
          .select("id, email, name")
          .eq("id", seq.contact_id)
          .maybeSingle();

        const c = contact as Contact | null;
        if (!c?.email) {
          stats.skipped_no_contact_email++;
          continue;
        }

        // b. Current template
        const { data: tpl } = await supabase
          .from("email_templates")
          .select("*")
          .eq("user_id", seq.user_id)
          .eq("sequence_name", seq.sequence_name)
          .eq("sequence_step", seq.sequence_step)
          .maybeSingle();

        const template = tpl as Template | null;
        if (!template) {
          stats.skipped_no_template++;
          continue;
        }

        // c. Resend API key for this user
        const { data: keyRow } = await supabase
          .from("api_keys")
          .select("api_key")
          .eq("user_id", seq.user_id)
          .eq("service", "resend")
          .maybeSingle();

        const resendKey = (keyRow as { api_key?: string } | null)?.api_key;
        if (!resendKey) {
          // d. Skip silently
          stats.skipped_no_key++;
          continue;
        }

        // e. Send via Resend
        const payload: Record<string, unknown> = {
          from: "outreach@mythoshq.io",
          to: c.email,
          subject: template.subject,
          text: template.body_text,
        };
        if (template.body_html) payload.html = template.body_html;

        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          stats.failed++;
          stats.errors.push(
            `seq ${seq.id} step ${seq.sequence_step}: Resend ${resp.status} ${txt}`
          );
          // g. Do not update record — retries next hour
          continue;
        }

        stats.sent++;

        // f. Look for the next step
        const nextStep = seq.sequence_step + 1;
        const { data: nextTpl } = await supabase
          .from("email_templates")
          .select("delay_days")
          .eq("user_id", seq.user_id)
          .eq("sequence_name", seq.sequence_name)
          .eq("sequence_step", nextStep)
          .maybeSingle();

        const nowIsoSent = new Date().toISOString();

        if (nextTpl) {
          const delayDays =
            (nextTpl as { delay_days: number | null }).delay_days ?? 7;
          const nextSend = new Date(
            Date.now() + delayDays * 24 * 60 * 60 * 1000
          ).toISOString();

          const { error: updErr } = await supabase
            .from("email_sequences")
            .update({
              sequence_step: nextStep,
              status: "pending",
              last_sent_at: nowIsoSent,
              next_send_at: nextSend,
            })
            .eq("id", seq.id);

          if (updErr) throw updErr;
          stats.advanced++;
        } else {
          const { error: updErr } = await supabase
            .from("email_sequences")
            .update({
              status: "completed",
              last_sent_at: nowIsoSent,
            })
            .eq("id", seq.id);

          if (updErr) throw updErr;
          stats.completed++;
        }
      } catch (innerErr) {
        stats.failed++;
        const msg =
          innerErr instanceof Error ? innerErr.message : String(innerErr);
        stats.errors.push(`seq ${seq.id}: ${msg}`);
        console.error("send-sequence-email inner error", seq.id, msg);
      }
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("send-sequence-email fatal", msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg, stats }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
