// One-click unsubscribe handler. Validates HMAC token, marks sequences as
// unsubscribed, records the unsubscribe, tags the contact, and returns a
// simple HTML confirmation page.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function htmlPage(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center}
  .card{max-width:440px}
  h1{font-size:20px;margin:0 0 12px;font-weight:600}
  p{font-size:14px;line-height:1.5;color:#555;margin:0}
</style></head><body><div class="card">${body}</div></body></html>`,
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const contact_id = url.searchParams.get("contact_id") || "";
    const user_id = url.searchParams.get("user_id") || "";
    const token = url.searchParams.get("token") || "";

    if (!contact_id || !user_id || !token) {
      return htmlPage("Invalid link", "<h1>Invalid link</h1><p>This unsubscribe link is missing required information.</p>", 400);
    }

    const secret = Deno.env.get("UNSUBSCRIBE_SECRET");
    if (!secret) {
      return htmlPage("Server error", "<h1>Server error</h1><p>Unsubscribe secret not configured.</p>", 500);
    }

    const expected = await hmacHex(secret, `${contact_id}:${user_id}`);
    if (expected !== token) {
      return htmlPage("Invalid link", "<h1>Invalid link</h1><p>This unsubscribe link could not be verified.</p>", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Look up contact
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, email, tags")
      .eq("id", contact_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (!contact?.email) {
      return htmlPage("Already removed", "<h1>You're unsubscribed</h1><p>You will not receive further emails from this sender.</p>");
    }

    // 1. Mark active sequences as unsubscribed
    await supabase
      .from("email_sequences")
      .update({ status: "unsubscribed" })
      .eq("contact_id", contact_id)
      .eq("user_id", user_id)
      .in("status", ["pending", "paused"]);

    // 2. Record the unsubscribe (idempotent insert; ignore duplicates)
    await supabase.from("email_unsubscribes").insert({
      contact_id,
      email: contact.email,
      user_id,
    });

    // 3. Tag the contact
    const tags = Array.isArray(contact.tags) ? contact.tags : [];
    if (!tags.includes("unsubscribed")) {
      await supabase
        .from("contacts")
        .update({ tags: [...tags, "unsubscribed"] })
        .eq("id", contact_id);
    }

    return htmlPage(
      "Unsubscribed",
      `<h1>You have been unsubscribed.</h1><p>You will not receive further emails from this sender.</p>`,
    );
  } catch (e) {
    console.error("unsubscribe error:", e);
    return htmlPage("Server error", "<h1>Something went wrong</h1><p>Please try again later.</p>", 500);
  }
});
