// ─────────────────────────────────────────────────────────────────────────────
// Paw Friend — Sistema visual compartido para emails (edge functions, Deno)
// 2026-04-21
//
// Espejo parcial de `src/index.css` (tokens CSS) y `tailwind.config.ts`, pero
// en valores HEX y HSL resueltos que se pueden inlinear en HTML. Usado por
// todas las edge functions que construyen emails con Resend.
//
// Regla: NO HEX hardcodeados dentro de las edge fns. Todo color debe venir de
// aqui o de las audiencias (COMPANY/VOICE/PARTNER) si aplica.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paleta morado de marca (primary). Espejo de `--brand-*` en `src/index.css`.
 * Nombre de la escala sigue Tailwind (50 = mas claro, 900 = mas oscuro).
 */
export const BRAND = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea', // primario oficial
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
} as const;

/**
 * Paleta dorado (secondary / premium). Espejo de `--gold-*`.
 */
export const GOLD = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b', // secundario oficial
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
} as const;

/**
 * Neutros (grises fríos con tinte morado) — textos, bordes, bg.
 */
export const NEUTRAL = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
} as const;

/**
 * Colores semánticos (success / warning / danger / info). Se usan en callouts,
 * badges de estado, bordes de alerta.
 */
export const SEMANTIC = {
  success: {
    base: '#16a34a',
    light: '#f0fdf4',
    soft: '#dcfce7',
    border: '#bbf7d0',
    text: '#166534',
    textStrong: '#15803d',
  },
  warning: {
    base: '#d97706',
    light: '#fffbeb',
    soft: '#fef3c7',
    border: '#fde68a',
    text: '#92400e',
    textStrong: '#b45309',
  },
  danger: {
    base: '#dc2626',
    light: '#fef2f2',
    soft: '#fee2e2',
    border: '#fecaca',
    text: '#991b1b',
    textStrong: '#b91c1c',
  },
  info: {
    base: '#2563eb',
    light: '#eff6ff',
    soft: '#dbeafe',
    border: '#bfdbfe',
    text: '#1e40af',
    textStrong: '#1d4ed8',
  },
} as const;

/**
 * Paletas de audiencia — espejo de `audience-*` en `tailwind.config.ts`. Se
 * usan en emails/documentos específicos para Paw Companys, Paw Voices,
 * Paw Partners (barter) e Inversionistas.
 */
export const AUDIENCE = {
  brand: {
    from: BRAND[600],
    via: BRAND[500],
    to: BRAND[400],
    deep: BRAND[900],
    accent: BRAND[700],
    bg: BRAND[50],
    border: BRAND[100],
    text: BRAND[900],
    textStrong: BRAND[700],
  },
  voice: {
    from: '#be185d',
    via: '#db2777',
    to: '#ec4899',
    deep: '#831843',
    accent: '#db2777',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    text: '#831843',
    textStrong: '#9f1239',
  },
  partner: {
    from: '#047857',
    via: '#059669',
    to: '#10b981',
    deep: '#064e3b',
    accent: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#064e3b',
    textStrong: '#047857',
  },
  company: {
    from: BRAND[800],
    via: BRAND[600],
    to: BRAND[400],
    deep: '#2a1046',
    accent: BRAND[700],
    bg: BRAND[50],
    border: BRAND[100],
    text: BRAND[900],
    textStrong: BRAND[700],
  },
  investor: {
    from: BRAND[600],
    via: GOLD[500],
    to: GOLD[400],
    deep: BRAND[900],
    accent: GOLD[700],
    bg: GOLD[50],
    border: GOLD[100],
    text: BRAND[900],
    textStrong: GOLD[700],
  },
} as const;

/**
 * Tipografía. Los fonts web son Fredoka + Plus Jakarta Sans, pero en email
 * deben tener fallbacks sólidos porque Outlook y algunos clientes no
 * cargarán webfonts.
 */
export const FONT = {
  sans: `'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif`,
  display: `'Fredoka','Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif`,
  mono: `'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace`,
} as const;

/**
 * Escala tipográfica en px. Emails no usan rem (Outlook).
 */
export const SIZE = {
  xs: '11px',
  sm: '12px',
  body: '14px',
  md: '15px',
  lg: '17px',
  xl: '20px',
  h3: '18px',
  h2: '22px',
  h1: '26px',
  hero: '30px',
} as const;

