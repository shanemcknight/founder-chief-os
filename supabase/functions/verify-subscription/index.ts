import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_MAP: Record<string, { plan: string; tokenBudget: number }> = {
  titan:   { plan: "titan",   tokenBudget: 10_000_000 },
  atlas:   { plan: "atlas",   tokenBudget: 20_000_000 },
  olympus: { plan: "olympus", tokenBudget: 50_000_000 },
};

// Lookup keys used in stripe-checkout
const LOOKUP_KEY_TO_PLAN: Record<string, string> = {
  mythos_titan_monthly: "titan",
  mythos_atlas_monthly: "atlas",
  mythos_olympus_monthly: "olympus",
};

async function stripeGet(path: string): Promise<any> {
  const resp = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  return resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[verify] Starting for ${user.email} (${user.id})`);

    // 1. Find Stripe customer by email
    const customers = await stripeGet(`/customers?email=${encodeURIComponent(user.email)}&limit=1`);
    if (!customers.data?.length) {
      console.log("[verify] No Stripe customer found");
      return new Response(JSON.stringify({ plan: "scout", verified: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const customer = customers.data[0];
    console.log(`[verify] Stripe customer: ${customer.id}`);

    // 2. Get active subscriptions
    const subs = await stripeGet(`/subscriptions?customer=${customer.id}&status=active&limit=5&expand[]=data.items.data.price`);
    if (!subs.data?.length) {
      console.log("[verify] No active subscriptions");
      return new Response(JSON.stringify({ plan: "scout", verified: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSub = subs.data[0];
    const priceObj = stripeSub.items?.data?.[0]?.price;
    const priceId = priceObj?.id;
    const lookupKey = priceObj?.lookup_key;
    const priceMeta = priceObj?.metadata;

    console.log(`[verify] Sub: ${stripeSub.id}`);
    console.log(`[verify] Sub metadata:`, JSON.stringify(stripeSub.metadata));
    console.log(`[verify] Price ID: ${priceId}, lookup_key: ${lookupKey}`);
    console.log(`[verify] Price metadata:`, JSON.stringify(priceMeta));

    // 3. Determine plan - try multiple resolution strategies
    let planKey: string | undefined;

    // Strategy 1: subscription metadata (set during checkout)
    planKey = stripeSub.metadata?.plan;
    if (planKey) console.log(`[verify] Resolved via sub metadata: ${planKey}`);

    // Strategy 2: price lookup key
    if (!planKey && lookupKey && LOOKUP_KEY_TO_PLAN[lookupKey]) {
      planKey = LOOKUP_KEY_TO_PLAN[lookupKey];
      console.log(`[verify] Resolved via lookup_key: ${planKey}`);
    }

    // Strategy 3: price metadata
    if (!planKey && priceMeta?.plan) {
      planKey = priceMeta.plan;
      console.log(`[verify] Resolved via price metadata: ${planKey}`);
    }

    // Strategy 4: product name contains plan name
    if (!planKey && priceObj?.product) {
      const productId = typeof priceObj.product === "string" ? priceObj.product : priceObj.product.id;
      const product = typeof priceObj.product === "object" ? priceObj.product : await stripeGet(`/products/${productId}`);
      const productName = (product.name || "").toLowerCase();
      console.log(`[verify] Product name: "${product.name}"`);
      for (const key of Object.keys(PLAN_MAP)) {
        if (productName.includes(key)) {
          planKey = key;
          console.log(`[verify] Resolved via product name: ${planKey}`);
          break;
        }
      }
    }

    // Strategy 5: match by price amount
    if (!planKey && priceObj?.unit_amount) {
      const amount = priceObj.unit_amount;
      console.log(`[verify] Price amount: ${amount} cents`);
      if (amount === 4900) planKey = "titan";
      else if (amount === 7900) planKey = "atlas";
      else if (amount === 14900) planKey = "olympus";
      if (planKey) console.log(`[verify] Resolved via price amount: ${planKey}`);
    }

    if (!planKey || !PLAN_MAP[planKey]) {
      console.log(`[verify] Could not resolve plan. planKey=${planKey}`);
      return new Response(JSON.stringify({ plan: "scout", verified: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planInfo = PLAN_MAP[planKey];
    console.log(`[verify] Final plan: ${planKey}, upserting...`);

    // 4. Upsert subscription
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const currentPeriodEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000).toISOString()
      : null;

    const { error: upsertError } = await adminSupabase
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        plan: planInfo.plan,
        token_budget: planInfo.tokenBudget,
        tokens_used: 0,
        status: "active",
        stripe_customer_id: customer.id,
        stripe_subscription_id: stripeSub.id,
        current_period_end: currentPeriodEnd,
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("[verify] Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[verify] ✅ Successfully set plan to ${planKey}`);
    return new Response(JSON.stringify({ plan: planInfo.plan, verified: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
