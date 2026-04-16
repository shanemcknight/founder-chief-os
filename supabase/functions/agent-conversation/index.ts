// GET /agent-conversation?id=uuid — fetch one conversation + all messages, with proposed_actions joined onto type='proposal' messages.

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
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: convo, error: convErr } = await supabase
      .from("conversations")
      .select("id, title, status, agent_id, updated_at")
      .eq("id", id)
      .single();
    if (convErr || !convo) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: messages } = await supabase
      .from("messages")
      .select("id, sender, type, content, metadata, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    const msgs = messages || [];
    const proposalIds = msgs.filter((m) => m.type === "proposal").map((m) => m.id);
    let actionsByMsg: Record<string, unknown> = {};
    if (proposalIds.length > 0) {
      const { data: actions } = await supabase
        .from("proposed_actions")
        .select("id, message_id, action_type, draft_content, status, approval_timestamp, executed_at")
        .in("message_id", proposalIds);
      for (const a of actions || []) actionsByMsg[a.message_id] = a;
    }

    const enriched = msgs.map((m) => ({ ...m, proposedAction: actionsByMsg[m.id] || null }));

    return new Response(JSON.stringify({ conversation: convo, messages: enriched }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-conversation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
