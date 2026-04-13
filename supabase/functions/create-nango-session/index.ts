import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY");
    console.log("NANGO_SECRET_KEY present:", !!NANGO_SECRET_KEY);
    if (!NANGO_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "NANGO_SECRET_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating Nango session for user:", user.id, "email:", user.email);

    const nangoBody = {
      end_user: { id: user.id, email: user.email },
      allowed_integrations: ["microsoft"],
    };
    console.log("Nango request body:", JSON.stringify(nangoBody));

    const res = await fetch("https://api.nango.dev/connect/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NANGO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nangoBody),
    });

    const responseData = await res.json();
    console.log("Nango API status:", res.status, "response:", JSON.stringify(responseData));

    if (!res.ok) {
      console.error("Nango API error:", res.status, JSON.stringify(responseData));
      return new Response(JSON.stringify({ error: "Nango API error", details: responseData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!responseData.token) {
      console.error("No token in Nango response:", JSON.stringify(responseData));
      return new Response(JSON.stringify({ error: "No token in Nango response", details: responseData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Returning token, length:", responseData.token.length);
    return new Response(JSON.stringify({ token: responseData.token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-nango-session error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
