import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  const supabase = createServiceClient();

  // Best-effort purge of expired nonces so the table doesn't grow unbounded
  await supabase
    .from("auth_nonces")
    .delete()
    .lt("created_at", new Date(Date.now() - NONCE_TTL_MS).toISOString());

  const { error } = await supabase.from("auth_nonces").insert({ nonce });
  if (error) {
    console.error("nonce store failed", error.message);
    return NextResponse.json({ error: "Could not issue nonce" }, { status: 500 });
  }

  return NextResponse.json({ nonce });
}