/**
 * Spacing scale en px — para padding/margin inline.
 */
export const SPACE = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
} as const;

/**
 * Radios de borde para emails (Outlook soporta hasta cierto punto).
 */
export const RADIUS = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  '2xl': '24px',
  pill: '999px',
} as const;

/**
 * Sombras — usar con moderación en email, muchos clientes las descartan.
 */
export const SHADOW = {
  card: '0 8px 24px rgba(147,51,234,0.12)',
  cardStrong: '0 12px 40px rgba(147,51,234,0.18)',
  cta: '0 8px 24px rgba(147,51,234,0.35)',
  ctaGold: '0 8px 24px rgba(245,158,11,0.35)',
  avatar: '0 4px 12px rgba(147,51,234,0.25)',
} as const;

/**
 * Assets de marca hosted en producción (pawfriend.cl/paw-friend-assets-v2/).
 * Logo y wordmark canonicos. NO hardcodear URLs de assets por fuera de aquí.
 */
export const ASSETS = {
  logoIcon: 'https://pawfriend.cl/paw-friend-assets-v2/logo/pwa_icon_512.png',
  logoIcon192: 'https://pawfriend.cl/paw-friend-assets-v2/logo/pwa_icon_192.png',
  wordmark:
    'https://pawfriend.cl/paw-friend-assets-v2/logo/paw_friend_wordmark_horizontal.svg',
  siteUrl: 'https://pawfriend.cl',
} as const;

/**
 * Tagline oficial por contexto. Usado en subtítulo del header.
 */
export const TAGLINE = {
  owner: 'La ficha medica de tu mascota, en tu bolsillo',
  vet: 'La plataforma veterinaria de Chile',
  shelter: 'La red de refugios con ficha que viaja con la mascota',
  admin: 'Panel interno — Paw Friend',
  donation: 'Gracias a ti, Paw Friend sigue siendo gratis',
  share: 'La ficha medica de tu mascota, compartida',
} as const;

/**
 * Gradientes preparados como strings CSS (linear-gradient) — los emails
 * los inlinean directamente en style.
 */
export const GRADIENT = {
  /** Header principal púrpura — el default de la marca */
  brand: `linear-gradient(135deg,${BRAND[600]} 0%,${BRAND[500]} 50%,${BRAND[400]} 100%)`,
  /** Variante más corta, 2 stops — cuando se necesita menos drama */
  brandShort: `linear-gradient(135deg,${BRAND[600]} 0%,${BRAND[400]} 100%)`,
  /** CTA sólido morado — botones primarios */
  ctaBrand: `linear-gradient(135deg,${BRAND[600]},${BRAND[700]})`,
  /** CTA dorado — botones premium / gracias donación */
  ctaGold: `linear-gradient(135deg,${GOLD[500]},${GOLD[600]})`,
  /** Rose/pink cálido — donaciones, momentos emocionales */
  warm: `linear-gradient(135deg,${AUDIENCE.voice.from} 0%,${GOLD[500]} 100%)`,
  /** Partner (barter) — verdes */
  partner: `linear-gradient(135deg,${AUDIENCE.partner.from} 0%,${AUDIENCE.partner.to} 100%)`,
  /** Inversor — morado → dorado */
  investor: `linear-gradient(135deg,${BRAND[600]} 0%,${GOLD[500]} 100%)`,
  /** Success callout (bg verde suave) */
  successSoft: `linear-gradient(135deg,${SEMANTIC.success.light},${SEMANTIC.success.soft})`,
  /** Warning callout (bg amber suave) */
  warningSoft: `linear-gradient(135deg,${SEMANTIC.warning.light},${SEMANTIC.warning.soft})`,
} as const;

/**
 * Ancho máximo estándar del card principal de email. 560px es lo comun
 * pero algunas piezas necesitan más (pitch/reports) — usar 600 entonces.
 */
export const WIDTH = {
  narrow: 520,
  standard: 560,
  wide: 600,
  full: 640,
} as const;

/**
 * Breakpoint mobile (em) usado por `@media` dentro del layout. Los emails
 * deben verse bien bajo 480px de ancho.
 */
export const BREAKPOINT = {
  mobileMax: '480px',
} as const;
