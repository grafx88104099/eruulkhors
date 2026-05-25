/** @type {import('tailwindcss').Config} */
//
// The "emerald" palette is intentionally OVERRIDDEN with the project's brand
// green (#5F8F2F — the upper half of the logo disc). Every existing
// `emerald-XXX` utility in the codebase continues to work, but now resolves
// to the brand color ramp instead of Tailwind's default emerald. This was
// deliberate: rather than rename ~150 occurrences, we redefine the meaning.
//
// `soil` is a new namespace for the logo's lower-half brown (#4B321F),
// meant for warm accents, dark surfaces, and footers — opt in by using
// `bg-soil-900`, `text-soil-700`, etc.
//
// Both ramps were derived from the brand HSL by shifting only lightness
// (with a small saturation tweak at the extremes) so all shades read as
// the same hue.
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

        // Brand green (logo's grass half) — overrides Tailwind's default emerald.
        emerald: {
          50:  "#F2F7E8",
          100: "#DDEABF",
          200: "#C2D78F",
          300: "#A4C161",
          400: "#84AB3D",
          500: "#6B9530",
          600: "#5F8F2F",
          700: "#4C7726",
          800: "#3D5E1F",
          900: "#2D461A",
          950: "#1D2F11",
        },

        // Brand brown (logo's soil half) — new namespace.
        soil: {
          50:  "#F8F2EC",
          100: "#E8D6C2",
          200: "#D2B194",
          300: "#B58A66",
          400: "#966B43",
          500: "#785430",
          600: "#4B321F",
          700: "#3D2918",
          800: "#2E2012",
          900: "#25180D",
          950: "#1A1109",
        },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
