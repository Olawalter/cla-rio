/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F4C81",
          50: "#E8F0F7",
          100: "#D1E1EF",
          200: "#A3C3DF",
          300: "#75A5CF",
          400: "#4787BF",
          500: "#0F4C81",
          600: "#0D4073",
          700: "#0A3460",
          800: "#08284C",
          900: "#051C39",
        },
        success: { DEFAULT: "#16A34A", light: "#DCFCE7" },
        warning: { DEFAULT: "#D97706", light: "#FEF3C7" },
        critical: { DEFAULT: "#DC2626", light: "#FEE2E2" },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F8FAFC",
          tertiary: "#F1F5F9",
        },
        border: { DEFAULT: "#E2E8F0", dark: "#CBD5E1" },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          tertiary: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
