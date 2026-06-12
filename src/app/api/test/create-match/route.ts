import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// ⚠️ TEMPORARY TEST HELPER — remove after verifying the chat flow.
// Forces a match between two existing profiles (bypasses mutual-like),
// then seeds an opening message so the chat view isn't empty.
//
// Usage (in browser):
//   /api/test/create-match?fid=228126&target=3&key=letmein
//
//   fid    = your own FID (signed-in user)
//   target = seed profile FID to match with (e.g. 3 = dwr)
//   key    = guard token, must equal "letmein"
export const dynamic = "force-dynamic";

const GUARD = "letmein";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const key = sp.get("key");
  if (key !== GUARD) {
    return NextResponse.json({ error: "Forbidden — missing or wrong ?key" }, { status: 403 });
  }

  const fid = Number(sp.get("fid"));
  const target = Number(sp.get("target"));
  if (!fid || !target || fid === target) {
    return NextResponse.json({ error: "Provide distinct ?fid and ?target" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify both profiles exist
  const { data: profiles } = await supabase
    .from("profiles")
    .select("fid, display_name")
    .in("fid", [fid, target]);
  if (!profiles || profiles.length < 2) {
    return NextResponse.json(
      { error: "Both fid and target must be existing profiles", found: profiles },
      { status: 404 }
    );
  }

  // Match rows use least/greatest ordering (same as check_and_create_match)
  const user1 = Math.min(fid, target);
  const user2 = Math.max(fid, target);

  // Plain insert — matches are immutable, so no upsert (which would need UPDATE grant).
  // If it already exists, fetch the existing row instead.
  let { data: match, error: matchErr } = await supabase
    .from("matches")
    .insert({ user1_fid: user1, user2_fid: user2 })
    .select()
    .single();

  if (matchErr) {
    // 23505 = unique_violation → match already exists, fetch it
    if (matchErr.code === "23505") {
      const existing = await supabase
        .from("matches")
        .select()
        .eq("user1_fid", user1)
        .eq("user2_fid", user2)
        .single();
      match = existing.data;
    } else {
      return NextResponse.json({ error: matchErr.message }, { status: 500 });
    }
  }

  if (!match) {
    return NextResponse.json({ error: "Failed to create or find match" }, { status: 500 });
  }

  // Seed an opening message from the target so the chat isn't empty
  const targetName =
    profiles.find((p) => p.fid === target)?.display_name ?? "Your match";
  await supabase.from("messages").insert({
    match_id: match.id,
    sender_fid: target,
    content: `Hey! 👋 This is a test match with ${targetName}. Try replying!`,
    type: "text",
  });

  return NextResponse.json({
    ok: true,
    match,
    chatUrl: `/chat/${match.id}`,
    note: "Open /matches in the app, or go directly to chatUrl.",
  });
}
