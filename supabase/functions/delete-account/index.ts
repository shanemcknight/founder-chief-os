import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const type = body?.type;
    if (type !== "data" && type !== "account") {
      return new Response(
        JSON.stringify({ error: "Invalid type. Must be 'data' or 'account'." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const userId = user.id;

    // Delete user data — order matters for FKs
    // Delete proposed_actions and messages via conversations cascade (no cascade defined, so do it explicitly)
    const { data: convs } = await admin
      .from("conversations")
      .select("id")
      .eq("user_id", userId);
    const convIds = (convs ?? []).map((c: { id: string }) => c.id);

    if (convIds.length > 0) {
      // Get message ids to delete proposed_actions referencing them
      const { data: msgs } = await admin
        .from("messages")
        .select("id")
        .in("conversation_id", convIds);
      const msgIds = (msgs ?? []).map((m: { id: string }) => m.id);
      if (msgIds.length > 0) {
        await admin.from("proposed_actions").delete().in("message_id", msgIds);
      }
      await admin.from("messages").delete().in("conversation_id", convIds);
    }

    await admin.from("approvals_log").delete().eq("user_id", userId);
    await admin.from("email_drafts").delete().eq("user_id", userId);
    await admin.from("emails").delete().eq("user_id", userId);
    await admin.from("conversations").delete().eq("user_id", userId);
    await admin.from("agent_context").delete().eq("user_id", userId);
    await admin.from("email_accounts").delete().eq("user_id", userId);

    if (type === "data") {
      await admin
        .from("profiles")
        .update({ onboarding_complete: false })
        .eq("user_id", userId);
      return new Response(JSON.stringify({ success: true, type: "data" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // type === "account" — also delete supplementary user data + profile + auth user
    await admin.from("activity_log").delete().eq("user_id", userId);
    await admin.from("notifications").delete().eq("user_id", userId);
    await admin.from("user_integrations").delete().eq("user_id", userId);
    await admin.from("user_oauth_tokens").delete().eq("user_id", userId);
    await admin.from("social_connections").delete().eq("user_id", userId);
    await admin.from("social_posts").delete().eq("user_id", userId);
    await admin.from("social_brand_voice_rules").delete().eq("user_id", userId);
    await admin.from("social_content_pillars").delete().eq("user_id", userId);
    await admin.from("social_platform_guides").delete().eq("user_id", userId);
    await admin.from("social_shot_lists").delete().eq("user_id", userId);
    await admin.from("subscriptions").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("user_id", userId);

    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return new Response(
        JSON.stringify({ error: deleteErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, type: "account" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
