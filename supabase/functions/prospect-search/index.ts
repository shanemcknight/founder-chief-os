// Prospect discovery: dual-engine (Outscraper default, Apollo optional)
// Reads the user's stored API key from the api_keys table and queries the chosen engine.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Engine = "outscraper" | "apollo";

interface Lead {
  business_name: string;
  email: string;
  email_type: string;
  website: string;
  address: string;
  contact_name?: string;
  contact_title?: string;
  business_category: string;
  region: string;
  source: Engine;
}

function detectEmailType(email: string): string {
  if (!email) return "not found";
  const prefix = (email.split("@")[0] || "").toLowerCase();
  const matches = (list: string[]) =>
    list.some((k) => prefix === k || prefix.startsWith(`${k}.`) || prefix.startsWith(`${k}-`) || prefix.includes(k));
  if (matches(["owner", "founder", "proprietor", "principal"])) return "owner";
  if (matches(["ceo", "president", "gm", "director", "vp", "chief"])) return "decision maker";
  if (matches(["manager", "mgr", "operations", "ops"])) return "manager";
  if (matches(["info", "hello", "contact", "hi", "general", "support"])) return "info";
  if (matches(["sales", "booking", "events", "wholesale", "orders", "purchasing"])) return "sales";
  return "general";
}

async function searchOutscraper(apiKey: string, businessType: string, region: string, limit: number, region_param: string): Promise<Lead[]> {
  const url = new URL("https://api.app.outscraper.com/maps/search-v3");
  url.searchParams.set("query", `${businessType} in ${region}`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("async", "false");
  url.searchParams.set("fields", "name,full_address,site,emails_and_contacts,category");

  const res = await fetch(url.toString(), {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Outscraper ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  // Outscraper returns { data: [[...results]] } for sync calls
  const rows: any[] = Array.isArray(json?.data?.[0]) ? json.data[0] : Array.isArray(json?.data) ? json.data : [];

  const leads: Lead[] = [];
  for (const r of rows) {
    const emails: string[] = Array.isArray(r?.emails_and_contacts?.emails)
      ? r.emails_and_contacts.emails
      : [];
    const base = {
      business_name: r?.name || "",
      website: r?.site || "",
      address: r?.full_address || "",
      business_category: r?.category || businessType,
      region: region_param,
      source: "outscraper" as const,
    };
    if (emails.length === 0) {
      leads.push({ ...base, email: "", email_type: "not found" });
    } else {
      for (const email of emails) {
        leads.push({ ...base, email, email_type: detectEmailType(email) });
      }
    }
  }
  return leads;
}

async function searchApollo(apiKey: string, businessType: string, region: string, limit: number): Promise<Lead[]> {
  const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      Accept: "application/json",
    },
    body: JSON.stringify({
      q_keywords: `${businessType} ${region}`,
      per_page: limit,
      page: 1,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Apollo ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const people: any[] = Array.isArray(json?.people) ? json.people : [];
  return people.map((p) => {
    const email = p?.email || "";
    return {
      business_name: p?.organization?.name || "",
      email,
      email_type: detectEmailType(email),
      website: p?.organization?.website_url || "",
      address: [p?.city, p?.state].filter(Boolean).join(", "),
      contact_name: `${p?.first_name || ""} ${p?.last_name || ""}`.trim(),
      contact_title: p?.title || "",
      business_category: businessType,
      region,
      source: "apollo" as const,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const engine: Engine = body?.engine === "apollo" ? "apollo" : "outscraper";
    const business_type = String(body?.business_type || "").trim();
    const region = String(body?.region || "").trim();
    const limit = Math.max(1, Math.min(100, Number(body?.limit) || 20));

    if (!business_type || !region) {
      return new Response(JSON.stringify({ error: "missing_query", message: "business_type and region are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("service", engine)
      .maybeSingle();

    if (!keyRow?.api_key) {
      return new Response(JSON.stringify({ error: "no_api_key", engine }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let leads: Lead[] = [];
    if (engine === "outscraper") {
      leads = await searchOutscraper(keyRow.api_key, business_type, region, limit, region);
    } else {
      leads = await searchApollo(keyRow.api_key, business_type, region, limit);
    }

    return new Response(JSON.stringify({ leads, engine }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("prospect-search error", err);
    return new Response(
      JSON.stringify({ error: "search_failed", message: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
