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
        // ── Chativo brand tokens — gece mavisi / deep navy ───
        brand: {
          DEFAULT: "#0F172A",
          50:  "#F1F5F9",
          100: "#E2E8F0",
          200: "#CBD5E1",
          300: "#94A3B8",
          400: "#64748B",
          500: "#1E293B",     // primary CTA — almost-black navy (Link Welcome tarzı)
          600: "#0F172A",     // hover / pressed
          700: "#0B1220",
          800: "#070C18",
          900: "#03060F",
          950: "#020409",
        },
        accent2: {
          50:  "#EFF6FF",
          500: "#2563EB",     // info link blue — minimal kullanım
          600: "#1D4ED8",
        },
        // Sidebar artık LIGHT teması kullanıyor — bu tokenlar legacy hold,
        // direkt sidebar.tsx zaten light bg-white kullanacak.
        sidebar: {
          DEFAULT: "#FFFFFF",
          accent:  "#F1F5F9",
          muted:   "#E2E8F0",
          foreground: "#0F172A",
          "muted-foreground": "#64748B",
          border:  "#E2E8F0",
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
        soft: "0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)",
        "soft-lg": "0 8px 24px rgba(15, 23, 42, 0.08)",
        glow: "0 8px 24px rgba(15, 23, 42, 0.12)",
      },
      backgroundImage: {
        // Çok hafif gri tonu — Akakçe / Link tarzı düz beyaz hissi
        "hero-gradient":
          "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        "brand-gradient":
          "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
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
