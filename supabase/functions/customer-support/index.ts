// Public MythosHQ Customer Support Agent.
// No auth required, no message persistence. Streams Lovable AI responses via SSE.
// Body: { messages: Array<{ role: "user" | "assistant"; content: string }> }
//
// KNOWLEDGE BASE UPDATE SCHEDULE:
// This agent reads from the support_knowledge table on every request.
// To update knowledge: insert/update rows in support_knowledge table (admins only via UI/SQL).
// Chief should review and update this table every 7 days or after any major product update.
// Post-migration: set up pg_cron to trigger a knowledge review reminder every 7 days.
// Cron: SELECT cron.schedule('support-knowledge-review', '0 0 * * 0', $$notify support team to review knowledge base$$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_KNOWLEDGE =
  "- Pricing tiers: SCOUT (free), TITAN ($49/mo), ATLAS ($79/mo), OLYMPUS ($149/mo)\n- 8 pillars: COMMAND, INBOX, SOCIAL, SALES, AGENTS, PUBLISH, BUILD, REPORTS\n- BYOK available on TITAN and above for unlimited tokens\n- Email integrations: Gmail and Outlook via Settings → Integrations\n- Escalation: hello@mythoshq.io";

function buildSystemPrompt(knowledge: string): string {
  return `You are the MythosHQ Customer Support Agent. You are helpful, direct, and knowledgeable about the MythosHQ platform. You never say "I don't know" without offering a path forward. You keep responses concise and actionable.

Your knowledge base (updated regularly):
${knowledge}

TONE:
Direct, warm, helpful. Not corporate. Not over-apologetic. No filler phrases like "Great question!" If something is outside your knowledge, be honest and offer to connect them with the team.

ESCALATION:
If the user expresses frustration, asks for a human, mentions billing issues, or uses words like "broken", "frustrated", "escalate", "refund", "cancel" — respond warmly and let them know a human can help. The support email is hello@mythoshq.io.

KNOWLEDGE UPDATES:
Your knowledge is refreshed regularly from the MythosHQ product database. If a user asks about something not in your knowledge base, note it as a gap and suggest they email hello@mythoshq.io for the most current information.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize and cap to last 30 turns
    const cleaned = messages
      .filter((m: { role?: string; content?: string }) =>
        (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.length < 8000
      )
      .slice(-30);

    // Pull live knowledge base (anon key — RLS allows read of active rows)
    let knowledgeText = FALLBACK_KNOWLEDGE;
    try {
      const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: rows } = await supa
        .from("support_knowledge")
        .select("category, title, content")
        .eq("active", true)
        .order("category", { ascending: true });
      if (rows && rows.length > 0) {
        knowledgeText = rows
          .map((r) => `[${r.category}] ${r.title}: ${r.content}`)
          .join("\n");
      }
    } catch (e) {
      console.error("knowledge fetch error:", e);
    }

    const aiMessages = [
      { role: "system", content: buildSystemPrompt(knowledgeText) },
      ...cleaned,
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!aiResp.ok || !aiResp.body) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text().catch(() => "");
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("customer-support error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
