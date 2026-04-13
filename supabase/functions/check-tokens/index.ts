import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsH = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsH });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsH });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsH });
    }
    const userId = claimsData.claims.sub;

    const adminSupabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Check BYOK - if user has their own Anthropic key, skip token check
    const { data: profile } = await adminSupabase.from("profiles").select("anthropic_api_key").eq("user_id", userId).single();
    if (profile?.anthropic_api_key) {
      return new Response(JSON.stringify({ allowed: true, byok: true }), { headers: { ...corsH, "Content-Type": "application/json" } });
    }

    // Check subscription tokens
    const { data: sub } = await adminSupabase.from("subscriptions").select("*").eq("user_id", userId).single();
    const plan = sub?.plan || "scout";
    const tokensUsed = sub?.tokens_used || 0;
    const tokenBudget = sub?.token_budget || 500_000;
    const periodEnd = sub?.current_period_end;

    if (tokensUsed >= tokenBudget) {
      return new Response(JSON.stringify({
        allowed: false,
        error: "token_limit_reached",
        plan,
        tokens_used: tokensUsed,
        token_budget: tokenBudget,
        period_end: periodEnd,
        upgrade_url: "/pricing",
      }), { status: 429, headers: { ...corsH, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      allowed: true,
      plan,
      tokens_used: tokensUsed,
      token_budget: tokenBudget,
      tokens_remaining: tokenBudget - tokensUsed,
    }), { headers: { ...corsH, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Token check error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsH });
  }
});
