import { NextRequest, NextResponse } from "next/server";
import { parseWebhookEvent, verifyAppKeyWithNeynar } from "@farcaster/miniapp-node";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  console.log("[webhook] hit — reading body");

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  console.log("[webhook] raw body length:", rawBody.length);

  // parseWebhookEvent expects a parsed object, not the raw JSON string
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    console.error("[webhook] JSON.parse failed, raw body:", rawBody.slice(0, 200));
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof parseWebhookEvent>>;
  try {
    result = await parseWebhookEvent(parsedBody, verifyAppKeyWithNeynar);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid webhook";
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : "";
    console.error("[webhook] parseWebhookEvent failed:", msg, cause ? `| cause: ${cause}` : "");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { fid, event } = result;
  console.log("[webhook] parsed event:", event.event, "fid:", fid);

  const db = createServiceClient();

  try {
    if (event.event === "miniapp_added" || event.event === "notifications_enabled") {
      const details = event.notificationDetails;
      console.log("[webhook] notificationDetails present:", !!details);
      if (details) {
        const { error } = await db
          .from("notification_tokens")
          .upsert(
            { fid, token: details.token, url: details.url, updated_at: new Date().toISOString() },
            { onConflict: "fid" }
          );
        if (error) {
          console.error("[webhook] upsert token failed:", error.message);
        } else {
          console.log("[webhook] token upserted for fid:", fid);
        }
      }
    } else if (event.event === "notifications_disabled" || event.event === "miniapp_removed") {
      const { error } = await db.from("notification_tokens").delete().eq("fid", fid);
      if (error) {
        console.error("[webhook] delete token failed:", error.message);
      } else {
        console.log("[webhook] token deleted for fid:", fid);
      }
    }
  } catch (e) {
    console.error("[webhook] db operation failed:", e);
  }

  // Always return 200 — Farcaster retries on non-2xx
  return NextResponse.json({ ok: true });
}
