/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0F1114", soft: "#1A1D22", line: "#2A2D33" },
        paper: { DEFAULT: "#F5F4F1", soft: "#FAF9F6" },
        accent: { DEFAULT: "#E54B16", soft: "#FCE8E0" },
        ok: "#1B7A3E",
        warn: "#B7791F",
        err: "#B91C1C",
        info: "#1F6FEB",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
