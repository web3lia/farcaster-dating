"use client";

import { AuthKitProvider } from "@farcaster/auth-kit";
import { Toaster } from "react-hot-toast";
import { FrameProvider } from "./FrameProvider";

function getDomain(url: string | undefined): string {
  if (!url) return "localhost:3000";
  try {
    return new URL(url).host; // безопасно убирает протокол и trailing slash
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const farcasterConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: getDomain(APP_URL),
  siweUri: `${APP_URL}/api/auth/verify`,
  relay: "https://relay.farcaster.xyz",
  version: "v1",
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={farcasterConfig}>
      <FrameProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#1f2937", color: "#f9fafb", borderRadius: "12px" },
          }}
        />
      </FrameProvider>
    </AuthKitProvider>
  );
}
