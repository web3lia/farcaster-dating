"use client";

import { motion } from "framer-motion";
import type { SwipeDirection } from "@/types";

interface Props {
  onAction: (direction: SwipeDirection) => void;
  disabled?: boolean;
}

const BTN = "flex items-center justify-center rounded-full shadow-lg active:scale-90 transition-transform disabled:opacity-30";

export function SwipeActions({ onAction, disabled }: Props) {
  return (
    <div className="flex justify-center items-center gap-5 py-4">
      <motion.button
        whileTap={{ scale: 0.88 }}
        disabled={disabled}
        onClick={() => onAction("left")}
        className={`${BTN} w-14 h-14 bg-gray-800 border-2 border-nope text-nope text-2xl`}
        aria-label="Nope"
      >
        ✕
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.88 }}
        disabled={disabled}
        onClick={() => onAction("up")}
        className={`${BTN} w-11 h-11 bg-gray-800 border-2 border-blue-400 text-blue-400 text-lg`}
        aria-label="Super Like"
      >
        ⭐
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.88 }}
        disabled={disabled}
        onClick={() => onAction("right")}
        className={`${BTN} w-14 h-14 bg-gray-800 border-2 border-like text-like text-2xl`}
        aria-label="Like"
      >
        ♥
      </motion.button>
    </div>
  );
}
