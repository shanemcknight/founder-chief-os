import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TOKEN_BUDGETS: Record<string, number> = {
  scout: 500_000,
  titan: 10_000_000,
  atlas: 20_000_000,
  olympus: 50_000_000,
};

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe-signature header");
      return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    console.log("Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // 1. Retrieve the full session with expanded subscription & customer
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['subscription', 'customer'],
        });

        console.log("Full session object:", JSON.stringify(fullSession, null, 2));

        const subscriptionObj = fullSession.subscription as Stripe.Subscription | null;
        const plan = fullSession.metadata?.plan || "titan";

        // 2. Determine user_id: first from metadata, then by matching email
        let userId = fullSession.metadata?.user_id || null;

        if (!userId && fullSession.customer_details?.email) {
          // Look up user by email in auth.users via admin API
          const { data: userData } = await supabase.auth.admin.listUsers();
          const matchedUser = userData?.users?.find(
            (u: any) => u.email === fullSession.customer_details!.email
          );
          if (matchedUser) {
            userId = matchedUser.id;
            console.log(`Matched user by email: ${fullSession.customer_details.email} -> ${userId}`);
          }
        }

        if (!userId) {
          console.error("No user_id found in metadata or by email match");
          break;
        }

        const customerId = typeof fullSession.customer === 'string'
          ? fullSession.customer
          : (fullSession.customer as any)?.id;

        const subscriptionId = typeof fullSession.subscription === 'string'
          ? fullSession.subscription
          : subscriptionObj?.id;

        const currentPeriodEnd = subscriptionObj?.current_period_end
          ? new Date(subscriptionObj.current_period_end * 1000).toISOString()
          : null;

        // 3. Upsert into subscriptions table
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          plan,
          status: "active",
          token_budget: TOKEN_BUDGETS[plan] || 500_000,
          tokens_used: 0,
          current_period_end: currentPeriodEnd,
        }, { onConflict: "user_id" });

        if (error) console.error("Upsert error:", JSON.stringify(error));
        else console.log(`Subscription created/updated for user ${userId}, plan: ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
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
        const sub = event.data.object as Stripe.Subscription;
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

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("stripe_subscription_id", invoice.subscription)
            .single();

          if (subData && subData.status !== "canceled") {
            await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("stripe_subscription_id", invoice.subscription);
            console.log(`Marked subscription ${invoice.subscription} as past_due`);
          }
        }
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
