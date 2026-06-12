"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/auth";
import { BottomNav } from "@/components/layout/BottomNav";
import type { Match } from "@/types";

export default function MatchesPage() {
  const router = useRouter();
  const { fid, isAuthenticated } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!fid) return;
    fetch(`/api/matches?fid=${fid}`)
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .finally(() => setLoading(false));
  }, [fid]);

  function getOther(m: Match) {
    return m.user1_fid === fid ? m.user2 : m.user1;
  }

  return (
    <div className="flex flex-col h-full safe-top">
      <header className="px-5 py-4 shrink-0">
        <h1 className="text-xl font-bold text-white">💬 Matches</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex justify-center pt-20 text-gray-500">Loading…</div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center pt-20 text-gray-500 gap-3">
            <span className="text-5xl">💜</span>
            <p className="text-white font-semibold">No matches yet</p>
            <p className="text-sm text-center px-8">Keep swiping to find your match!</p>
            <button
              onClick={() => router.push("/swipe")}
              className="mt-3 px-6 py-2 bg-brand-600 rounded-2xl text-white font-semibold text-sm"
            >
              Start swiping
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {matches.map((m) => {
              const other = getOther(m);
              if (!other) return null;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => router.push(`/chat/${m.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-brand-500">
                      <Image
                        src={other.pfp_url || "/placeholder-pfp.png"}
                        alt={other.display_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{other.display_name}</p>
                      <p className="text-xs text-gray-400 truncate">@{other.username}</p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {m.last_message?.content ?? "Say hi! 👋"}
                      </p>
                    </div>
                    <span className="text-gray-600 text-lg">›</span>
                  </button>
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
