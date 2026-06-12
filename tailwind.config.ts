import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f8",
          100: "#fce7f3",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        match: "#EC4899",
        like: "#10B981",
        nope: "#EF4444",
      },
      animation: {
        "swipe-left": "swipeLeft 0.4s ease-out forwards",
        "swipe-right": "swipeRight 0.4s ease-out forwards",
        "pop-in": "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "fade-up": "fadeUp 0.4s ease-out",
        heartbeat: "heartbeat 0.6s ease-in-out",
      },
      keyframes: {
        swipeLeft: {
          to: { transform: "translateX(-150%) rotate(-30deg)", opacity: "0" },
        },
        swipeRight: {
          to: { transform: "translateX(150%) rotate(30deg)", opacity: "0" },
        },
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
