// Sends due sequence emails via Resend using the platform RESEND_API_KEY.
// Reads each user's from_name / from_email from user_email_settings.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    .lte("next_send_at", nowIso);

  if (seqErr) {
    console.error("Sequence fetch error:", seqErr);
    return new Response(JSON.stringify({ error: seqErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const seq of dueSeqs || []) {
    try {
      const { data: contact } = await supabase
        .from("contacts")
        .select("email, name")
        .eq("id", seq.contact_id)
        .maybeSingle();
      if (!contact?.email) {
        skipped++;
        continue;
      }

      const { data: tpl } = await supabase
        .from("email_templates")
        .select("*")
        .eq("user_id", seq.user_id)
        .eq("sequence_name", seq.sequence_name)
        .eq("sequence_step", seq.sequence_step)
        .maybeSingle();
      if (!tpl) {
        skipped++;
        continue;
      }

      const { data: settings } = await supabase
        .from("user_email_settings")
        .select("from_name, from_email")
        .eq("user_id", seq.user_id)
        .maybeSingle();

      if (!settings?.from_email) {
        skipped++;
        continue;
      }

      const fromName = settings.from_name || "Outreach";
      const fromAddr = `${fromName} <${settings.from_email}>`;

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddr,
          to: contact.email,
          subject: tpl.subject,
          text: tpl.body_text,
          html: tpl.body_html || undefined,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`Resend send failed for sequence ${seq.id}:`, errText);
        failed++;
        continue;
      }

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
        const nextSend = new Date(Date.now() + delayDays * 86400000).toISOString();
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
      console.error("send loop error:", e);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ sent, skipped, failed, processed: (dueSeqs || []).length }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
