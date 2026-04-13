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

// Map product names to plan details
const PLAN_MAP: Record<string, { plan: string; tokenBudget: number }> = {
  titan:   { plan: "titan",   tokenBudget: 10_000_000 },
  atlas:   { plan: "atlas",   tokenBudget: 20_000_000 },
  olympus: { plan: "olympus", tokenBudget: 50_000_000 },
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
    // Authenticate user
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

    console.log(`Verifying subscription for ${user.email} (${user.id})`);

    // 1. Find Stripe customer by email
    const customers = await stripeGet(`/customers?email=${encodeURIComponent(user.email)}&limit=1`);
    if (!customers.data?.length) {
      return new Response(JSON.stringify({ error: "No Stripe customer found", plan: "scout" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const customer = customers.data[0];
    console.log(`Found Stripe customer: ${customer.id}`);

    // 2. Get active subscriptions
    const subs = await stripeGet(`/subscriptions?customer=${customer.id}&status=active&limit=1`);
    if (!subs.data?.length) {
      return new Response(JSON.stringify({ error: "No active subscription", plan: "scout" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripeSub = subs.data[0];
    console.log(`Active subscription: ${stripeSub.id}, metadata:`, stripeSub.metadata);

    // 3. Determine plan from subscription metadata or product name
    let planKey = stripeSub.metadata?.plan;

    if (!planKey) {
      // Fallback: check the product name
      const priceId = stripeSub.items?.data?.[0]?.price?.id;
      if (priceId) {
        const price = await stripeGet(`/prices/${priceId}?expand[]=product`);
        const productName = (price.product?.name || "").toLowerCase();
        for (const key of Object.keys(PLAN_MAP)) {
          if (productName.includes(key)) {
            planKey = key;
            break;
          }
        }
      }
    }

    if (!planKey || !PLAN_MAP[planKey]) {
      console.log(`Could not determine plan, defaulting. planKey=${planKey}`);
      return new Response(JSON.stringify({ plan: "scout", verified: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planInfo = PLAN_MAP[planKey];
    console.log(`Resolved plan: ${planKey}, upserting...`);

    // 4. Upsert subscription using service role
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ plan: planInfo.plan, verified: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-subscription error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
