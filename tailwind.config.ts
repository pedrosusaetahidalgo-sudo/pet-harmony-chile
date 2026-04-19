import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        display: ["'Fredoka'", "'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        medical: {
          DEFAULT: 'hsl(var(--medical))',
          foreground: 'hsl(var(--medical-foreground))',
          light: 'hsl(var(--medical-light))',
        },
        appointment: {
          DEFAULT: 'hsl(var(--appointment))',
          foreground: 'hsl(var(--appointment-foreground))',
          light: 'hsl(var(--appointment-light))',
        },
        premium: {
          DEFAULT: 'hsl(var(--premium))',
          foreground: 'hsl(var(--premium-foreground))',
          light: 'hsl(var(--premium-light))',
          dark: 'hsl(var(--premium-dark))',
          glow: 'hsl(var(--premium-glow))',
        },
        /* ── Brand Purple Scale (brand 2.0 primary) ── */
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        /* ── Gold Scale (brand 2.0 secondary — elevada a token oficial) ── */
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        /* ── Audience Palettes (elevadas desde pitch HTMLs) ── */
        audience: {
          /* Inversionistas: purple + gold lockup */
          'invest-from': '#9333ea',
          'invest-to': '#eab308',
          'invest-deep': '#581c87',
          'invest-accent': '#b45309',
          /* Companys: deep purple institucional */
          'companys-from': '#581c87',
          'companys-to': '#9333ea',
          'companys-deep': '#2a1046',
          'companys-accent': '#7e22ce',
          /* Partners: emerald colaborativo */
          'partners-from': '#047857',
          'partners-to': '#10b981',
          'partners-deep': '#064e3b',
          'partners-accent': '#059669',
          /* Voices: rose cálido aspiracional */
          'voices-from': '#be185d',
          'voices-to': '#ec4899',
          'voices-deep': '#831843',
          'voices-accent': '#db2777',
        },
        /* ── Semantic Colors ── */
        success: {
          DEFAULT: '#16a34a',
          light: '#f0fdf4',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fffbeb',
        },
        danger: {
          DEFAULT: '#dc2626',
          light: '#fef2f2',
        },
        info: {
          DEFAULT: '#2563eb',
          light: '#eff6ff',
        },
        /* ── Health State Tokens ── */
        health: {
          good: '#16a34a',
          'good-bg': '#f0fdf4',
          attention: '#d97706',
          'attention-bg': '#fffbeb',
          urgent: '#dc2626',
          'urgent-bg': '#fef2f2',
          unknown: '#64748b',
          'unknown-bg': '#f8fafc',
        },
      },
      backgroundImage: {
        'warm-gradient': 'var(--warm-gradient)',
        'nature-gradient': 'var(--nature-gradient)',
        'hero-gradient': 'var(--hero-gradient)',
        'medical-gradient': 'var(--medical-gradient)',
        'appointment-gradient': 'var(--appointment-gradient)',
        'premium-gradient': 'var(--premium-gradient)',
        'premium-gradient-soft': 'var(--premium-gradient-soft)',
        /* ── Brand 2.0 gradients ── */
        'brand-gold-gradient': 'linear-gradient(135deg, #9333ea 0%, #eab308 100%)',
        'brand-deep-gradient': 'linear-gradient(135deg, #2a1046 0%, #581c87 50%, #9333ea 100%)',
        'audience-invest-gradient': 'linear-gradient(135deg, #9333ea 0%, #eab308 100%)',
        'audience-companys-gradient': 'linear-gradient(135deg, #581c87 0%, #9333ea 100%)',
        'audience-partners-gradient': 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
        'audience-voices-gradient': 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
      },
      boxShadow: {
        /* Legacy (no remover) */
        soft: '0 2px 8px -2px rgba(0,0,0,0.08)',
        card: '0 4px 12px -2px rgba(0,0,0,0.06)',
        elevated: '0 8px 24px -4px rgba(0,0,0,0.1)',
        brand: '0 8px 24px -4px rgba(147,51,234,0.2)',
        medium: 'var(--shadow-medium)',
        premium: 'var(--premium-shadow)',
        'premium-sm': 'var(--premium-shadow-sm)',
        /* ── Brand 2.0 scale (4 elevaciones + 2 especiales) ── */
        flat: '0 0 0 1px rgba(0,0,0,0.04)',
        'brand-glow': '0 10px 30px -12px rgba(147,51,234,0.35)',
        'brand-hover': '0 24px 60px -16px rgba(147,51,234,0.22)',
        'gold-glow': '0 10px 40px -10px rgba(234,179,8,0.45)',
        'gold-hover': '0 24px 60px -16px rgba(234,179,8,0.35)',
        /* Audience shadows */
        'audience-invest': '0 10px 30px -12px rgba(234,179,8,0.45)',
        'audience-companys': '0 10px 30px -12px rgba(147,51,234,0.45)',
        'audience-partners': '0 10px 30px -12px rgba(16,185,129,0.45)',
        'audience-voices': '0 10px 30px -12px rgba(236,72,153,0.45)',
      },
      transitionTimingFunction: {
        /* ── Motion curves brand 2.0 ── */
        'out-soft': 'cubic-bezier(.2,.8,.2,1)',
        'out-pop': 'cubic-bezier(.16,1,.3,1)',
      },
      transitionDuration: {
        /* ── Motion durations brand 2.0 ── */
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
        hero: '700ms',
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '6px',
        xl: '20px',
        '2xl': '28px',
        '3xl': '36px',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'premium-shimmer': {
          '0%, 100%': {
            boxShadow: '0 0 20px -4px hsl(42 88% 52% / 0.4), 0 0 40px -8px hsl(45 95% 65% / 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px -2px hsl(42 88% 52% / 0.6), 0 0 60px -6px hsl(45 95% 65% / 0.35)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'premium-shimmer': 'premium-shimmer 3s ease-in-out infinite',
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
