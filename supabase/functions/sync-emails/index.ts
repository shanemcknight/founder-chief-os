import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NANGO_API_URL = "https://api.nango.dev";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!NANGO_SECRET_KEY) throw new Error("NANGO_SECRET_KEY is not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active email accounts for this user
    const { data: accounts } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ error: "No email accounts connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSynced = 0;
    for (const account of accounts) {
      try {
        const synced = await syncAccount(
          supabase,
          user.id,
          account,
          NANGO_SECRET_KEY,
          LOVABLE_API_KEY
        );
        totalSynced += synced;
      } catch (err) {
        console.error(
          `[sync-emails] Failed to sync account ${account.email_address}:`,
          err
        );
      }
    }

    return new Response(
      JSON.stringify({ synced: totalSynced, accounts: accounts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-emails error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface NormalizedMessage {
  id: string;
  fromEmail: string | null;
  fromName: string | null;
  subject: string | null;
  bodyPreview: string;
  bodyFull: string | null;
  receivedAt: string | null;
}

async function syncAccount(
  supabase: any,
  userId: string,
  account: any,
  nangoKey: string,
  lovableKey: string
): Promise<number> {
  const provider = account.provider as "outlook" | "gmail";
  const providerConfigKey = provider === "outlook" ? "microsoft" : "google-mail";

  const nangoHeaders = {
    Authorization: `Bearer ${nangoKey}`,
    "Connection-Id": account.nango_connection_id,
    "Provider-Config-Key": providerConfigKey,
  };

  // Try to resolve real email address if it's still showing as the connection ID
  if (account.email_address === account.nango_connection_id) {
    try {
      const realEmail = await fetchAccountEmail(provider, nangoHeaders);
      if (realEmail) {
        await supabase
          .from("email_accounts")
          .update({ email_address: realEmail })
          .eq("id", account.id);
        account.email_address = realEmail;
      }
    } catch (err) {
      console.warn(`[sync-emails] Could not resolve email for ${account.id}:`, err);
    }
  }

  // Find latest email for THIS account for incremental sync
  const { data: latestEmail } = await supabase
    .from("emails")
    .select("received_at")
    .eq("user_id", userId)
    .eq("email_account_id", account.id)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch messages based on provider
  let normalizedMessages: NormalizedMessage[] = [];

  if (provider === "outlook") {
    normalizedMessages = await fetchOutlookMessages(
      nangoHeaders,
      latestEmail?.received_at || null
    );
  } else if (provider === "gmail") {
    normalizedMessages = await fetchGmailMessages(
      nangoHeaders,
      latestEmail?.received_at || null
    );
  }

  console.log(
    `[sync-emails] [${account.email_address}] Fetched ${normalizedMessages.length} new emails`
  );

  if (normalizedMessages.length === 0) {
    await supabase
      .from("email_accounts")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", account.id);
    return 0;
  }

  // Prepare batch for AI categorization
  const emailSummaries = normalizedMessages.map((m) => ({
    id: m.id,
    from: m.fromEmail || "",
    fromName: m.fromName || "",
    subject: m.subject || "",
    preview: (m.bodyPreview || "").substring(0, 300),
  }));

  // Call AI for categorization
  let categorizations: any[] = [];
  try {
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an email triage AI. For each email, return a JSON array with objects containing:
- "id": the email id
- "category": one of "urgent", "lead", "customer", "vendor", "admin", "noise"
- "summary": a one-line summary (max 80 chars) starting with a verb or key topic
- "draft_reply": a short professional reply draft (2-3 sentences)

Return ONLY valid JSON array, no markdown.`,
            },
            { role: "user", content: JSON.stringify(emailSummaries) },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || "[]";
      try {
        const parsed = JSON.parse(content);
        categorizations = Array.isArray(parsed)
          ? parsed
          : parsed.emails || parsed.results || [];
      } catch {
        console.error("Failed to parse AI response:", content);
      }
    } else {
      console.error("AI categorization failed:", await aiRes.text());
    }
  } catch (aiErr) {
    console.error("AI gateway unreachable, syncing without categorization:", aiErr);
  }

  const catMap = new Map(categorizations.map((c: any) => [c.id, c]));

  // Upsert emails
  let synced = 0;
  for (const m of normalizedMessages) {
    const cat = catMap.get(m.id);
    const { error: upsertErr } = await supabase.from("emails").upsert(
      {
        user_id: userId,
        external_id: m.id,
        provider,
        email_account_id: account.id,
        account_email: account.email_address,
        from_email: m.fromEmail,
        from_name: m.fromName,
        subject: m.subject,
        body_preview: (m.bodyPreview || "").substring(0, 500),
        body_full: m.bodyFull,
        received_at: m.receivedAt,
        category: cat?.category || "admin",
        chief_summary: cat?.summary || null,
      },
      { onConflict: "user_id,external_id" }
    );

    if (upsertErr) {
      console.error("Upsert email error:", upsertErr);
      continue;
    }

    if (cat?.draft_reply) {
      const { data: emailRow } = await supabase
        .from("emails")
        .select("id")
        .eq("user_id", userId)
        .eq("external_id", m.id)
        .single();

      if (emailRow) {
        await supabase.from("email_drafts").upsert(
          {
            user_id: userId,
            email_id: emailRow.id,
            draft_body: cat.draft_reply,
            status: "pending",
          },
          { onConflict: "user_id,email_id" }
        );
      }
    }

    synced++;
  }

  // Update last_synced_at for this account
  await supabase
    .from("email_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", account.id);

  return synced;
}

// ---------- Outlook helpers ----------
async function fetchOutlookMessages(
  nangoHeaders: Record<string, string>,
  sinceIso: string | null
): Promise<NormalizedMessage[]> {
  let graphUrl = `${NANGO_API_URL}/proxy/v1.0/me/messages?$top=50&$orderby=receivedDateTime%20desc&$select=id,from,subject,bodyPreview,body,receivedDateTime`;
  if (sinceIso) {
    const filterDate = new Date(sinceIso).toISOString();
    graphUrl += `&$filter=receivedDateTime%20gt%20${encodeURIComponent(filterDate)}`;
    console.log(`[sync-emails] [outlook] Incremental sync after ${filterDate}`);
  } else {
    console.log("[sync-emails] [outlook] Full initial sync");
  }

  const res = await fetch(graphUrl, { headers: nangoHeaders });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Outlook Nango proxy error [${res.status}]: ${errText}`);
  }
  const data = await res.json();
  const messages = data.value || [];

  return messages.map((m: any) => ({
    id: m.id,
    fromEmail: m.from?.emailAddress?.address || null,
    fromName: m.from?.emailAddress?.name || null,
    subject: m.subject || null,
    bodyPreview: m.bodyPreview || "",
    bodyFull: m.body?.content || null,
    receivedAt: m.receivedDateTime || null,
  }));
}

// ---------- Gmail helpers ----------
async function fetchGmailMessages(
  nangoHeaders: Record<string, string>,
  sinceIso: string | null
): Promise<NormalizedMessage[]> {
  // Gmail uses query string with after:UNIX_SECONDS for incremental sync
  let listUrl = `${NANGO_API_URL}/proxy/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX`;
  if (sinceIso) {
    const sinceSeconds = Math.floor(new Date(sinceIso).getTime() / 1000);
    listUrl += `&q=${encodeURIComponent(`after:${sinceSeconds}`)}`;
    console.log(`[sync-emails] [gmail] Incremental sync after ${sinceIso}`);
  } else {
    console.log("[sync-emails] [gmail] Full initial sync");
  }

  const listRes = await fetch(listUrl, { headers: nangoHeaders });
  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Gmail Nango list error [${listRes.status}]: ${errText}`);
  }
  const listData = await listRes.json();
  const ids: string[] = (listData.messages || []).map((m: any) => m.id);

  const results: NormalizedMessage[] = [];
  for (const id of ids) {
    try {
      const detailRes = await fetch(
        `${NANGO_API_URL}/proxy/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: nangoHeaders }
      );
      if (!detailRes.ok) {
        console.error(`Gmail detail error for ${id}: ${detailRes.status}`);
        continue;
      }
      const msg = await detailRes.json();
      results.push(parseGmailMessage(msg));
    } catch (err) {
      console.error(`Gmail fetch detail error for ${id}:`, err);
    }
  }
  return results;
}

