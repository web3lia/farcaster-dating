import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ── Warm Terminal design tokens ──────────────────────────────────
        terminal: { bg: "#0A0E0D" },
        surface: "#0F1614",
        "ui-border": "#1C2620",
        acid: "#00E08A",         // primary accent — actions, success, like
        danger: "#FF5C5C",       // nope, delete, errors
        gold: "#FFB020",         // superlike, premium, amber
        ink: "#E8F0EC",          // text primary
        "ink-muted": "#5C6B63",  // text muted

        // ── brand → acid green alias (keeps all brand-* classes working) ──
        // Remove once screen-by-screen migration is complete.
        brand: {
          50:  "#e6fff5",
          100: "#b3ffe0",
          300: "#40edaa",
          500: "#00E08A",  // acid
          600: "#00C47A",  // acid dark — primary buttons
          700: "#009E62",  // acid darker — hover/active
        },

        // ── Legacy semantic swipe colors (keep until migrated) ───────────
        match: "#00E08A",
        like:  "#00E08A",
        nope:  "#FF5C5C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      animation: {
        "swipe-left":  "swipeLeft 0.4s ease-out forwards",
        "swipe-right": "swipeRight 0.4s ease-out forwards",
        "pop-in":      "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "fade-up":     "fadeUp 0.4s ease-out",
        heartbeat:     "heartbeat 0.6s ease-in-out",
      },
      keyframes: {
        swipeLeft:  { to: { transform: "translateX(-150%) rotate(-30deg)", opacity: "0" } },
        swipeRight: { to: { transform: "translateX(150%) rotate(30deg)", opacity: "0" } },
        popIn: {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        fadeUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)"   },
          "50%":      { transform: "scale(1.3)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
