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
        // Deep cosmic void & refined surfaces (inspired by mapadoastro & nesilnoble)
        void: "#060911",
        canvas: "#080c16",
        surface: {
          base: "#0c111e",
          subtle: "#101627",
          elevated: "#151d32",
          overlay: "#1a243d",
          well: "#070b14",
        },
        border: {
          hairline: "rgba(255, 255, 255, 0.06)",
          subtle: "rgba(255, 255, 255, 0.09)",
          prominent: "rgba(255, 255, 255, 0.15)",
          focus: "rgba(99, 102, 241, 0.4)",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // Signature luminescent indigo
          600: "#4f46e5",
          700: "#4338ca",
          glow: "rgba(99, 102, 241, 0.20)",
        },
        accent: {
          cyan: "#06b6d4",
          sky: "#38bdf8",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          purple: "#a855f7",
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
        "subtle-card": "0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.35)",
        "elevated-card": "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05) inset",
        "glow-brand": "0 0 25px -4px rgba(99, 102, 241, 0.25)",
        "glow-emerald": "0 0 20px -4px rgba(16, 185, 129, 0.30)",
        "glow-cyan": "0 0 20px -4px rgba(6, 182, 212, 0.30)",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