function parseGmailMessage(msg: any): NormalizedMessage {
  const headers: any[] = msg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

  const subject = getHeader("Subject") || null;
  const fromHeader = getHeader("From");
  // Parse "Name <email@example.com>" format
  let fromName: string | null = null;
  let fromEmail: string | null = null;
  if (fromHeader) {
    const match = fromHeader.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
    if (match) {
      fromName = (match[1] || "").trim() || null;
      fromEmail = (match[2] || "").trim();
    } else {
      fromEmail = fromHeader.trim();
    }
  }

  const bodyFull = extractGmailBody(msg.payload);
  const snippet: string = msg.snippet || "";
  const receivedAt = msg.internalDate
    ? new Date(parseInt(msg.internalDate, 10)).toISOString()
    : null;

  return {
    id: msg.id,
    fromEmail,
    fromName,
    subject,
    bodyPreview: snippet,
    bodyFull,
    receivedAt,
  };
}

function extractGmailBody(payload: any): string | null {
  if (!payload) return null;

  // Direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Walk parts for text/html or text/plain
  const walk = (parts: any[]): string | null => {
    let html: string | null = null;
    let plain: string | null = null;
    for (const part of parts || []) {
      if (part.mimeType === "text/html" && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      } else if (part.mimeType === "text/plain" && part.body?.data) {
        plain = decodeBase64Url(part.body.data);
      } else if (part.parts) {
        const nested = walk(part.parts);
        if (nested) return nested;
      }
    }
    return html || plain;
  };

  return walk(payload.parts || []);
}

function decodeBase64Url(data: string): string {
  try {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return atob(padded);
  } catch {
    return "";
  }
}

// ---------- Profile / email address resolution ----------
async function fetchAccountEmail(
  provider: "outlook" | "gmail",
  nangoHeaders: Record<string, string>
): Promise<string | null> {
  try {
    if (provider === "outlook") {
      const res = await fetch(`${NANGO_API_URL}/proxy/v1.0/me`, {
        headers: nangoHeaders,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.mail || data.userPrincipalName || null;
    } else {
      const res = await fetch(
        `${NANGO_API_URL}/proxy/gmail/v1/users/me/profile`,
        { headers: nangoHeaders }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.emailAddress || null;
    }
  } catch {
    return null;
  }
}
