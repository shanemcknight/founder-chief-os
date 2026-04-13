import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
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
    const { data: sub } = await adminSupabase.from("subscriptions").select("stripe_customer_id").eq("user_id", userId).single();

    if (!sub?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "No subscription found" }), { status: 404, headers: corsH });
    }

    const { returnUrl } = await req.json().catch(() => ({}));

    const portalResp = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: sub.stripe_customer_id,
        return_url: returnUrl || "https://founder-chief-os.lovable.app/settings",
      }),
    });
    const portal = await portalResp.json();

    return new Response(JSON.stringify({ url: portal.url }), { headers: { ...corsH, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Portal error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsH });
  }
});
