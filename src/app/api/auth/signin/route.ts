import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { fid, username, displayName, pfpUrl, bio } = await req.json();

  if (!fid) return NextResponse.json({ error: "fid required" }, { status: 400 });

  const supabase = createServiceClient();

  const profileData = {
    fid,
    username,
    display_name: displayName ?? username,
    pfp_url: pfpUrl ?? "",
    bio: bio ?? "",
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
