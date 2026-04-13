import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PRICE_MAP: Record<string, { name: string; priceInCents: number; tokenBudget: number }> = {
  titan:   { name: "TITAN",   priceInCents: 4900,  tokenBudget: 10_000_000 },
  atlas:   { name: "ATLAS",   priceInCents: 7900,  tokenBudget: 20_000_000 },
  olympus: { name: "OLYMPUS", priceInCents: 14900, tokenBudget: 50_000_000 },
};

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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsH });
    }
    const userId = user.id;
    const userEmail = user.email;

    const { plan, successUrl, cancelUrl } = await req.json();
    if (!plan || !PRICE_MAP[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: corsH });
    }

    const planInfo = PRICE_MAP[plan];

    // Check for existing Stripe customer
    const adminSupabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: sub } = await adminSupabase.from("subscriptions").select("stripe_customer_id").eq("user_id", userId).single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      const custResp = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email: userEmail || "", "metadata[user_id]": userId }),
      });
      const cust = await custResp.json();
      customerId = cust.id;
    }

    // Create a Stripe Price on-the-fly (or use lookup)
    const priceResp = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        unit_amount: String(planInfo.priceInCents),
        currency: "usd",
        "recurring[interval]": "month",
        "product_data[name]": `Mythos HQ ${planInfo.name}`,
        "metadata[plan]": plan,
      }),
    });
    const price = await priceResp.json();

    // Create Checkout Session
    const sessionResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId!,
        "line_items[0][price]": price.id,
        "line_items[0][quantity]": "1",
        mode: "subscription",
        success_url: successUrl || "https://founder-chief-os.lovable.app/dashboard?subscription=success",
        cancel_url: cancelUrl || "https://founder-chief-os.lovable.app/pricing",
        "metadata[user_id]": userId,
        "metadata[plan]": plan,
        "subscription_data[metadata][user_id]": userId,
        "subscription_data[metadata][plan]": plan,
      }),
    });
    const session = await sessionResp.json();

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsH, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsH });
  }
});
