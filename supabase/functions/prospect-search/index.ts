import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Prospect {
  biz: string;
  loc: string;
  contact: string;
  title: string;
  email: string;
  emails: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    if (!query) return json({ error: "Query is required" }, 400);

    // Read user's Outscraper API key
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: keyRow } = await admin
      .from("api_keys")
      .select("api_key")
      .eq("user_id", userId)
      .eq("service", "outscraper")
      .maybeSingle();

    const apiKey = keyRow?.api_key as string | undefined;
    if (!apiKey) {
      return json(
        {
          error:
            "No Outscraper API key found. Add one in Discovery Settings to start searching.",
          code: "missing_api_key",
        },
        400
      );
    }

    // Call Outscraper Google Maps search (synchronous wait for results)
    // enrichment=domains_service runs the Emails & Contacts Scraper on each result.
    const url = new URL("https://api.app.outscraper.com/maps/search-v3");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", "20");
    url.searchParams.set("async", "false");
    url.searchParams.append("enrichment", "domains_service");
    url.searchParams.set("dropEmailDuplicates", "true");

    const res = await fetch(url.toString(), {
      headers: { "X-API-KEY": apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      return json(
        { error: `Outscraper request failed: ${res.status} ${text.slice(0, 200)}` },
        502
      );
    }

    const payload = await res.json();
    const rawList: any[] = Array.isArray(payload?.data?.[0])
      ? payload.data[0]
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const prospects: Prospect[] = rawList
      .map((r: any) => {
        // Collect emails from all known shapes returned by Outscraper enrichment.
        const collected: string[] = [];
        const pushAll = (v: any) => {
          if (!v) return;
          if (Array.isArray(v)) {
            for (const item of v) {
              if (typeof item === "string") collected.push(item);
              else if (item && typeof item === "object") {
                if (typeof item.value === "string") collected.push(item.value);
                else if (typeof item.email === "string") collected.push(item.email);
              }
            }
          } else if (typeof v === "string") {
            collected.push(v);
          }
        };
        pushAll(r.emails_validated);
        pushAll(r.emails);
        for (let i = 1; i <= 10; i++) pushAll(r[`email_${i}`]);
        pushAll(r.email);

        const emails = Array.from(
          new Set(
            collected
              .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
              .filter((e) => e && /.+@.+\..+/.test(e))
          )
        );

        const contact =
          r.owner_name ||
          r.contact_name ||
          (Array.isArray(r.owners) && r.owners[0]?.name) ||
          "";
        return {
          biz: r.name || r.title || "",
          loc:
            r.full_address ||
            r.address ||
            [r.city, r.state, r.country].filter(Boolean).join(", "),
          contact,
          title: r.owner_title || (contact ? "Owner" : ""),
          email: emails[0] || "",
          emails,
        };
      })
      .filter((p) => p.biz && p.emails.length > 0);

    return json({ prospects });
  } catch (err) {
    console.error("prospect-search error", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
