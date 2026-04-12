import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const TIKTOK_CLIENT_KEY = "awhtzpeld5oruxbc";
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // contains user_id
  const error = url.searchParams.get("error");

  // Determine the app origin for redirects
  const appOrigin = url.searchParams.get("redirect_origin") || "https://founder-chief-os.lovable.app";

  if (error) {
    console.error("TikTok OAuth error:", error, url.searchParams.get("error_description"));
    return Response.redirect(`${appOrigin}/social/calendar?error=tiktok_denied`, 302);
  }

  if (!code || !state) {
    return new Response(JSON.stringify({ error: "Missing code or state" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${SUPABASE_URL}/functions/v1/tiktok-oauth-callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("TikTok token response status:", tokenRes.status);

    if (!tokenRes.ok || tokenData.error) {
      console.error("TikTok token exchange failed:", JSON.stringify(tokenData));
      return Response.redirect(`${appOrigin}/social/calendar?error=tiktok_token_failed`, 302);
    }

    const {
      access_token,
      refresh_token,
      expires_in,
      open_id,
    } = tokenData;

    // Simple XOR-based obfuscation with service role key (not true encryption, but
    // keeps tokens from being stored in plaintext). For production, use Supabase Vault.
    const obfuscate = (token: string): string => {
      const key = SUPABASE_SERVICE_ROLE_KEY;
      return btoa(
        Array.from(token)
          .map((c, i) =>
            String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
          )
          .join("")
      );
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch TikTok user info for username
    let platformUsername = "";
    try {
      const userRes = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const userData = await userRes.json();
      platformUsername = userData?.data?.user?.username || userData?.data?.user?.display_name || "";
      await userRes.text().catch(() => {});
    } catch (e) {
      console.warn("Could not fetch TikTok user info:", e);
    }

    const expiresAt = new Date(Date.now() + (expires_in || 86400) * 1000).toISOString();

    // Upsert the connection
    const { error: dbError } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id: state,
          platform: "tiktok",
          access_token_encrypted: obfuscate(access_token),
          refresh_token_encrypted: refresh_token ? obfuscate(refresh_token) : "",
          token_expires_at: expiresAt,
          platform_user_id: open_id || "",
          platform_username: platformUsername,
        },
        { onConflict: "user_id,platform" }
      );

    if (dbError) {
      console.error("DB upsert error:", dbError.message);
      return Response.redirect(`${appOrigin}/social/calendar?error=tiktok_save_failed`, 302);
    }

    console.log(`TikTok connected for user ${state}`);
    return Response.redirect(`${appOrigin}/social/calendar?tiktok=connected`, 302);
  } catch (err) {
    console.error("TikTok OAuth callback error:", err);
    return Response.redirect(`${appOrigin}/social/calendar?error=tiktok_internal`, 302);
  }
});
