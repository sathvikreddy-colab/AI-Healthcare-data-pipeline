import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#12121a",
        border: "#1e1e2e",
        accent: "#4f8ef7",
        "accent-dim": "#1e3a6e",
        bronze: "#b87333",
        silver: "#a8b2c1",
        gold: "#f0c040",
        "bronze-dim": "#3d2210",
        "silver-dim": "#1a2030",
        "gold-dim": "#2d2500",
        success: "#34d399",
        warn: "#f59e0b",
        danger: "#f87171",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
