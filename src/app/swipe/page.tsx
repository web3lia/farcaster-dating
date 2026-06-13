"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { useSwipeStore } from "@/store/swipe";
import { SwipeCard } from "@/components/swipe/SwipeCard";
import { SwipeActions } from "@/components/swipe/SwipeActions";
import { MatchModal } from "@/components/swipe/MatchModal";
import { BottomNav } from "@/components/layout/BottomNav";
import type { SwipeDirection, Profile } from "@/types";
import toast from "react-hot-toast";

export default function SwipePage() {
  const router = useRouter();
  const { fid, isAuthenticated } = useAuthStore();
  const { stack, setStack, removeTop, currentMatch, setCurrentMatch } = useSwipeStore();
  const [loading, setLoading] = useState(false);
  const [swiping, setSwiping] = useState(false);
  // Fids swiped this session — filtered out of every fetched deck so an
  // already-swiped card can never reappear, even if the server lags.
  const swipedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (fid && stack.length === 0) fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid]);

  async function fetchProfiles() {
    if (!fid || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles?fid=${fid}`);
      const data = await res.json();
      const incoming: Profile[] = data.profiles ?? [];
      // Merge into the current stack: keep what's there, append only new
      // profiles, and drop anything already swiped this session. No wholesale
      // replace → no flicker, and swiped cards stay out of the deck.
      const current = useSwipeStore.getState().stack;
      const seen = new Set(current.map((p) => p.fid));
      const merged = [
        ...current,
        ...incoming.filter((p) => !seen.has(p.fid)),
      ].filter((p) => !swipedRef.current.has(p.fid));
      setStack(merged);
    } catch {
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  const handleSwipe = useCallback(
    async (profileFid: number, direction: SwipeDirection) => {
      if (swiping || !fid) return;
      setSwiping(true);

      const apiDir =
        direction === "right" ? "like" : direction === "up" ? "superlike" : "nope";

      // Mark as swiped up front so it's filtered from any deck refetch,
      // regardless of whether the network call below succeeds.
      swipedRef.current.add(profileFid);
      removeTop();

      try {
        const res = await fetch("/api/swipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            swiper_fid: fid,
            swiped_fid: profileFid,
            direction: apiDir,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Swipe failed");
        if (data.match) setCurrentMatch(data.match);
      } catch {
        // Surface the failure instead of hiding it — the swipe didn't persist
        toast.error("Couldn't save that swipe");
      } finally {
        setSwiping(false);
      }

      // Refetch when stack runs low (use live length, not the stale closure)
      if (useSwipeStore.getState().stack.length <= 3) fetchProfiles();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fid, swiping]
  );

  const topProfile = stack[0] as Profile | undefined;

  return (
    <div className="flex flex-col h-full safe-top">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 shrink-0">
        <h1 className="text-xl font-bold text-white">💜 Discover</h1>
        <button
          onClick={() => fetchProfiles()}
          className="text-xs text-gray-400 px-3 py-1.5 rounded-full bg-gray-800"
        >
          Refresh
        </button>
      </header>

      {/* Card stack */}
      <div className="relative flex-1 mx-4">
        {loading && stack.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-3 animate-spin">🌀</div>
              <p>Loading profiles…</p>
            </div>
          </div>
        ) : stack.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 space-y-3">
              <div className="text-5xl">🎉</div>
              <p className="text-lg font-semibold text-white">You've seen everyone!</p>
              <p className="text-sm">Check back later for new profiles</p>
              <button
                onClick={fetchProfiles}
                className="mt-2 px-6 py-2 rounded-2xl bg-brand-600 text-white text-sm font-semibold"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {stack
              .slice(0, 3)
              .reverse()
              .map((profile, i, arr) => {
                const isTop = i === arr.length - 1;
                return (
                  <SwipeCard
                    key={profile.fid}
                    profile={profile}
                    onSwipe={handleSwipe}
                    isTop={isTop}
                    zIndex={i + 1}
                  />
                );
              })}
          </AnimatePresence>
        )}

        {/* Action buttons overlaid on the full-height card, lifted above the
            fixed bottom nav. The card's name/info block (in SwipeCard) sits at
            a higher bottom offset so it always stays above these. */}
        {topProfile && !loading && (
          <div className="absolute inset-x-0 z-30 bottom-[calc(4rem_+_env(safe-area-inset-bottom)_+_0.5rem)]">
            <SwipeActions
              onAction={(dir) => handleSwipe(topProfile.fid, dir)}
              disabled={swiping}
            />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav />

      {/* Match modal */}
      <MatchModal match={currentMatch} onClose={() => setCurrentMatch(null)} />
    </div>
  );
}
