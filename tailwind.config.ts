import type { Config } from "tailwindcss";

// Auto Dude Mobile Detailing brand palette — black base, red brand accent.
// Red is the brand color; amber/gold = pending, green = positive, red also = danger.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0A",       // black background
        deep: "#111111",       // deep charcoal
        surface: "#161616",    // card
        surface2: "#202020",   // raised / hover
        line: "#2C2C2C",       // dark gray border
        accent: "#E11A22",     // brand red
        accent2: "#B3141B",    // darker red (hover / pressed)
        redglow: "#FF3B30",    // bright red highlight
        gold: "#F5C542",       // amber — pending / warning
        good: "#22C55E",       // green — active / complete / positive
        ink: "#FFFFFF",        // white text
        muted: "#9A9A9A",      // medium gray text
        silver: "#C7C7C7",     // light gray
        danger: "#E11A22",     // red — errors / past due
      },
      fontFamily: {
        // wired to next/font CSS variables set in layout.tsx
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        head: ["var(--font-oswald)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -14px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgba(225,26,34,0.20), 0 8px 30px -10px rgba(225,26,34,0.30)",
      },
    },
  },
  plugins: [],
};
export default config;
