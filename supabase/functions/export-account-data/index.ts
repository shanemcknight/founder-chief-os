import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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

    const admin = createClient(supabaseUrl, serviceKey);
    const userId = user.id;

    // Helper to fetch a table scoped to the user
    const fetchTable = async (table: string) => {
      const { data, error } = await admin
        .from(table)
        // deno-lint-ignore no-explicit-any
        .select("*" as any)
        .eq("user_id", userId);
      if (error) {
        console.warn(`export: failed to read ${table}`, error.message);
        return [];
      }
      return data ?? [];
    };

    const [
      profile,
      subscription,
      emails,
      emailDrafts,
      emailAccounts,
      conversations,
      agentContext,
      activityLog,
      notifications,
      userIntegrations,
      socialConnections,
      socialPosts,
      socialPillars,
      socialVoiceRules,
      socialPlatformGuides,
      socialShotLists,
    ] = await Promise.all([
      fetchTable("profiles"),
      fetchTable("subscriptions"),
      fetchTable("emails"),
      fetchTable("email_drafts"),
      fetchTable("email_accounts"),
      fetchTable("conversations"),
      fetchTable("agent_context"),
      fetchTable("activity_log"),
      fetchTable("notifications"),
      fetchTable("user_integrations"),
      fetchTable("social_connections"),
      fetchTable("social_posts"),
      fetchTable("social_content_pillars"),
      fetchTable("social_brand_voice_rules"),
      fetchTable("social_platform_guides"),
      fetchTable("social_shot_lists"),
    ]);

    // Messages and proposed_actions are scoped by conversation, not user_id
    const convIds = (conversations as Array<{ id: string }>).map((c) => c.id);
    let messages: unknown[] = [];
    let proposedActions: unknown[] = [];
    let approvalsLog: unknown[] = [];

    if (convIds.length > 0) {
      const { data: msgs } = await admin
        .from("messages")
        .select("*")
        .in("conversation_id", convIds);
      messages = msgs ?? [];

      const msgIds = (messages as Array<{ id: string }>).map((m) => m.id);
      if (msgIds.length > 0) {
        const { data: pa } = await admin
          .from("proposed_actions")
          .select("*")
          .in("message_id", msgIds);
        proposedActions = pa ?? [];
      }
    }

    const { data: appr } = await admin
      .from("approvals_log")
      .select("*")
      .eq("user_id", userId);
    approvalsLog = appr ?? [];

    const exportPayload = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        user_id: userId,
        email: user.email,
        format_version: "1.0",
        source: "MythosHQ",
        notice:
          "This file contains all personal data MythosHQ holds about your account. Provided under GDPR Article 20 (Right to data portability).",
      },
      account: {
        profile,
        subscription,
      },
      inbox: {
        emails,
        email_drafts: emailDrafts,
        email_accounts: emailAccounts,
      },
      agents: {
        conversations,
        messages,
        proposed_actions: proposedActions,
        approvals_log: approvalsLog,
        agent_context: agentContext,
      },
      activity: {
        activity_log: activityLog,
        notifications,
      },
      integrations: {
        user_integrations: userIntegrations,
        social_connections: socialConnections,
      },
      social: {
        posts: socialPosts,
        content_pillars: socialPillars,
        brand_voice_rules: socialVoiceRules,
        platform_guides: socialPlatformGuides,
        shot_lists: socialShotLists,
      },
    };

    const filename = `mythoshq-data-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
