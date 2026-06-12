import { NextResponse } from "next/server";

export async function GET() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  return NextResponse.json({
    accountAssociation: {
      // Fill in after publishing: farcaster.xyz/~/developers
      header: "",
      payload: "",
      signature: "",
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_APP_NAME ?? "Farcaster Dating",
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: APP_URL,
      imageUrl: `${APP_URL}/og.png`,
      buttonTitle: "Open App",
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0f0f13",
      webhookUrl: `${APP_URL}/api/webhooks/farcaster`,
    },
  });
}
