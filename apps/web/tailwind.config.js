/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        crm: {
          bg: "var(--crm-bg)",
          fg: "var(--crm-fg)",
          card: "var(--crm-card)",
          panel: "var(--crm-panel)",
          muted: "var(--crm-muted)",
          "muted-fg": "var(--crm-muted-fg)",
          border: "var(--crm-border)",
          input: "var(--crm-input)",
          primary: "var(--crm-primary)",
          "primary-fg": "var(--crm-primary-fg)",
          ring: "var(--crm-ring)",
          destructive: "var(--crm-destructive)",
          "destructive-fg": "var(--crm-destructive-fg)",
          success: "var(--crm-success)",
          "success-fg": "var(--crm-success-fg)",
          warning: "var(--crm-warning)",
          "warning-fg": "var(--crm-warning-fg)",
          info: "var(--crm-info)",
          "info-fg": "var(--crm-info-fg)",
          brand: "var(--crm-brand)",
          "brand-fg": "var(--crm-brand-fg)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          light: "var(--brand-light)",
          fg: "var(--brand-fg)",
          ring: "var(--brand-ring)",
        },
        surface: {
          bg: "var(--bg)",
          elevated: "var(--bg-elevated)",
          subtle: "var(--bg-subtle)",
          hover: "var(--bg-hover)",
          active: "var(--bg-active)",
        },
        content: {
          fg: "var(--fg)",
          muted: "var(--fg-muted)",
          subtle: "var(--fg-subtle)",
        },
        card: {
          DEFAULT: "var(--card)",
          border: "var(--card-border)",
          hover: "var(--card-hover)",
        },
        input: {
          bg: "var(--input-bg)",
          border: "var(--input-border)",
          focus: "var(--input-focus)",
          "focus-ring": "var(--input-focus-ring)",
        },
        sidebar: {
          bg: "var(--sidebar-bg)",
          soft: "var(--sidebar-bg-soft)",
          fg: "var(--sidebar-fg)",
          muted: "var(--sidebar-muted)",
        },
        zinc: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        "brand-sm": "var(--shadow-brand-sm)",
        "brand-md": "var(--shadow-brand-md)",
        "brand-lg": "var(--shadow-brand-lg)",
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        120: "120ms",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
      },
      transitionTimingFunction: {
        ease: "var(--ease)",
        "ease-out": "var(--ease-out)",
        "ease-in": "var(--ease-in)",
        "ease-in-out": "var(--ease-in-out)",
        "ease-spring": "var(--ease-spring)",
        "ease-bounce": "var(--ease-bounce)",
      },
      transitionProperty: {
        all: "all",
        colors:
          "color, background-color, border-color, text-decoration-color, fill, stroke",
        transform: "transform",
        opacity: "opacity",
        shadow: "box-shadow",
        padding: "padding",
        height: "height",
        width: "width",
        spacing: "margin, padding",
      },
      scale: {
        85: "0.85",
        95: "0.95",
        97: "0.97",
        98: "0.98",
        102: "1.02",
        105: "1.05",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },
      animation: {
        in: "animate-in var(--duration-normal) var(--ease-out)",
        out: "animate-out var(--duration-fast) var(--ease-in)",
        "scale-in": "scale-in var(--duration-normal) var(--ease-spring)",
        "scale-out": "scale-out var(--duration-fast) var(--ease-in)",
        "slide-in-right":
          "slide-in-right var(--duration-normal) var(--ease-out)",
        "slide-out-right":
          "slide-out-right var(--duration-fast) var(--ease-in)",
        "slide-in-left": "slide-in-left var(--duration-normal) var(--ease-out)",
        "slide-down": "slide-down var(--duration-normal) var(--ease-out)",
        "slide-up": "slide-up var(--duration-normal) var(--ease-out)",
        "fade-in": "fade-in var(--duration-fast) var(--ease-out)",
        "fade-out": "fade-out var(--duration-fast) var(--ease-in)",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        spin: "spin 1s linear infinite",
        "bounce-soft": "bounce-soft 0.6s var(--ease-bounce)",
      },
      keyframes: {
        "animate-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "animate-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-8px)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(100%)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [
    function (api) {
      const { addUtilities, addComponents, theme } = api;
      const newUtilities = {
        ".focus-ring": {
          "&:focus-visible": {
            outline: "2px solid var(--brand)",
            outlineOffset: "2px",
          },
        },
        ".focus-ring-offset-2": {
          "&:focus-visible": {
            outlineOffset: "2px",
          },
        },
        ".input-field": {
          "@apply w-full rounded-xl border bg-[var(--input-bg)] px-4 py-3 text-sm transition-all duration-120 ease-out":
            {},
          "&:focus": {
            "@apply outline-none ring-2 ring-[var(--brand)] border-transparent":
              {},
          },
          "&::placeholder": {
            color: "var(--fg-subtle)",
          },
        },
        ".btn": {
          "@apply inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-120 ease-out focus-ring":
            {},
        },
        ".transition-padding-normal": {
          transitionProperty: "padding",
          transitionDuration: "200ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".transition-height": {
          transitionProperty: "height",
          transitionDuration: "200ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".transition-width": {
          transitionProperty: "width",
          transitionDuration: "200ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
      };
      const newComponents = {
        ".hover-lift": {
          transition:
            "transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "var(--shadow-lg)",
          },
        },
        ".hover-lift-sm": {
          transition:
            "transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "var(--shadow-md)",
          },
        },
        ".press-scale": {
          "&:active:not(:disabled)": {
            transform: "scale(0.97)",
            transition: "transform var(--duration-instant) var(--ease-out)",
          },
        },
        ".press-scale-sm": {
          "&:active:not(:disabled)": {
            transform: "scale(0.98)",
            transition: "transform var(--duration-instant) var(--ease-out)",
          },
        },
        ".card-base": {
          "@apply rounded-2xl border bg-[var(--card)] transition-all duration-200 ease-out":
            {},
          borderColor: "var(--card-border)",
        },
        ".card-elevated": {
          "@apply card-base shadow-sm": {},
        },
        ".card-interactive": {
          "@apply card-elevated hover-lift press-scale cursor-pointer": {},
        },
        ".glass-panel": {
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          "@apply rounded-2xl": {},
        },
        "html.dark .glass-panel": {
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        },
        ".badge-base": {
          "@apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors":
            {},
        },
        ".avatar-base": {
          "@apply inline-flex items-center justify-center rounded-full font-semibold text-[var(--brand-fg)]":
            {},
          background:
            "linear-gradient(135deg, var(--brand), var(--brand-hover))",
        },
        ".link-base": {
          "@apply text-[var(--brand)] underline-offset-2 hover:underline transition-colors":
            {},
        },
      };
      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
};
