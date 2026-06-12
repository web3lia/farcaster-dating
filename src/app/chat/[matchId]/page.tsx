"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types";
import { ArrowLeft, SendHorizontal as PaperAirplaneIcon } from "lucide-react";
const ArrowLeftIcon = ArrowLeft;

export default function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const router = useRouter();
  const { fid, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ display_name: string; pfp_url: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fid) { router.replace("/"); return; }
    loadMessages();
    loadMatch();
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    const res = await fetch(`/api/messages?match_id=${matchId}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

  async function loadMatch() {
    const res = await fetch(`/api/matches?fid=${fid}`);
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
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, sender_fid: fid, content }),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full safe-top">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <button onClick={() => router.back()} className="p-1 text-gray-400">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        {otherUser && (
          <>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-brand-500">
              <Avatar src={otherUser.pfp_url} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-white">{otherUser.display_name}</span>
          </>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => {
          const mine = msg.sender_fid === fid;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  mine
                    ? "bg-brand-600 text-white rounded-br-md"
                    : "bg-gray-800 text-gray-100 rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-800 bg-gray-900 safe-bottom">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center disabled:opacity-40"
          >
            <PaperAirplaneIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
