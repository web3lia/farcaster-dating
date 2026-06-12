import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// FID is in the Resources section of the SIWE message as "farcaster://fid/12345"
function parseFidFromMessage(message: string): number | null {
  const match = message.match(/farcaster:\/\/fid\/(\d+)/);
  if (match) return parseInt(match[1]);
  return null;
}

async function fetchNeynarProfile(fid: number) {
  if (!process.env.NEYNAR_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      { headers: { api_key: process.env.NEYNAR_API_KEY } }
    );
    const data = await res.json();
    return data.users?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, signature, fid: fidFromClient } = body;

  if (!message && !fidFromClient) {
    return NextResponse.json({ error: "message or fid required" }, { status: 400 });
  }

  // Prefer FID passed directly from sdk.context (most reliable),
  // fall back to parsing from SIWE message Resources
  let fid: number | null = fidFromClient ?? null;
  if (!fid && message) {
    fid = parseFidFromMessage(message);
  }

  if (!fid) {
    // Log message for debugging
    console.error("Could not extract FID. Message preview:", message?.slice(0, 300));
    return NextResponse.json({ error: "Could not extract FID from message" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Build profile: try Neynar first, fall back to minimal data
  const u = await fetchNeynarProfile(fid);
  const profileData = {
    fid,
    username: u?.username ?? `fid_${fid}`,
    display_name: u?.display_name ?? `Farcaster User`,
    pfp_url: u?.pfp_url ?? "",
    bio: u?.profile?.bio?.text ?? "",
    follower_count: u?.follower_count ?? 0,
    following_count: u?.following_count ?? 0,
  };

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "fid" })
    .select()
    .single();

  if (error) {
    console.error("upsert profile error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
