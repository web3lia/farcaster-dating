"use client";

import { useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

export function FrameProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return <>{children}</>;
}
