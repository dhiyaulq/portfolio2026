import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pulled directly from the Figma file (dsign-studio)
        background: "#ffffff",
        sidebar: "#f8f8f8",
        // Every near-black in the UI is #141414 — body copy, headings and the
        // secondary CTA label all resolve here.
        foreground: "#141414",
        heading: "#141414",
        muted: "#474747",
        skill: "#141414",
        border: "#373b3f",
        accent: "#1389e3",
        "accent-dark": "#1389e3",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
