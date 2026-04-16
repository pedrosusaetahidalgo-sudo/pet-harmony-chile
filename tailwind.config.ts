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
        /* ── Brand Purple Scale ── */
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
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(0,0,0,0.08)',
        card: '0 4px 12px -2px rgba(0,0,0,0.06)',
        elevated: '0 8px 24px -4px rgba(0,0,0,0.1)',
        brand: '0 8px 24px -4px rgba(147,51,234,0.2)',
        medium: 'var(--shadow-medium)',
        premium: 'var(--premium-shadow)',
        'premium-sm': 'var(--premium-shadow-sm)',
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
