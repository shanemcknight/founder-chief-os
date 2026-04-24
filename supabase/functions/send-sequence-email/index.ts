// Tier-aware sender: enforces per-tier monthly email limits from user_usage.
// Sends due sequence emails via Resend using the platform RESEND_API_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FROM_ADDR = "MythosHQ Outreach <outreach@mythoshq.io>";
const MAX_PER_RUN = 500;

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const nowIso = new Date().toISOString();

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

  let sent = 0;
  let skipped_limit = 0;
  let skipped_no_email = 0;
  let errors = 0;

  for (const seq of dueSeqs || []) {
    try {
      // a. Fetch usage row
      const { data: usage } = await supabase
        .from("user_usage")
        .select("emails_sent_this_month, email_monthly_limit")
        .eq("user_id", seq.user_id)
        .maybeSingle();

      // b. CHECK LIMIT
      if (
        usage &&
        (usage.emails_sent_this_month ?? 0) >=
          (usage.email_monthly_limit ?? 0)
      ) {
        await supabase
          .from("email_sequences")
          .update({ status: "paused" })
          .eq("id", seq.id);
        skipped_limit++;
        continue;
      }

      // c. Fetch contact
      const { data: contact } = await supabase
        .from("contacts")
        .select("email, name")
        .eq("id", seq.contact_id)
        .maybeSingle();
      if (!contact?.email) {
        skipped_no_email++;
        continue;
      }

      // d. Fetch matching template
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

      // e. Send via Resend
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDR,
          to: contact.email,
          subject: tpl.subject,
          text: tpl.body_text,
          html: tpl.body_html || undefined,
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

      // f. Increment counter
      await supabase.rpc("increment_email_count", {
        _user_id: seq.user_id,
      });

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
      skipped_no_email,
      errors,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
