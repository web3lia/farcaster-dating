import { NextRequest, NextResponse } from "next/server";

// This endpoint is called by @farcaster/auth-kit SignInButton as the siweUri.
// Auth-kit handles SIWE verification client-side; this route just acknowledges
// the request so the kit doesn't get a 404 which silently breaks the flow.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Forward nonce/message/signature — auth-kit validates on its relay side.
    // We return 200 so the kit proceeds to call onSuccess.
    return NextResponse.json({ ok: true, ...body });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
