import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIKTOK_SECRET = Deno.env.get("TIKTOK_WEBHOOK_SECRET") ?? "";

async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!TIKTOK_SECRET) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(TIKTOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed === signature;
}

// Map TikTok event types to post statuses
function mapEventToStatus(eventType: string): string | null {
  const mapping: Record<string, string> = {
    "video.publish.complete": "posted",
    "video.publish.failed": "draft",
    "video.upload.complete": "scheduled",
  };
  return mapping[eventType] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();

    // Verify TikTok signature
    const signature = req.headers.get("x-tiktok-signature") ?? "";
    if (TIKTOK_SECRET && !(await verifySignature(rawBody, signature))) {
      console.error("Invalid TikTok webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload.event ?? payload.type ?? "";
    console.log("TikTok webhook event:", eventType, JSON.stringify(payload));

    const newStatus = mapEventToStatus(eventType);

    if (newStatus && payload.data?.post_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Try matching by id or by media_url containing the tiktok post id
      const postId = payload.data.post_id as string;
      const { error } = await supabase
        .from("social_posts")
        .update({ status: newStatus })
        .or(`id.eq.${postId},media_url.ilike.%${postId}%`);

      if (error) {
        console.error("DB update error:", error.message);
      } else {
        console.log(`Updated post to status '${newStatus}' for tiktok post ${postId}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
