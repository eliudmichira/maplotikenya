import animate from 'tailwindcss-animate';
/** @type {import('tailwindcss').Config} */
// Shared mono ramp used to override every colorful family below.
const monoRamp = () => ({
  50:  '#f8f8f8', 100: '#f0f0f0', 200: '#e2e2e2', 300: '#c8c8c8',
  400: '#a3a3a3', 500: '#505050', 600: '#303030', 700: '#1a1a1a',
  800: '#0e1311', 900: '#000000',
});
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--ui-radius)',
        md: 'calc(var(--ui-radius) - 2px)',
        sm: 'calc(var(--ui-radius) - 4px)',
      },
      fontFamily: {
        'manrope':  ['Apfel Grotezk', 'Manrope', 'sans-serif'],
        'lato':     ['Apfel Grotezk', 'Lato', 'sans-serif'],
        'primary':  ['Apfel Grotezk', 'Manrope', 'sans-serif'],
        'sans':     ['Apfel Grotezk', 'Manrope', 'system-ui', 'sans-serif'],
        'apfel':    ['Apfel Grotezk', 'system-ui', 'sans-serif'],
        'apfel-brukt': ['Apfel Grotezk Brukt', 'Apfel Grotezk', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ─── UI kit tokens (shadcn-style) — see --ui-* in index.css ───
        background: 'rgb(var(--ui-background) / <alpha-value>)',
        foreground: 'rgb(var(--ui-foreground) / <alpha-value>)',
        card: { DEFAULT: 'rgb(var(--ui-card) / <alpha-value>)', foreground: 'rgb(var(--ui-card-foreground) / <alpha-value>)' },
        popover: { DEFAULT: 'rgb(var(--ui-popover) / <alpha-value>)', foreground: 'rgb(var(--ui-popover-foreground) / <alpha-value>)' },
        muted: { DEFAULT: 'rgb(var(--ui-muted) / <alpha-value>)', foreground: 'rgb(var(--ui-muted-foreground) / <alpha-value>)' },
        destructive: { DEFAULT: 'rgb(var(--ui-destructive) / <alpha-value>)', foreground: 'rgb(var(--ui-destructive-foreground) / <alpha-value>)' },
        success: 'rgb(var(--ui-success) / <alpha-value>)',
        warning: 'rgb(var(--ui-warning) / <alpha-value>)',
        border: 'rgb(var(--ui-border) / <alpha-value>)',
        input: 'rgb(var(--ui-input) / <alpha-value>)',
        ring: 'rgb(var(--ui-ring) / <alpha-value>)',
        // ─── PRIMARY: MONO (black-first CTA palette) ──────────────────
        primary: {
          DEFAULT: 'rgb(var(--ui-primary) / <alpha-value>)',
          foreground: 'rgb(var(--ui-primary-foreground) / <alpha-value>)',
          50:  '#f8f8f8',   // off-white
          100: '#f0f0f0',
          200: '#e2e2e2',
          300: '#c8c8c8',
          400: '#a3a3a3',
          500: '#505050',   // mid gray (body)
          600: '#303030',
          700: '#1a1a1a',
          800: '#0e1311',   // near-black green-tinted (badge bg)
          900: '#000000',   // pure black (primary CTA)
        },
        // Explicit mono aliases
        mono: {
          white:  '#ffffff',
          off:    '#f8f8f8',
          gray:   '#505050',
          badge:  '#0e1311',
          black:  '#000000',
        },
        // The one sparing neon accent
        accent: {
          400: '#fbbf24',
          500: '#fbbf24',
          DEFAULT: '#fbbf24',
        },
        cream: {
          50:  '#fffdf6', 100: '#fffaf0', 200: '#f7f6f0',
          300: '#f7f1e3', 400: '#eee9db', 500: '#e0dccf',
        },
        // ─── NEUTRAL GRAY (no blue tint) ─────────────────────────────
        // Tailwind's default gray is blue-tinted (#374151, #1f2937, #111827),
        // which clashed with the neutral blacks used by the CSS variables and
        // the isDark ternaries in dark mode. Align it with --bg / --surface.
        gray: {
          50:  '#f8f8f8', 100: '#f0f0f0', 200: '#e2e2e2', 300: '#c8c8c8',
          400: '#a3a3a3', 500: '#6b6b6b', 600: '#303030', 700: '#1a1a1a',
          800: '#111111', 900: '#0a0a0a', 950: '#000000',
        },
        // ─── ALL COLORFUL FAMILIES → MONO (single source of truth) ───
        emerald:  monoRamp(),
        green:    monoRamp(),
        lime:     monoRamp(),
        teal:     monoRamp(),
        blue:     monoRamp(),
        sky:      monoRamp(),
        indigo:   monoRamp(),
        cyan:     monoRamp(),
        violet:   monoRamp(),
        purple:   monoRamp(),
        fuchsia:  monoRamp(),
        pink:     monoRamp(),
        rose:     monoRamp(),
        // Note: `red`, `orange`, `amber`, `yellow` intentionally NOT overridden —
        // preserved for error/warning semantics.
        // Secondary - Warm Gold/Beige (#90e0ef original BumiHouse)
        secondary: {
          DEFAULT: 'rgb(var(--ui-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--ui-secondary-foreground) / <alpha-value>)',
          50: '#fefdf8',
          100: '#fefbf3',
          200: '#90e0ef',
          300: '#c9c285',
          400: '#b7af66',
          500: '#a59c47',
          600: '#938952',
          700: '#81764d',
          800: '#6f6348',
          900: '#5d5043'
        },
        // Dark theme — TRUE NEUTRAL blacks (no blue/green tint)
        dark: {
          base:     '#0A0A0A',
          surface:  '#111111',
          elevated: '#131313',
          overlay:  '#1C1C1C',
          900: '#0A0A0A',
          800: '#111111',
          700: '#131313',
          600: '#1C1C1C',
        },
        // Status colors
        success: '#fbbf24',      // the neon accent
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#ffffff',
      },
      backgroundColor: {
        'dark-base':     '#000000',
        'dark-surface':  '#0e1311',
        'dark-elevated': '#1a1a1a',
        'glass-dark':    'rgba(14, 19, 17, 0.72)',
        'glass-light':   'rgba(255, 255, 255, 0.8)',
        'scrim':         'rgba(0, 0, 0, 0.24)',
      },
      borderColor: {
        'glass-dark':  'rgba(255, 255, 255, 0.08)',
        'glass-light': 'rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        // CTA gradients — AMBER (used by Get Started, Subscribe, Contact Sales, etc.)
        'gradient-primary':        'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
        'gradient-primary-hover':  'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
        'gradient-brand':          'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
        'gradient-secondary':      'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
        'gradient-secondary-hover':'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
        'gradient-dark':           'linear-gradient(180deg, #000000 0%, #0e1311 100%)',
        'gradient-emerald':        'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
        'gradient-purple':         'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
        'scrim-bottom':            'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
        // Amber embossed CTA — used by every shadow-primary/-secondary/-emerald/-purple ref
        'primary':   'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.15), 0 8px 20px -6px rgba(251,191,36,0.45)',
        'secondary': 'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.15), 0 8px 20px -6px rgba(251,191,36,0.45)',
        'emboss':    'inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.35), 0 6px 16px -4px rgba(0,0,0,0.4)',
        'emboss-light': 'inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px -4px rgba(0,0,0,0.12)',
        'accent':    '0 0 0 1px rgba(251,191,36,0.4), 0 6px 20px -4px rgba(251,191,36,0.35)',
        'emerald':   'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.15), 0 8px 20px -6px rgba(251,191,36,0.45)',
        'purple':    'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.15), 0 8px 20px -6px rgba(251,191,36,0.45)',
        // Google Material 3 inspired shadows
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'elevation-5': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      backdropBlur: {
        'glass': '20px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'gradient-shift': 'gradientShift 20s ease infinite',
        'blob-float': 'blobFloat 25s infinite ease-in-out',
        'blob-pulse': 'blobPulse 20s infinite ease-in-out',
        // Google Material 3 animations
        'shimmer': 'shimmer 1.5s linear infinite',
        'ripple': 'ripple 0.6s ease-out',
        'emphasize': 'emphasize 0.2s cubic-bezier(0.2, 0.0, 0, 1.0)',
        'decelerate': 'decelerate 0.3s cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'accelerate': 'accelerate 0.2s cubic-bezier(0.3, 0.0, 0.8, 0.15)',
        'spring': 'spring 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gradientShift: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1) rotate(0deg)' },
          '50%': { opacity: '0.25', transform: 'scale(1.1) rotate(180deg)' },
        },
        blobFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.95)' },
        },
        blobPulse: {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0.08' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.2)', opacity: '0.12' },
        },
        // Google Material 3 keyframes
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.8' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        emphasize: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        decelerate: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        accelerate: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        spring: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'all': 'all',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      screens: {
        'xs': '475px',
        // Default Tailwind screens
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom larger screens
        '3xl': '1920px',
        '4xl': '2560px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '85': '0.85',
      },
    },
  },
  plugins: [
    animate,
    // Custom plugin for theme-aware utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-gradient-primary': {
          background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-secondary': {
          background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.glassmorphism-dark': {
          background: 'rgba(31, 41, 55, 0.8)', // gray-800 with opacity
          'backdrop-filter': 'blur(20px) saturate(1.4)',
          border: '1px solid rgba(55, 65, 81, 0.3)', // gray-700 with opacity
          'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(52, 211, 153, 0.1)',
        },
        '.glassmorphism-light': {
          background: 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(20px) saturate(1.2)',
          border: '1px solid rgba(229, 231, 235, 0.5)',
          'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};