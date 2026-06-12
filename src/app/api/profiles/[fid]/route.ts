import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  const { fid } = await params;
  const body = await req.json();
  const supabase = createServiceClient();

  const allowed = ["bio", "age", "location", "interests", "looking_for", "show_in_discovery"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("fid", parseInt(fid))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile });
}
