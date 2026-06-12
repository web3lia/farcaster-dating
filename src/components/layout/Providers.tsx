"use client";

import { AuthKitProvider } from "@farcaster/auth-kit";
import { Toaster } from "react-hot-toast";
import { FrameProvider } from "./FrameProvider";

const farcasterConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "") ?? "localhost:3000",
  siweUri: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/verify`,
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
