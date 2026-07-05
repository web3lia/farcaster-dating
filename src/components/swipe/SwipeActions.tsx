"use client";

import { motion } from "framer-motion";
import { RotateCcw, X, Star, Heart } from "lucide-react";
import type { SwipeDirection } from "@/types";

interface Props {
  onAction: (direction: SwipeDirection) => void;
  disabled?: boolean;
  superlikeDisabled?: boolean;
  onSuperlikeBlocked?: () => void;
  onUndo?: () => void;
  undoDisabled?: boolean;
  onUndoBlocked?: () => void;
}

const BASE = "flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-30";

export function SwipeActions({ onAction, disabled, superlikeDisabled, onSuperlikeBlocked, onUndo, undoDisabled, onUndoBlocked }: Props) {
  function handleSuperlike() {
    if (superlikeDisabled) {
      onSuperlikeBlocked?.();
    } else {
      onAction("up");
    }
  }

  function handleUndo() {
    if (undoDisabled) {
      onUndoBlocked?.();
    } else {
      onUndo?.();
    }
  }

  return (
    <div className="relative flex justify-center items-center py-4">
      {/* Undo — absolutely left of centered trio */}
      <motion.button
        whileTap={undoDisabled ? {} : { scale: 0.88 }}
        disabled={disabled}
        onClick={handleUndo}
        className={`${BASE} absolute left-6 w-11 h-11 bg-[#0A0E0D]/80 border border-ink-muted/50 text-ink-muted shadow-md backdrop-blur-sm ${
          undoDisabled ? "opacity-30 cursor-default" : "hover:border-ink-muted hover:text-ink"
        }`}
        aria-label="Undo last swipe"
      >
        <RotateCcw className="w-4 h-4" />
      </motion.button>

      <div className="flex justify-center items-center gap-5">
        {/* Nope */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          disabled={disabled}
          onClick={() => onAction("left")}
          className={`${BASE} w-14 h-14 bg-danger/25 text-danger shadow-md backdrop-blur-sm active:bg-danger/40`}
          aria-label="Nope"
        >
          <X className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>

        {/* Superlike */}
        <motion.button
          whileTap={superlikeDisabled ? {} : { scale: 0.88 }}
          disabled={disabled}
          onClick={handleSuperlike}
          className={`${BASE} w-11 h-11 bg-gold/25 text-gold shadow-md backdrop-blur-sm active:bg-gold/40 ${
            superlikeDisabled ? "opacity-30 cursor-default" : ""
          }`}
          aria-label="Super Like"
        >
          <Star className="w-5 h-5" strokeWidth={2} />
        </motion.button>

        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          disabled={disabled}
          onClick={() => onAction("right")}
          className={`${BASE} w-14 h-14 bg-acid/25 text-acid shadow-md backdrop-blur-sm active:bg-acid/40`}
          aria-label="Like"
        >
          <Heart className="w-6 h-6" strokeWidth={2} />
        </motion.button>
      </div>
    </div>
  );
}
