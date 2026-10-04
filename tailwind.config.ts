import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080C14",
        canvas: "#0B101B",
        card: {
          DEFAULT: "#0F1626",
          subtle: "#131C31",
          elevated: "#18233C",
          border: "#1E2C48",
          hover: "#223253",
        },
        brand: {
          50: "#EEF2FF",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          glow: "rgba(99, 102, 241, 0.25)",
        },
        metric: {
          blue: "#3B82F6",
          emerald: "#10B981",
          purple: "#A855F7",
          amber: "#F59E0B",
          rose: "#EF4444",
          sky: "#0EA5E9",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        "panel-glow": "0 0 25px -5px rgba(99, 102, 241, 0.15)",
        "card-elevated": "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;