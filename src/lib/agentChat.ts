// Client-side streaming helper for the agent-chat edge function.
// Calls the SSE endpoint and emits each delta token via onDelta.

import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export async function streamAgentChat(
  body: { conversationId: string; agentId: string; agentName: string; message: string },
  callbacks: { onDelta: (text: string) => void; onError?: (err: Error) => void; onDone: () => void },
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    callbacks.onError?.(new Error("Not authenticated"));
    callbacks.onDone();
    return;
  }

  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch (e) {
    callbacks.onError?.(e instanceof Error ? e : new Error("Network error"));
    callbacks.onDone();
    return;
  }

  if (!resp.ok || !resp.body) {
    let msg = `Request failed (${resp.status})`;
    try {
      const j = await resp.json();
      if (j?.error) msg = j.error;
    } catch { /* ignore */ }
    callbacks.onError?.(new Error(msg));
    callbacks.onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim()) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        done = true;
        break;
      }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (c) callbacks.onDelta(c);
      } catch {
        // partial JSON across chunks: requeue
        buf = line + "\n" + buf;
        break;
      }
    }
  }

  callbacks.onDone();
}
