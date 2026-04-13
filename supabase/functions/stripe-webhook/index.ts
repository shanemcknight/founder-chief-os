import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TOKEN_BUDGETS: Record<string, number> = {
  scout: 500_000,
  titan: 10_000_000,
  atlas: 20_000_000,
  olympus: 50_000_000,
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log("Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan || "titan";
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!userId) { console.error("No user_id in metadata"); break; }

        // Get subscription details from Stripe
        const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        const stripeSub = await subResp.json();

        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: "active",
          token_budget: TOKEN_BUDGETS[plan] || 500_000,
          tokens_used: 0,
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        }, { onConflict: "user_id" });

        if (error) console.error("Upsert error:", error);
        else console.log(`Subscription created for user ${userId}, plan: ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const plan = sub.metadata?.plan || "titan";
        const userId = sub.metadata?.user_id;

        if (!userId) { console.error("No user_id in subscription metadata"); break; }

        await supabase.from("subscriptions").update({
          plan,
          status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status,
          token_budget: TOKEN_BUDGETS[plan] || 500_000,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq("user_id", userId);

        console.log(`Subscription updated for user ${userId}, plan: ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id;

        if (!userId) { console.error("No user_id in subscription metadata"); break; }

        await supabase.from("subscriptions").update({
          plan: "scout",
          status: "canceled",
          stripe_subscription_id: null,
          token_budget: TOKEN_BUDGETS.scout,
          current_period_end: null,
        }).eq("user_id", userId);

        console.log(`Subscription canceled for user ${userId}, downgraded to SCOUT`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), { status: 500 });
  }
});
