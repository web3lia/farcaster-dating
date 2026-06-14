import { createAppClient, viemConnector } from "@farcaster/auth-client";

// Domain the mini app is served from — must match what Warpcast signs over.
export const SIWF_DOMAIN = "farcaster-dating.vercel.app";

// Headless app client (no React/browser deps) — safe in a server route.
const appClient = createAppClient({
  relay: "https://relay.farcaster.xyz",
  ethereum: viemConnector(),
});

export interface SiwfVerifyResult {
  success: boolean;
  fid: number | null;
  error?: string;
}

/**
 * Cryptographically verify a SIWF sign-in. Returns the fid ONLY if the
 * signature is valid for the given message + nonce + domain. The returned fid
 * is trusted; never trust a client-supplied fid.
 */
export async function verifySiwf(opts: {
  message: string;
  signature: `0x${string}`;
  nonce: string;
}): Promise<SiwfVerifyResult> {
  try {
    const res = await appClient.verifySignInMessage({
      message: opts.message,
      signature: opts.signature,
      nonce: opts.nonce,
      domain: SIWF_DOMAIN,
    });
    if (res.isError || !res.success) {
      return { success: false, fid: null, error: res.error?.message ?? "verification failed" };
    }
    return { success: true, fid: res.fid };
  } catch (e) {
    return { success: false, fid: null, error: e instanceof Error ? e.message : "verify error" };
  }
}

/** Extract the nonce from a SIWE message ("Nonce: <value>" line). */
export function parseNonce(message: string): string | null {
  const m = message.match(/Nonce: (\S+)/);
  return m ? m[1] : null;
}
