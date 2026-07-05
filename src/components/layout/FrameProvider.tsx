"use client";

import { createContext, useContext, useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import type { Context } from "@farcaster/miniapp-core";

interface FrameCtx {
  isReady: boolean;
  context: Context.MiniAppContext | null;
}

const FrameCtxContext = createContext<FrameCtx>({ isReady: false, context: null });

export function useFrame() {
  return useContext(FrameCtxContext);
}

export function FrameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FrameCtx>({ isReady: false, context: null });

  useEffect(() => {
    async function init() {
      try {
        // sdk.context is a promise that resolves once the Farcaster client
        // has injected the frame context. Must await before calling any actions.
        const context = await sdk.context;
        await sdk.actions.ready();
        setState({ isReady: true, context: context ?? null });
      } catch {
        // Running outside a Farcaster client — mark ready anyway so UI renders
        setState({ isReady: true, context: null });
      }
    }
    init();
  }, []);

  return (
    <FrameCtxContext.Provider value={state}>
      {children}
    </FrameCtxContext.Provider>
  );
}
