import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PLAN_CONFIG: Record<string, { name: string; priceInCents: number; tokenBudget: number; lookupKey: string }> = {
  titan:   { name: "Mythos HQ TITAN",   priceInCents: 4900,  tokenBudget: 10_000_000, lookupKey: "mythos_titan_monthly" },
  atlas:   { name: "Mythos HQ ATLAS",   priceInCents: 7900,  tokenBudget: 20_000_000, lookupKey: "mythos_atlas_monthly" },
  olympus: { name: "Mythos HQ OLYMPUS", priceInCents: 14900, tokenBudget: 50_000_000, lookupKey: "mythos_olympus_monthly" },
};

const corsH = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function stripePost(path: string, body: Record<string, string>): Promise<any> {
  const resp = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  return resp.json();
}

async function stripeGet(path: string): Promise<any> {
  const resp = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  return resp.json();
}

// Find or create a stable price with a lookup_key
async function ensurePrice(plan: string): Promise<string> {
  const config = PLAN_CONFIG[plan];

  // Check for existing price with this lookup key
  const existing = await stripeGet(`/prices?lookup_keys[]=${config.lookupKey}&active=true&limit=1`);
  if (existing.data?.length) {
    console.log(`Found existing price for ${plan}: ${existing.data[0].id}`);
    return existing.data[0].id;
  }

  // Create product
  const product = await stripePost("/products", {
    name: config.name,
    "metadata[plan]": plan,
  });
  console.log(`Created product for ${plan}: ${product.id}`);

  // Create price with lookup key
  const price = await stripePost("/prices", {
    product: product.id,
    unit_amount: String(config.priceInCents),
    currency: "usd",
    "recurring[interval]": "month",
    lookup_key: config.lookupKey,
    "metadata[plan]": plan,
  });
  console.log(`Created price for ${plan}: ${price.id}`);

  return price.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsH });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsH });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsH });
    }
    const userId = user.id;
    const userEmail = user.email;

    const { plan, successUrl, cancelUrl } = await req.json();
    if (!plan || !PLAN_CONFIG[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: corsH });
    }

    // Check for existing Stripe customer
    const adminSupabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: sub } = await adminSupabase.from("subscriptions").select("stripe_customer_id").eq("user_id", userId).single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const cust = await stripePost("/customers", {
        email: userEmail || "",
        "metadata[user_id]": userId,
      });
      customerId = cust.id;
    }

    // Get or create stable price
    const priceId = await ensurePrice(plan);

    // Create Checkout Session
    const session = await stripePost("/checkout/sessions", {
      customer: customerId!,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: successUrl || "https://founder-chief-os.lovable.app/dashboard?subscription=success",
      cancel_url: cancelUrl || "https://founder-chief-os.lovable.app/pricing",
      "metadata[user_id]": userId,
      "metadata[plan]": plan,
      "subscription_data[metadata][user_id]": userId,
      "subscription_data[metadata][plan]": plan,
    });

    console.log(`Checkout session created: ${session.id} for plan ${plan}, price ${priceId}`);

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsH, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsH });
  }
});
