"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import { authFetch } from "@/lib/auth/authFetch";
import { ensureAccessToken } from "@/lib/auth/signInFlow";
import sdk from "@farcaster/frame-sdk";
import toast from "react-hot-toast";

import type { Message, Profile } from "@/types";
import { ArrowLeft, SendHorizontal as PaperAirplaneIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileChooser } from "@/components/profile/ProfileChooser";
import { ProfileCardModal } from "@/components/profile/ProfileCardModal";
const ArrowLeftIcon = ArrowLeft;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
  const router = useRouter();
  const { fid } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
  const [showChooser, setShowChooser] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [unmatching, setUnmatching] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fid) { router.replace("/"); return; }
    loadMessages();
    loadMatch();

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const token = await ensureAccessToken();
      if (token) supabase.realtime.setAuth(token);
      channel = supabase
        .channel(`messages:${matchId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const incoming = payload.new as Message;
            setMessages((prev) =>
              prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
            );
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    const res = await authFetch(`/api/messages?match_id=${matchId}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setMessagesLoaded(true);
  }

  async function loadMatch() {
    const res = await authFetch(`/api/matches`);
    const data = await res.json();
    const m = (data.matches ?? []).find((x: { id: string }) => x.id === matchId);
    if (m) {
      const other = m.user1_fid === fid ? m.user2 : m.user1;
      setOtherUser(other);
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending || !fid) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await authFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
        );
      } else {
        setInput(content);
      }
    } catch {
      setInput(content);
      toast.error("Couldn't send — check your connection and try again");
    } finally {
      setSending(false);
    }
  }

  async function confirmUnmatch() {
    setUnmatching(true);
    try {
      const res = await authFetch(`/api/matches/${matchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      toast.success("Unmatched");
      router.replace("/matches");
    } catch {
      toast.error("Couldn't unmatch, try again");
      setShowUnmatchDialog(false);
    } finally {
      setUnmatching(false);
    }
  }

  return (
    <div className="flex flex-col h-full safe-top">
      {otherUser && showChooser && (
        <ProfileChooser
          profile={otherUser}
          onViewCard={() => setShowCard(true)}
          onClose={() => setShowChooser(false)}
        />
      )}
      {otherUser && showCard && (
        <ProfileCardModal
          profile={otherUser}
          onClose={() => setShowCard(false)}
        />
      )}

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-ui-border shrink-0">
        <button onClick={() => router.back()} className="p-1 text-ink-muted shrink-0">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        {otherUser && (
          <button
            className="flex items-center gap-3 min-w-0 flex-1"
            onClick={() => setShowChooser(true)}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-acid/60 shrink-0">
              <Avatar src={otherUser.pfp_url} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-mono font-semibold text-ink truncate">{otherUser.display_name}</span>
          </button>
        )}
        <button
          onClick={() => setShowUnmatchDialog(true)}
          className="p-1.5 text-ink-muted shrink-0 ml-auto"
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messagesLoaded && messages.length === 0 && otherUser && (
          <div className="flex flex-col items-center justify-center h-full gap-4 pb-6 text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-acid/60 shadow-lg shadow-acid/10">
              <Avatar src={otherUser.pfp_url} alt={otherUser.display_name} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-mono font-bold text-ink">You matched with {otherUser.display_name} 💜</p>
              <p className="text-sm text-ink-muted leading-relaxed max-w-xs">
                Break the ice — say hi or ask what they&apos;re building 👋
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const mine = msg.sender_fid === fid;
          const isLastInGroup = i === messages.length - 1 || messages[i + 1].sender_fid !== msg.sender_fid;
          return (
            <div key={msg.id} className={`flex flex-col ${mine ? "items-end" : "items-start"} ${isLastInGroup ? "mb-3" : "mb-0.5"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-sans ${
                  mine
                    ? "bg-acid/20 border border-acid/40 text-white rounded-br-sm"
                    : "bg-surface border border-ui-border text-ink rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {isLastInGroup && (
                <span className="font-mono text-[10px] text-ink-muted mt-1 px-1">
                  {formatTime(msg.created_at)}
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-ui-border bg-surface safe-bottom">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ink-muted text-sm pointer-events-none select-none">›</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message…"
              className="w-full bg-terminal-bg border border-ui-border text-ink placeholder-ink-muted/60 rounded-lg pl-7 pr-4 py-2.5 text-sm font-sans outline-none focus:border-acid/50 focus:ring-1 focus:ring-acid/30 transition-colors"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-acid/20 border border-acid/50 text-acid flex items-center justify-center disabled:opacity-40 active:bg-acid/40 transition-colors shrink-0"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unmatch confirmation dialog */}
      {showUnmatchDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          onClick={() => !unmatching && setShowUnmatchDialog(false)}
        >
          <div
            className="bg-surface border border-ui-border rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-mono font-bold text-ink mb-2">
              Unmatch {otherUser?.display_name ?? "this person"}?
            </h2>
            <p className="text-sm text-ink-muted mb-6 leading-relaxed">
              This deletes the conversation for both of you. This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setShowUnmatchDialog(false)}
                disabled={unmatching}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                className="flex-1"
                onClick={confirmUnmatch}
                disabled={unmatching}
              >
                {unmatching ? "Removing…" : "Yes, unmatch"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
