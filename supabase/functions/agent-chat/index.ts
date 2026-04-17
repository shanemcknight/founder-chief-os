// POST /agent-chat — streams Lovable AI responses, persists messages, detects proposed actions.
// Body: { conversationId: uuid, agentId: uuid, agentName: string, message: string }
// Returns: SSE stream of token deltas, terminated by [DONE].
// Token gating: BYOK users skip all checks. Otherwise enforce subscriptions.token_budget,
// emit warnings at 80%/95%, block at 100%, and silently rate-limit >50 msgs/10min.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_PROMPTS: Record<string, string> = {
  CHIEF:
    "You are CHIEF, the user's executive assistant for Top Hat Provisions (a craft beverage brand). Triage email, draft responses in brand voice, surface high-priority decisions, and never act without approval. Be concise, decisive, warm. When you draft a high-stakes action (sending an email, posting to social, updating CRM, creating an order), emit a proposal block on its own line in the form:\n[[PROPOSE_ACTION type=send_email|post_social|update_crm|create_order|other summary=\"one-line summary\"]]\n<draft body here>\n[[/PROPOSE_ACTION]]\nOnly emit one proposal per reply. Otherwise, just chat normally.",
  ORACLE:
    "You are ORACLE, the inbox specialist. Categorize incoming email, identify high-intent leads, and draft polished replies. Never send without user approval. When drafting an email, emit:\n[[PROPOSE_ACTION type=send_email summary=\"...\"]]\n<draft>\n[[/PROPOSE_ACTION]]",
  FORGE:
    "You are FORGE, the operations agent. Sync inventory, monitor Shopify and Amazon listings, flag listing issues. When proposing an order or inventory change, emit a [[PROPOSE_ACTION ...]] block.",
  "CLAUDE-DIRECT": "You are Claude, a helpful AI assistant.",
  RESEARCH:
    "You are a deep research specialist. Produce comprehensive cited reports with numbered sources. Use web search for current information. Structure with clear section headings (use markdown ## headings), body paragraphs, inline footnote markers like [1] [2], and a numbered Sources list at the end with real URLs. Be thorough and specific.",
};

// Agents that bypass the approval workflow (no proposal detection, no business context).
const DIRECT_AGENTS = new Set(["CLAUDE-DIRECT", "RESEARCH"]);

