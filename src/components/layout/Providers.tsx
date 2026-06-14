"use client";

import { Toaster } from "react-hot-toast";
import { FrameProvider } from "./FrameProvider";
import { SessionBootstrap } from "@/components/auth/SessionBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FrameProvider>
      <SessionBootstrap />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", borderRadius: "12px" },
        }}
      />
    </FrameProvider>
  );
}
