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
    label: "Romance",
    description: "Dating & relationships",
    badgeClass: "bg-pink-500/90",
    selectedClass: "border-pink-500 bg-pink-500/10",
  },
  {
    id: "friendship",
    emoji: "🤝",
    label: "Friendship",
    description: "Like-minded people & friends",
    badgeClass: "bg-emerald-500/90",
    selectedClass: "border-emerald-500 bg-emerald-500/10",
  },
  {
    id: "networking",
    emoji: "🚀",
    label: "Networking",
    description: "Co-founders, collaborators, work connections",
    badgeClass: "bg-blue-500/90",
    selectedClass: "border-blue-500 bg-blue-500/10",
  },
];

export const INTENT_MAP: Record<Intent, IntentMeta> = INTENTS.reduce(
  (acc, meta) => ({ ...acc, [meta.id]: meta }),
  {} as Record<Intent, IntentMeta>
);

export const DEFAULT_INTENT: Intent = "networking";
export const DEFAULT_INTENTS: Intent[] = ["networking"];

/** Resolve a profile's intents to displayable metas; falls back to the
 *  default if the list is empty or missing. */
export function intentsToMetas(intents: Intent[] | null | undefined): IntentMeta[] {
  const list = intents && intents.length > 0 ? intents : DEFAULT_INTENTS;
  return list.map((id) => INTENT_MAP[id]).filter(Boolean);
}

// The single guided prompt (Stage 2/3/4)
export const PROMPT_LABEL = "What I'm building right now…";
// Short inline label used on the swipe card, e.g. "Building: ..."
export const PROMPT_SHORT = "Building";

export const ABOUT_MAX = 300;
export const PROMPT_MAX = 200;
