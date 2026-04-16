// GET /agent-conversations?agentId=uuid — list user's conversations for an agent with last message preview.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId");

    let q = supabase.from("conversations").select("id, title, status, updated_at, agent_id").order("updated_at", { ascending: false });
    if (agentId) q = q.eq("agent_id", agentId);

    const { data: convos, error: cErr } = await q;
    if (cErr) {
      console.error(cErr);
      return new Response(JSON.stringify({ error: cErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get last message per conversation in one query
    const ids = (convos || []).map((c) => c.id);
    let previews: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });
      const seen = new Set<string>();
      for (const m of msgs || []) {
        if (seen.has(m.conversation_id)) continue;
        seen.add(m.conversation_id);
        previews[m.conversation_id] = m.content.length > 60 ? m.content.slice(0, 60) + "…" : m.content;
      }
    }

    const result = (convos || []).map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      agentId: c.agent_id,
      lastMessage: previews[c.id] || "",
      updatedAt: c.updated_at,
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-conversations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
