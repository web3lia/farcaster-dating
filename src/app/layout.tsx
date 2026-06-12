import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = "https://farcaster-dating.vercel.app";

export const metadata: Metadata = {
  title: "Farcaster Dating",
  description: "Swipe, match and chat with Farcaster users",
  openGraph: {
    title: "Farcaster Dating",
    description: "Swipe, match and chat with Farcaster users",
    images: [`${APP_URL}/og.png`],
  },
  other: {
    // Farcaster Mini App embed tag — shown when link is shared in Warpcast
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/og.png`,
      button: {
        title: "💜 Find your match",
        action: {
          type: "launch_frame",
          name: "Farcaster Dating",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/splash.png`,
          splashBackgroundColor: "#0f0f13",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-950 text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
