import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NANGO_API_URL = "https://api.nango.dev";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!NANGO_SECRET_KEY) {
      throw new Error("NANGO_SECRET_KEY is not configured");
    }
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Nango connection
    const { data: integration } = await supabase
      .from("user_integrations")
      .select("nango_connection_id")
      .eq("user_id", user.id)
      .eq("provider", "outlook")
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: "No Outlook connection found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch emails via Nango proxy
    const nangoRes = await fetch(
      `${NANGO_API_URL}/proxy/v1.0/me/messages?$top=20&$orderby=receivedDateTime%20desc&$select=id,from,subject,bodyPreview,body,receivedDateTime`,
      {
        headers: {
          Authorization: `Bearer ${NANGO_SECRET_KEY}`,
          "Connection-Id": integration.nango_connection_id,
          "Provider-Config-Key": "microsoft",
        },
      }
    );

    if (!nangoRes.ok) {
      const errText = await nangoRes.text();
      throw new Error(`Nango proxy error [${nangoRes.status}]: ${errText}`);
    }

    const emailData = await nangoRes.json();
    const messages = emailData.value || [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare batch for AI categorization
    const emailSummaries = messages.map((m: any) => ({
      id: m.id,
      from: m.from?.emailAddress?.address || "",
      fromName: m.from?.emailAddress?.name || "",
      subject: m.subject || "",
      preview: (m.bodyPreview || "").substring(0, 300),
    }));

    // Call AI for categorization via Lovable AI Gateway
    let categorizations: any[] = [];
    try {
      const aiRes = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an email triage AI. For each email, return a JSON array with objects containing:
- "id": the email id
- "category": one of "urgent", "lead", "customer", "vendor", "admin", "noise"
- "summary": a one-line summary (max 80 chars) starting with a verb or key topic
- "draft_reply": a short professional reply draft (2-3 sentences)

Return ONLY valid JSON array, no markdown.`,
            },
            {
              role: "user",
              content: JSON.stringify(emailSummaries),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content || "[]";
        try {
          const parsed = JSON.parse(content);
          categorizations = Array.isArray(parsed) ? parsed : parsed.emails || parsed.results || [];
        } catch {
          console.error("Failed to parse AI response:", content);
        }
      } else {
        console.error("AI categorization failed:", await aiRes.text());
      }
    } catch (aiErr) {
      console.error("AI gateway unreachable, syncing without categorization:", aiErr);
    }

    const catMap = new Map(categorizations.map((c: any) => [c.id, c]));

    // Upsert emails
    let synced = 0;
    for (const m of messages) {
      const cat = catMap.get(m.id);
      const { error: upsertErr } = await supabase.from("emails").upsert(
        {
          user_id: user.id,
          external_id: m.id,
          provider: "outlook",
          from_email: m.from?.emailAddress?.address || null,
          from_name: m.from?.emailAddress?.name || null,
          subject: m.subject || null,
          body_preview: (m.bodyPreview || "").substring(0, 500),
          body_full: m.body?.content || null,
          received_at: m.receivedDateTime || null,
          category: cat?.category || "admin",
          chief_summary: cat?.summary || null,
        },
        { onConflict: "user_id,external_id" }
      );

      if (upsertErr) {
        console.error("Upsert email error:", upsertErr);
        continue;
      }

      // Create draft reply if AI provided one
      if (cat?.draft_reply) {
        // Get the email ID we just upserted
        const { data: emailRow } = await supabase
          .from("emails")
          .select("id")
          .eq("user_id", user.id)
          .eq("external_id", m.id)
          .single();

        if (emailRow) {
          await supabase.from("email_drafts").upsert(
            {
              user_id: user.id,
              email_id: emailRow.id,
              draft_body: cat.draft_reply,
              status: "pending",
            },
            { onConflict: "user_id,email_id" }
          );
        }
      }

      synced++;
    }

    return new Response(JSON.stringify({ synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-emails error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
