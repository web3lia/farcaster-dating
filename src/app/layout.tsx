import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const APP_URL = "https://farcaster-dating.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Onlyfrens",
  description: "Swipe, match and chat with Farcaster users",
  openGraph: {
    title: "Onlyfrens",
    description: "Swipe, match and chat with Farcaster users",
    images: [`${APP_URL}/onlyfrens_og_1200x800.png`],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${APP_URL}/onlyfrens_og_1200x800.png`],
  },
  other: {
    // Base App domain verification tag
    "base:app_id": "6a4a02994ed37b0bcf27861a",
    // Farcaster Mini App embed tag — shown when link is shared in Warpcast
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/onlyfrens_og_1200x800.png`,
      button: {
        title: "💜 Find your match",
        action: {
          type: "launch_frame",
          name: "Onlyfrens",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/onlyfrens_splash_1200.png`,
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
    <html lang="en" className={`h-full ${inter.variable} ${jetbrains.variable}`}>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans h-full bg-gray-950 text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
