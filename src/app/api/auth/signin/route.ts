import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Parse FID from a SIWE message string produced by @farcaster/frame-sdk signIn
function parseFidFromMessage(message: string): number | null {
  // The message contains "fid:NNNN" in the resources section
  const fidMatch = message.match(/fid[:\s]+(\d+)/i);
  if (fidMatch) return parseInt(fidMatch[1]);

  // Fallback: look for "Farcaster ID: NNNN"
  const idMatch = message.match(/Farcaster ID[:\s]+(\d+)/i);
  if (idMatch) return parseInt(idMatch[1]);

  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // New flow: message + signature from sdk.actions.signIn()
  if (body.message && body.signature) {
    const { message } = body;

    const fid = parseFidFromMessage(message);
    if (!fid) {
      return NextResponse.json({ error: "Could not extract FID from message" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch profile data from Neynar
    let profileData: Record<string, unknown> = {
      fid,
      username: `fid_${fid}`,
      display_name: `Farcaster User`,
      pfp_url: "",
      bio: "",
    };

    if (process.env.NEYNAR_API_KEY) {
      try {
        const neynarRes = await fetch(
          `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
          { headers: { api_key: process.env.NEYNAR_API_KEY } }
        );
        const neynarData = await neynarRes.json();
        const u = neynarData.users?.[0];
        if (u) {
          profileData = {
            fid,
            username: u.username ?? profileData.username,
            display_name: u.display_name ?? profileData.display_name,
            pfp_url: u.pfp_url ?? "",
            bio: u.profile?.bio?.text ?? "",
            follower_count: u.follower_count ?? 0,
            following_count: u.following_count ?? 0,
          };
        }
      } catch (e) {
        console.error("Neynar fetch failed:", e);
      }
    }

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

  // Legacy flow: direct profile fields (kept for compatibility)
  const { fid, username, displayName, pfpUrl, bio } = body;
  if (!fid) return NextResponse.json({ error: "fid required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      { fid, username, display_name: displayName ?? username, pfp_url: pfpUrl ?? "", bio: bio ?? "" },
      { onConflict: "fid" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}