function detectProposal(text: string): { actionType: string; summary: string; draft: string } | null {
  const re = /\[\[PROPOSE_ACTION\s+type=(\w+)(?:\s+summary="([^"]*)")?\s*\]\]([\s\S]*?)\[\[\/PROPOSE_ACTION\]\]/i;
  const m = text.match(re);
  if (!m) return null;
  const allowed = ["send_email", "post_social", "update_crm", "create_order", "other"];
  const actionType = allowed.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : "other";
  return { actionType, summary: m[2] || "", draft: m[3].trim() };
}

// Rough token estimator (~4 chars per token) used as fallback if gateway omits usage.
function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    // Service-role client used for tracking writes that bypass RLS (subscriptions row).
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { conversationId, agentName, message } = await req.json();
    if (!conversationId || !message) {
      return new Response(JSON.stringify({ error: "conversationId and message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── TOKEN GATING ────────────────────────────────────────────────────────────
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("anthropic_api_key, openai_api_key, gemini_api_key")
      .eq("user_id", userId)
      .single();
    const hasByok = !!(profile?.anthropic_api_key || profile?.openai_api_key || profile?.gemini_api_key);

    let tokensUsed = 0;
    let tokenBudget = 500_000;
    let warning: { level: "low" | "critical"; percent: number } | null = null;

    if (!hasByok) {
      // Silent abuse rate-limit: > 50 user messages in last 10 minutes
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count: recentCount } = await adminSupabase
        .from("messages")
        .select("id, conversation:conversations!inner(user_id)", { count: "exact", head: true })
        .eq("sender", "user")
        .eq("conversation.user_id", userId)
        .gte("created_at", tenMinAgo);
      if ((recentCount ?? 0) > 50) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sub } = await adminSupabase
        .from("subscriptions")
        .select("plan, tokens_used, token_budget")
        .eq("user_id", userId)
        .single();
      tokensUsed = sub?.tokens_used ?? 0;
      tokenBudget = sub?.token_budget ?? 500_000;
      const usagePercent = (tokensUsed / tokenBudget) * 100;

      if (usagePercent >= 100) {
        return new Response(JSON.stringify({
          error: "token_budget_exceeded",
          warning_level: "blocked",
          message: "You've used all your tokens for this month.",
          tokens_used: tokensUsed,
          token_budget: tokenBudget,
          upgrade_url: "/pricing",
          byok_url: "/settings",
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (usagePercent >= 95) warning = { level: "critical", percent: usagePercent };
      else if (usagePercent >= 80) warning = { level: "low", percent: usagePercent };
    }

    // Verify conversation ownership and load history
    const { data: convo, error: convErr } = await supabase
      .from("conversations")
      .select("id, user_id, agent_id")
      .eq("id", conversationId)
      .single();
    if (convErr || !convo || convo.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: history } = await supabase
      .from("messages")
      .select("sender, content, type")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender: "user",
      type: "text",
      content: message,
    });

    const systemPrompt = AGENT_PROMPTS[agentName?.toUpperCase()] || AGENT_PROMPTS.CHIEF;
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(history || []).filter((m) => m.type !== "thinking" && m.type !== "system").map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
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

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!aiResp.body) {
      return new Response(JSON.stringify({ error: "No stream body" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Tee the stream: forward to client and accumulate full text for persistence.
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullText = "";
    let usageTotalTokens: number | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        // Emit a meta event up front so the client can render warnings before the first token.
        if (warning) {
          controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ warning })}\n\n`));
        }

        const reader = aiResp.body!.getReader();
        let textBuffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(value);
            textBuffer += chunk;
            // Parse line by line to extract content tokens for fullText
            let nl: number;
            while ((nl = textBuffer.indexOf("\n")) !== -1) {
              let line = textBuffer.slice(0, nl);
              textBuffer = textBuffer.slice(nl + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (json === "[DONE]") continue;
              try {
                const parsed = JSON.parse(json);
                const c = parsed.choices?.[0]?.delta?.content;
                if (typeof c === "string") fullText += c;
                if (parsed.usage?.total_tokens) usageTotalTokens = parsed.usage.total_tokens;
              } catch {
                /* partial JSON */
              }
            }
          }
        } catch (e) {
          console.error("stream read error:", e);
        } finally {
          controller.close();

          // Persist agent message + proposal (best-effort, after stream ends)
          try {
            const proposal = detectProposal(fullText);
            const cleanedText = proposal
              ? fullText.replace(/\[\[PROPOSE_ACTION[\s\S]*?\[\[\/PROPOSE_ACTION\]\]/i, "").trim() ||
                `Drafted: ${proposal.summary}`
              : fullText;

            const { data: msgRow } = await supabase
              .from("messages")
              .insert({
                conversation_id: conversationId,
                sender: "agent",
                type: proposal ? "proposal" : "text",
                content: cleanedText,
                metadata: proposal ? { proposalType: proposal.actionType, summary: proposal.summary } : null,
              })
              .select("id")
              .single();

            if (proposal && msgRow) {
              await supabase.from("proposed_actions").insert({
                message_id: msgRow.id,
                action_type: proposal.actionType,
                draft_content: { summary: proposal.summary, draft: proposal.draft, agentName },
                status: "pending",
              });
              console.log("STUB: Would email user about new proposed action", { conversationId, actionType: proposal.actionType });
            }

            // Touch conversation updated_at
            await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

            // Track token usage for non-BYOK users (admin client bypasses RLS).
            if (!hasByok) {
              const consumed = usageTotalTokens ?? (estimateTokens(message) + estimateTokens(fullText));
              await adminSupabase
                .from("subscriptions")
                .update({ tokens_used: tokensUsed + consumed })
                .eq("user_id", userId);
            }
          } catch (e) {
            console.error("persist error:", e);
          }
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
