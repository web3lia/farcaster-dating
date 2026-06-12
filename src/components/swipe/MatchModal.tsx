"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Match } from "@/types";
import { useAuthStore } from "@/store/auth";

interface Props {
  match: Match | null;
  onClose: () => void;
}

export function MatchModal({ match, onClose }: Props) {
  const router = useRouter();
  const { fid } = useAuthStore();

  if (!match) return null;

  const other = match.user1_fid === fid ? match.user2 : match.user1;
  const me = match.user1_fid === fid ? match.user1 : match.user2;

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-2 animate-heartbeat">💜</div>
            <h2 className="text-3xl font-black text-white mb-1">It's a Match!</h2>
            <p className="text-gray-400 text-sm mb-6">
              You and {other?.display_name} liked each other
            </p>

            <div className="flex justify-center items-center gap-4 mb-8">
              {[me, other].map((u, i) => (
                <div key={i} className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-brand-500 shadow-lg">
                    <Image
                      src={u?.pfp_url || "/placeholder-pfp.png"}
                      alt={u?.display_name ?? ""}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  onClose();
                  router.push(`/chat/${match.id}`);
                }}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-match text-white font-bold rounded-2xl text-lg shadow-lg"
              >
                Send a message 💬
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-400 text-sm"
              >
                Keep swiping
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
