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
      name: "Farcaster Dating",
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: APP_URL,
      imageUrl: `${APP_URL}/og.png`,
      buttonTitle: "💜 Find your match",
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0f0f13",
      webhookUrl: `${APP_URL}/api/webhooks/farcaster`,
    },
  });
}
