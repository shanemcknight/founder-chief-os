// POST /agent-approve — record approve/reject/edit decision and stub the executor.
// Body: { actionId: uuid, decision: 'approved'|'rejected'|'edited_and_approved', editedContent?: object, notes?: string }

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
    const userId = userData.user.id;

    const { actionId, decision, editedContent, notes } = await req.json();
    const allowedDecisions = ["approved", "rejected", "edited_and_approved"];
    if (!actionId || !allowedDecisions.includes(decision)) {
      return new Response(JSON.stringify({ error: "actionId and valid decision required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load action; RLS ensures user can only see their own
    const { data: action, error: actErr } = await supabase
      .from("proposed_actions")
      .select("id, action_type, draft_content, status")
      .eq("id", actionId)
      .single();
    if (actErr || !action) {
      return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const newStatus = decision === "rejected" ? "rejected" : "approved";
    const updates: Record<string, unknown> = {
      status: newStatus,
      approval_timestamp: new Date().toISOString(),
    };
    if (editedContent && (decision === "edited_and_approved" || decision === "approved")) {
      updates.draft_content = editedContent;
    }

    await supabase.from("proposed_actions").update(updates).eq("id", actionId);

    await supabase.from("approvals_log").insert({
      action_id: actionId,
      decision,
      user_id: userId,
      edited_content: editedContent ?? null,
      notes: notes ?? null,
    });

    if (newStatus === "approved") {
      const draft = editedContent ?? action.draft_content;
      switch (action.action_type) {
        case "send_email":
          console.log("STUB: Would call Resend API with:", JSON.stringify(draft));
          break;
        case "post_social":
          console.log("STUB: Would call Nango LinkedIn with:", JSON.stringify(draft));
          break;
        case "update_crm":
          console.log("STUB: Would call HubSpot with:", JSON.stringify(draft));
          break;
        case "create_order":
          console.log("STUB: Would call Shopify with:", JSON.stringify(draft));
          break;
        default:
          console.log("STUB: Unknown action type", action.action_type);
      }
      await supabase.from("proposed_actions").update({ status: "executed", executed_at: new Date().toISOString() }).eq("id", actionId);
    }

    return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-approve error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
