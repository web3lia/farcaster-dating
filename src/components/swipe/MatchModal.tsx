"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import type { Match } from "@/types";
import { useAuthStore } from "@/store/auth";
import sdk from "@farcaster/frame-sdk";
import { authFetch } from "@/lib/auth/authFetch";

interface Props {
  match: Match | null;
  onClose: () => void;
}

export function MatchModal({ match, onClose }: Props) {
  const router = useRouter();
  const { fid, setFrameAdded } = useAuthStore();
  // Reliable source: sdk.context.client.added — not the stale Zustand flag.
  // Default true so the CTA is hidden until we confirm it's needed.
  const [appAdded, setAppAdded] = useState(true);

  useEffect(() => {
    if (!match) return;
    sdk.context.then((ctx) => setAppAdded(ctx.client.added)).catch(() => {});
  }, [match]);

  if (!match) return null;

  const other = match.user1_fid === fid ? match.user2 : match.user1;
  const me = match.user1_fid === fid ? match.user1 : match.user2;

  async function handleAddApp() {
    // First check context — if already added, token may already be there
    try {
      const ctx = await sdk.context;
      console.log("[match-modal] sdk.context client:", JSON.stringify(ctx.client));
      if (ctx.client.added && ctx.client.notificationDetails) {
        const { token, url } = ctx.client.notificationDetails;
        authFetch("/api/notification-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, url }),
        }).catch((e) => console.error("[match-modal] context token save failed:", e));
        setFrameAdded(true);
        return;
      }
    } catch (e) {
      console.error("[match-modal] sdk.context failed:", e);
    }

    // Not yet added — prompt via addFrame()
    try {
      const result = await sdk.actions.addFrame();
      console.log("[match-modal] addFrame result:", JSON.stringify(result));
      if (result?.notificationDetails) {
        const { token, url } = result.notificationDetails;
        authFetch("/api/notification-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, url }),
        }).catch((e) => console.error("[match-modal] addFrame token save failed:", e));
      }
    } catch (e) {
      console.log("[match-modal] addFrame threw:", e instanceof Error ? e.message : e);
    } finally {
      setFrameAdded(true);
    }
  }

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 260, delay: 0.05 }}
            className="relative bg-surface border border-ui-border rounded-2xl px-7 py-8 w-full max-w-sm text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Avatars */}
            <div className="relative flex justify-center items-center gap-0 mb-6">
              <motion.div
                className="absolute w-14 h-14 rounded-full bg-acid/20 blur-xl"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.15 }}
                className="w-20 h-20 rounded-full overflow-hidden border-4 border-acid/60 shadow-lg z-10 -mr-3"
              >
                <Avatar src={me?.pfp_url} alt={me?.display_name ?? ""} className="object-cover w-full h-full" />
              </motion.div>
              <motion.div
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.15 }}
                className="w-20 h-20 rounded-full overflow-hidden border-4 border-acid/40 shadow-lg z-10 -ml-3"
              >
                <Avatar src={other?.pfp_url} alt={other?.display_name ?? ""} className="object-cover w-full h-full" />
              </motion.div>
            </div>

            {/* Headline */}
            <motion.h2
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.08, 1], opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
              className="text-3xl font-mono font-black text-ink mb-1 tracking-tight"
            >
              It&apos;s a match!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="text-ink-muted text-sm font-mono mb-7"
            >
              You and <span className="text-ink font-semibold">{other?.display_name}</span> are connected
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                variant="primary"
                size="lg"
                fullWidth
                showPrefix
                onClick={() => { onClose(); router.push(`/chat/${match.id}`); }}
              >
                Send a message
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
                Keep swiping
              </Button>

              {/* Soft add-app nudge — hidden once sdk.context confirms app is added */}
              {!appAdded && (
                <button
                  onClick={() => { handleAddApp(); setAppAdded(true); }}
                  className="w-full text-xs font-mono text-ink-muted hover:text-acid transition-colors py-1"
                >
                  💜 Add app to stay notified
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
