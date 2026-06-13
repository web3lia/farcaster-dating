import type { Intent } from "@/types";

export interface IntentMeta {
  id: Intent;
  emoji: string;
  label: string;
  description: string;
  /** Badge background (used over the card photo) */
  badgeClass: string;
  /** Accent ring/border when selected in pickers */
  selectedClass: string;
}

export const INTENTS: IntentMeta[] = [
  {
    id: "romance",
    emoji: "💜",
    label: "Романтика",
    description: "Свидания и отношения",
    badgeClass: "bg-pink-500/90",
    selectedClass: "border-pink-500 bg-pink-500/10",
  },
  {
    id: "friendship",
    emoji: "🤝",
    label: "Дружба",
    description: "Единомышленники и друзья",
    badgeClass: "bg-emerald-500/90",
    selectedClass: "border-emerald-500 bg-emerald-500/10",
  },
  {
    id: "networking",
    emoji: "🚀",
    label: "Нетворк",
    description: "Напарники, co-founder, рабочие связи",
    badgeClass: "bg-blue-500/90",
    selectedClass: "border-blue-500 bg-blue-500/10",
  },
];

export const INTENT_MAP: Record<Intent, IntentMeta> = INTENTS.reduce(
  (acc, meta) => ({ ...acc, [meta.id]: meta }),
  {} as Record<Intent, IntentMeta>
);

export const DEFAULT_INTENT: Intent = "networking";

// The single guided prompt (Stage 2/3/4)
export const PROMPT_LABEL = "Над чем я сейчас работаю…";

export const ABOUT_MAX = 300;
export const PROMPT_MAX = 200;
