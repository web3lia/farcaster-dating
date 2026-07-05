"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { useSwipeStore } from "@/store/swipe";
import { SwipeCard } from "@/components/swipe/SwipeCard";
import { SwipeActions } from "@/components/swipe/SwipeActions";
import { MatchModal } from "@/components/swipe/MatchModal";
import { SuperlikeModal } from "@/components/swipe/SuperlikeModal";
import { BottomNav } from "@/components/layout/BottomNav";
import { authFetch } from "@/lib/auth/authFetch";
import { openCastComposer, localDateString } from "@/lib/openCastComposer";
import { Button } from "@/components/ui/Button";
import type { SwipeDirection, Profile } from "@/types";
import toast from "react-hot-toast";
import sdk from "@farcaster/frame-sdk";

const SUPERLIKE_TOAST = "You're out of superlikes today — come back tomorrow ✨";

export default function SwipePage() {
  const router = useRouter();
  const { fid, isAuthenticated, swipeAddBannerLastShown, setSwipeAddBannerLastShown } = useAuthStore();
  const { stack, setStack, removeTop, currentMatch, setCurrentMatch } = useSwipeStore();
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [superlikeUsed, setSuperlikeUsed] = useState(false);
  const [pendingSuperlikeFid, setPendingSuperlikeFid] = useState<number | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [undoLimitUsed, setUndoLimitUsed] = useState(false);
  const [showAddBanner, setShowAddBanner] = useState(false);
  // Fids swiped this session — filtered out of every fetched deck so an
  // already-swiped card can never reappear, even if the server lags.
  const swipedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  // Show add-app banner once per day if app not yet added
  useEffect(() => {
    if (!isAuthenticated) return;
    if (swipeAddBannerLastShown === localDateString()) return;
    sdk.context.then((ctx) => {
      if (!ctx.client.added) {
        setShowAddBanner(true);
        setSwipeAddBannerLastShown(localDateString());
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!fid) return;
    if (stack.length === 0) fetchProfiles();
    fetchSuperlikeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid]);

  async function fetchSuperlikeStatus() {
    try {
      const res = await authFetch("/api/swipes/superlike-status");
      if (res.ok) {
        const data = await res.json();
        setSuperlikeUsed(data.used ?? false);
      }
    } catch {
      // Fail open — don't block swiping if status fetch fails
    }
  }

  async function fetchProfiles() {
    if (!fid || loading) return;
    setLoading(true);
    setFetchError(false);
    try {
      const res = await authFetch(`/api/profiles`);
      const data = await res.json();
      const incoming: Profile[] = data.profiles ?? [];
      // Merge into the current stack: keep what's there, append only new
      // profiles, and drop anything already swiped this session. No wholesale
      // replace → no flicker, and swiped cards stay out of the deck.
      const current = useSwipeStore.getState().stack;
      const incomingMap = new Map(incoming.map((p) => [p.fid, p]));
      const seen = new Set(current.map((p) => p.fid));
      const merged = [
        // Refresh existing entries with latest API data (picks up superlike badges etc.)
        ...current.map((p) => incomingMap.get(p.fid) ?? p),
        // Append profiles not yet in the stack
        ...incoming.filter((p) => !seen.has(p.fid)),
      ].filter((p) => !swipedRef.current.has(p.fid));
      setStack(merged);
    } catch {
      setFetchError(true);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  // Sends a confirmed superlike (after the modal) with an optional message.
  const executeSuperlike = useCallback(
    async (profileFid: number, superlikeMessage: string) => {
      if (!fid) return;
      setPendingSuperlikeFid(null);
      setSwiping(true);

      const profileSnapshot = useSwipeStore.getState().stack[0];
      swipedRef.current.add(profileFid);
      removeTop();

      try {
        const res = await authFetch("/api/swipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            swiped_fid: profileFid,
            direction: "superlike",
            superlike_message: superlikeMessage || null,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.status === 429 && data.error === "superlike_limit") {
          swipedRef.current.delete(profileFid);
          setStack([profileSnapshot, ...useSwipeStore.getState().stack]);
          setSuperlikeUsed(true);
          toast(SUPERLIKE_TOAST);
          return;
        }

        if (!res.ok) throw new Error(`${res.status} ${data.error ?? ""}`.trim());
        if (data.match) setCurrentMatch(data.match);
        setSuperlikeUsed(true);
        setCanUndo(true);
      } catch (e) {
        const isNetwork = e instanceof Error && e.message === "Network error, please try again";
        if (isNetwork && profileSnapshot) {
          swipedRef.current.delete(profileFid);
          setStack([profileSnapshot, ...useSwipeStore.getState().stack]);
          toast.error("Connection issue, try again");
        } else {
          toast.error(`Swipe failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      } finally {
        setSwiping(false);
      }

      if (useSwipeStore.getState().stack.length <= 3) fetchProfiles();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fid]
  );

  const handleSwipe = useCallback(
    async (profileFid: number, direction: SwipeDirection) => {
      if (swiping || !fid) return;

      // Superlike — open compose modal; card stays in deck until confirmed.
      if (direction === "up") {
        if (superlikeUsed) {
          toast(SUPERLIKE_TOAST);
          return;
        }
        setPendingSuperlikeFid(profileFid);
        return;
      }

      setSwiping(true);

      const apiDir = direction === "right" ? "like" : "nope";

      const profileSnapshot = useSwipeStore.getState().stack[0];
      swipedRef.current.add(profileFid);
      removeTop();

      try {
        const res = await authFetch("/api/swipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ swiped_fid: profileFid, direction: apiDir }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(`${res.status} ${data.error ?? ""}`.trim());
        if (data.match) setCurrentMatch(data.match);
        setCanUndo(true);
      } catch (e) {
        const isNetwork = e instanceof Error && e.message === "Network error, please try again";
        if (isNetwork && profileSnapshot) {
          swipedRef.current.delete(profileFid);
          setStack([profileSnapshot, ...useSwipeStore.getState().stack]);
          toast.error("Connection issue, try again");
        } else {
          toast.error(`Swipe failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      } finally {
        setSwiping(false);
      }

      if (useSwipeStore.getState().stack.length <= 3) fetchProfiles();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fid, swiping, superlikeUsed]
  );

  const UNDO_TOAST = "You're out of undos today — come back tomorrow ✨";

  async function handleUndo() {
    if (!fid || swiping) return;
    setSwiping(true);
    try {
      const res = await authFetch("/api/swipes/undo", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429 && data.error === "undo_limit") {
        setUndoLimitUsed(true);
        toast(UNDO_TOAST);
        return;
      }
      if (res.status === 404 && data.error === "nothing_to_undo") {
        setCanUndo(false);
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);

      const profile = data.profile as Profile | null;
      if (profile) {
        // Restore fresh profile to top — remove from swipedRef so it's swipeable again.
        swipedRef.current.delete(profile.fid);
        setStack([profile, ...useSwipeStore.getState().stack]);
      }
      setCanUndo(false);
    } catch {
      toast.error("Couldn't undo, try again");
    } finally {
      setSwiping(false);
    }
  }

  const topProfile = stack[0] as Profile | undefined;

  return (
    <div className="flex flex-col h-full safe-top">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 shrink-0">
        <h1 className="text-xl font-mono font-bold text-white flex items-center gap-2"><img src="/onlyfrens_mascot_green.png" alt="" className="w-7 h-7" /> Discover</h1>
        <Button variant="secondary" size="sm" onClick={() => fetchProfiles()}>Refresh</Button>
      </header>

      {/* Add-app nudge banner — shown once/day when app not yet added */}
      {showAddBanner && (
        <div className="mx-4 mb-2 shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface border border-acid/30">
          <span className="text-base shrink-0">🔔</span>
          <p className="flex-1 text-xs font-mono text-ink leading-snug">
            Add Onlyfrens to get notified about matches
          </p>
          <button
            onClick={() => router.push("/add-app")}
            className="shrink-0 text-xs font-mono font-semibold text-acid border border-acid/50 rounded-lg px-2.5 py-1 hover:bg-acid/10 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => setShowAddBanner(false)}
            className="shrink-0 text-ink-muted/50 hover:text-ink-muted text-sm leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Card stack */}
      <div className="relative flex-1 mx-4">
        {loading && stack.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-3 animate-spin">🌀</div>
              <p>Loading profiles…</p>
            </div>
          </div>
        ) : fetchError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <div className="text-4xl">📡</div>
              <p className="text-lg font-semibold text-ink">Couldn't load profiles</p>
              <p className="text-sm text-ink-muted leading-relaxed">Check your connection and try again.</p>
              <Button variant="primary" size="lg" fullWidth showPrefix onClick={fetchProfiles}>
                Retry
              </Button>
            </div>
          </div>
        ) : stack.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 px-6">
              <div className="text-5xl">🎉</div>
              <p className="text-lg font-semibold text-ink">You've seen everyone!</p>
              <p className="text-sm text-ink-muted leading-relaxed">
                Invite your frens so there's more people to meet 💜
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                showPrefix
                onClick={() => openCastComposer("running out of frens to swipe on Onlyfrens 👀 come join — dating, friendship & networking for Farcaster 💜")}
              >
                Invite frens
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={fetchProfiles}>
                Refresh
              </Button>
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
              superlikeDisabled={superlikeUsed}
              onSuperlikeBlocked={() => toast(SUPERLIKE_TOAST)}
              onUndo={handleUndo}
              undoDisabled={!canUndo || undoLimitUsed}
              onUndoBlocked={() => undoLimitUsed && toast(UNDO_TOAST)}
            />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav />

      {/* Match modal */}
      <MatchModal match={currentMatch} onClose={() => setCurrentMatch(null)} />

      {/* Superlike compose modal */}
      {pendingSuperlikeFid != null && (() => {
        const profile = stack.find((p) => p.fid === pendingSuperlikeFid);
        return profile ? (
          <SuperlikeModal
            profile={profile}
            onSend={(msg) => executeSuperlike(pendingSuperlikeFid, msg)}
            onCancel={() => setPendingSuperlikeFid(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
