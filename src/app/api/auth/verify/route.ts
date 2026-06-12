import { NextRequest, NextResponse } from "next/server";
import { createAppClient, viemConnector } from "@farcaster/auth-kit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getDomain(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

const appClient = createAppClient({
  relay: "https://relay.farcaster.xyz",
  ethereum: viemConnector(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, signature, nonce } = body;

    if (!message || !signature || !nonce) {
      return NextResponse.json({ error: "Missing message, signature or nonce" }, { status: 400 });
    }

    const { success, fid, error } = await appClient.verifySignInMessage({
      message,
      signature,
      domain: getDomain(APP_URL),
      nonce,
    });

    if (!success || !fid) {
      console.error("SIWF verify failed:", error);
      return NextResponse.json({ error: "Verification failed" }, { status: 401 });
    }

    return NextResponse.json({ success: true, fid });
  } catch (err) {
    console.error("SIWF verify error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
