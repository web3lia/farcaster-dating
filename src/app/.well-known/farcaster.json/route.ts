import { NextResponse } from "next/server";

// Force dynamic — env vars must be read at request time, not build time
export const dynamic = "force-dynamic";

const APP_URL = "https://farcaster-dating.vercel.app";

export async function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER ?? "",
      payload: process.env.FARCASTER_PAYLOAD ?? "",
      signature: process.env.FARCASTER_SIGNATURE ?? "",
    },
    frame: {
      version: "1",
      name: "Onlyfrens",
      iconUrl: `${APP_URL}/onlyfrens_icon_1024.png`,
      homeUrl: APP_URL,
      imageUrl: `${APP_URL}/onlyfrens_og_1200x800.png`,
      buttonTitle: "💜 Find your match",
      splashImageUrl: `${APP_URL}/onlyfrens_splash_1200.png`,
      splashBackgroundColor: "#0f0f13",
      webhookUrl: `${APP_URL}/api/webhooks/farcaster`,
    },
  });
}
