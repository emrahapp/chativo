import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // ── Chativo brand tokens ─────────────────────────────
        brand: {
          DEFAULT: "#6554E8",
          50: "#F0EEFF",
          100: "#E2DEFF",
          200: "#C8C0FF",
          300: "#A99DFA",
          400: "#897BF1",
          500: "#6554E8",
          600: "#5544D8",
          700: "#4434B8",
          800: "#352890",
          900: "#231A66",
          950: "#150F40",
        },
        sidebar: {
          DEFAULT: "#090E1F",
          accent: "#141A30",
          muted: "#2A3147",
          foreground: "#E5E7EB",
          "muted-foreground": "#9CA3AF",
          border: "#1F2540",
        },
        // ── shadcn/ui semantic tokens (CSS vars) ─────────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(17, 24, 39, 0.06)",
        "soft-lg": "0 8px 40px rgba(17, 24, 39, 0.08)",
        glow: "0 8px 32px rgba(101, 84, 232, 0.25)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(at 30% 20%, rgba(101, 84, 232, 0.10) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168, 85, 247, 0.08) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(59, 130, 246, 0.06) 0px, transparent 50%)",
        "brand-gradient":
          "linear-gradient(135deg, #6554E8 0%, #8B5CF6 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
