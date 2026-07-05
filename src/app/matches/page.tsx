"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import { authFetch } from "@/lib/auth/authFetch";
import { InviteBanner } from "@/components/matches/InviteBanner";
import { AddAppModal } from "@/components/matches/AddAppModal";
import { ProfileChooser } from "@/components/profile/ProfileChooser";
import { ProfileCardModal } from "@/components/profile/ProfileCardModal";
import { Button } from "@/components/ui/Button";
import type { Match, Profile } from "@/types";

export default function MatchesPage() {
  const router = useRouter();
  const { fid, isAuthenticated } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [chooser, setChooser] = useState<Profile | null>(null);
  const [viewCard, setViewCard] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  async function fetchMatches() {
    if (!fid) return;
    setFetchError(false);
    try {
      const r = await authFetch(`/api/matches`);
      const d = await r.json();
      setMatches(d.matches ?? []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid]);

  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === "visible") fetchMatches();
    }
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid]);

  function getOther(m: Match) {
    return m.user1_fid === fid ? m.user2 : m.user1;
  }

  return (
    <div className="flex flex-col h-full safe-top">
      <AddAppModal />

      {chooser && (
        <ProfileChooser
          profile={chooser}
          onViewCard={() => setViewCard(chooser)}
          onClose={() => setChooser(null)}
        />
      )}
      {viewCard && (
        <ProfileCardModal
          profile={viewCard}
          onClose={() => setViewCard(null)}
        />
      )}

      <header className="px-5 py-4 shrink-0">
        <h1 className="text-xl font-mono font-bold text-ink">💬 Matches</h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto pb-[calc(4rem_+_env(safe-area-inset-bottom)_+_1rem)]">
        <InviteBanner />
        {loading ? (
          <div className="flex justify-center pt-20 text-ink-muted">Loading…</div>
        ) : fetchError ? (
          <div className="flex flex-col items-center pt-20 gap-4 px-8 text-center">
            <span className="text-4xl">📡</span>
            <p className="text-ink font-semibold">Couldn&apos;t load matches</p>
            <p className="text-sm text-ink-muted">Check your connection and try again.</p>
            <Button variant="primary" size="md" showPrefix onClick={fetchMatches}>
              Retry
            </Button>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-3 text-center px-8">
            <span className="text-5xl">💜</span>
            <p className="text-ink font-semibold">No matches yet</p>
            <p className="text-sm text-ink-muted">Keep swiping to find your match!</p>
            <Button variant="primary" size="md" showPrefix onClick={() => router.push("/swipe")}>
              Start swiping
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-ui-border">
            {matches.map((m) => {
              const other = getOther(m);
              if (!other) return null;
              return (
                <li key={m.id}>
                  <div className="w-full flex items-center gap-4 px-5 py-4 text-left">
                    {/* Avatar — tap opens chooser */}
                    <button
                      onClick={() => setChooser(other)}
                      className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-acid/40"
                    >
                      <Avatar
                        src={other.pfp_url}
                        alt={other.display_name}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    {/* Row body — tap goes to chat */}
                    <button
                      onClick={() => router.push(`/chat/${m.id}`)}
                      className="flex-1 min-w-0 flex items-center gap-2 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-semibold text-ink truncate">{other.display_name}</p>
                        <p className="text-xs font-mono text-ink-muted truncate">@{other.username}</p>
                        <p className={`text-sm font-sans truncate mt-0.5 ${(m.unread_count ?? 0) > 0 ? "text-ink font-medium" : "text-ink-muted"}`}>
                          {m.last_message?.content ?? "Say hi! 👋"}
                        </p>
                      </div>
                      {(m.unread_count ?? 0) > 0 ? (
                        <div className="shrink-0 min-w-[20px] h-5 rounded-full bg-acid flex items-center justify-center px-1.5">
                          {m.unread_count === 1 ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-terminal-bg block" />
                          ) : (
                            <span className="text-terminal-bg text-xs font-mono font-bold leading-none">{m.unread_count}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted text-lg shrink-0">›</span>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
