import { createServiceClient } from "@/lib/supabase/server";

const APP_URL = "https://farcaster-dating.vercel.app";

// In-memory throttle: tracks last message notification time per match_id.
// Map<match_id, timestamp_ms>. Cleared naturally as the process recycles.
const msgNotifLastSent = new Map<string, number>();
const MSG_THROTTLE_MS = 60_000;

interface TokenRow {
  fid: number;
  token: string;
  url: string;
}

async function lookupTokens(fids: number[]): Promise<TokenRow[]> {
  if (fids.length === 0) return [];
  const { data, error } = await createServiceClient()
    .from("notification_tokens")
    .select("fid, token, url")
    .in("fid", fids);
  if (error) {
    console.error("[notifications] token lookup failed:", error.message);
    return [];
  }
  return (data ?? []) as TokenRow[];
}

async function deleteInvalidTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  createServiceClient()
    .from("notification_tokens")
    .delete()
    .in("token", tokens)
    .then(({ error }) => {
      if (error) console.error("[notifications] failed to delete invalid tokens:", error.message);
    });
}

async function postToUrl(
  url: string,
  tokens: string[],
  notificationId: string,
  title: string,
  body: string,
  targetUrl: string,
) {
  // Farcaster limit: max 100 tokens per request
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, title, body, targetUrl, tokens: batch }),
      });
      if (!res.ok) {
        console.error(`[notifications] POST ${url} returned ${res.status}`);
        continue;
      }
      const json = await res.json().catch(() => ({}));
      if (json.invalidTokens?.length) {
        deleteInvalidTokens(json.invalidTokens);
      }
    } catch (e) {
      console.error("[notifications] fetch error:", e);
    }
  }
}

export async function sendNotification(
  fids: number[],
  title: string,
  body: string,
  targetUrl: string,
  notificationId: string,
) {
  try {
    console.log(`[notifications] ${notificationId} → fids: [${fids.join(",")}]`);
    const rows = await lookupTokens(fids);
    console.log(`[notifications] ${notificationId} → tokens found: ${rows.length}`);
    if (rows.length === 0) return;

    // Group by notification URL (different clients may use different endpoints)
    const byUrl = new Map<string, string[]>();
    for (const row of rows) {
      const list = byUrl.get(row.url) ?? [];
      list.push(row.token);
      byUrl.set(row.url, list);
    }

    const t = title.slice(0, 32);
    const b = body.slice(0, 128);

    await Promise.all(
      Array.from(byUrl.entries()).map(([url, tokens]) =>
        postToUrl(url, tokens, notificationId, t, b, targetUrl)
      )
    );
  } catch (e) {
    console.error("[notifications] sendNotification error:", e);
  }
}

// Convenience wrappers

export function notifyMatch(matchId: string, fid1: number, name1: string, fid2: number, name2: string) {
  const targetUrl = `${APP_URL}/chat/${matchId}`;
  sendNotification([fid1], "It's a match! 💜", `You matched with ${name2}`, targetUrl, `match:${matchId}:u1`).catch(console.error);
  sendNotification([fid2], "It's a match! 💜", `You matched with ${name1}`, targetUrl, `match:${matchId}:u2`).catch(console.error);
}

export function notifyMessage(matchId: string, recipientFid: number, senderName: string, _content: string) {
  const now = Date.now();
  const lastSent = msgNotifLastSent.get(matchId) ?? 0;
  if (now - lastSent < MSG_THROTTLE_MS) return; // throttle: one push per 60s per match
  msgNotifLastSent.set(matchId, now);

  const targetUrl = `${APP_URL}/chat/${matchId}`;
  sendNotification(
    [recipientFid],
    senderName.slice(0, 32),
    "sent you a message 💬",
    targetUrl,
    `msg:${matchId}:${now}`,
  ).catch(console.error);
}

export function notifySuperlike(recipientFid: number, message: string | null) {
  console.log("[notifications] notifySuperlike triggered for fid:", recipientFid);
  const body = message?.trim()
    ? message.trim()
    : "Open Onlyfrens to see who 💜";
  sendNotification(
    [recipientFid],
    "Someone superliked you ⭐",
    body,
    APP_URL,
    `superlike:${recipientFid}:${Date.now()}`,
  ).catch(console.error);
}
