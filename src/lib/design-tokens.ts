/**
 * Design tokens centralizados para Paw Friend.
 *
 * Mobile-first: las clases por defecto son las correctas para 375px (iPhone SE)
 * y las versiones `md:` (>=768px) escalan a desktop.
 *
 * Uso:
 *   import { SPACING, TYPOGRAPHY, TOUCH } from "@/lib/design-tokens";
 *   <h1 className={TYPOGRAPHY.pageTitle}>Mi mascota</h1>
 *   <Button className={TOUCH.button}>Reservar</Button>
 *   <section className={SPACING.section.paddingY}>...</section>
 */

export const SPACING = {
  /** Padding interno de cards */
  card: {
    padding: 'p-4',
    paddingLg: 'p-4 md:p-6',
    gap: 'gap-3',
  },
  /** Padding vertical de secciones grandes (mobile-first) */
  section: {
    paddingY: 'py-6 md:py-10',
    paddingYLg: 'py-8 md:py-12',
    paddingYHero: 'py-10 md:py-16',
    gap: 'gap-6',
  },
  /** Padding horizontal de la página completa */
  page: {
    paddingX: 'px-4 md:px-6',
    container: 'container px-4 md:px-6',
  },
  /** Empty states centrados */
  empty: {
    paddingY: 'py-8 md:py-12',
  },
} as const;

export const TYPOGRAPHY = {
  /** Título de la página (uno por pantalla) */
  pageTitle: 'text-2xl md:text-3xl font-bold tracking-tight',
  /** Título de sección dentro de una página */
  sectionTitle: 'text-lg md:text-xl font-semibold',
  /** Título dentro de una card */
  cardTitle: 'text-base font-semibold',
  /** Contenido principal */
  body: 'text-base leading-relaxed',
  /** Label de un campo o metadato secundario */
  label: 'text-sm text-muted-foreground',
  /** Caption pequeño (timestamps, disclaimers, footers) */
  caption: 'text-xs text-muted-foreground',
  /** Eyebrow (uppercase encima de un título) */
  eyebrow: 'text-xs uppercase tracking-wider font-semibold text-muted-foreground',
} as const;

export const TOUCH = {
  /** Tamaño mínimo de touch target (44pt iOS / 48dp Android) */
  minTarget: 'min-h-11 min-w-11',
  /** Botón estándar */
  button: 'h-11 px-4',
  /** Botón secundario */
  buttonSm: 'h-10 px-3 text-sm',
  /** Botón ícono cuadrado */
  iconButton: 'h-11 w-11',
  /** Touch optimization CSS */
  optimized: 'touch-manipulation active:scale-[0.98] transition-transform',
} as const;

export const RADIUS = {
  card: 'rounded-xl',
  button: 'rounded-lg',
  pill: 'rounded-full',
} as const;

export const SHADOWS = {
  card: 'shadow-sm',
  cardHover: 'hover:shadow-md transition-shadow',
  elevated: 'shadow-lg',
  /* Brand 2.0 */
  brandGlow: 'shadow-brand-glow',
  goldGlow: 'shadow-gold-glow',
  brandHover: 'hover:shadow-brand-hover transition-shadow duration-normal',
} as const;

/**
 * Brand 2.0 — Tokens de marca elevados
 * Ver docs/pawfriend-rebrand-rollout-masterplan.md §5 + §11.
 */

/** Tipografía display (Fredoka) — usar en H1 de landing/page hero y hero numbers */
export const DISPLAY = {
  /** H1 hero cinematográfico (landing, pitch cover) */
  hero: 'font-display font-semibold text-4xl md:text-6xl leading-[1.05] tracking-tight',
  /** H1 de página interna */
  pageTitle: 'font-display font-semibold text-3xl md:text-4xl leading-tight tracking-tight',
  /** Número grande (KPI, hero stat) */
  kpi: 'font-display font-semibold text-3xl md:text-5xl tabular-nums leading-none',
  /** Valor de sección destacada */
  sectionValue: 'font-display font-semibold text-2xl md:text-3xl leading-tight',
} as const;

/** Tipografía mono tabular — para valores numéricos exactos */
export const MONO = {
  /** Valores monetarios tabulares */
  value: 'font-mono font-bold tabular-nums',
  /** Código inline (/paths, codes) */
  code: 'font-mono text-xs px-1.5 py-0.5 rounded bg-muted',
  /** Labels de teclas */
  kbd: 'font-mono text-xs px-2 py-0.5 rounded bg-muted border border-border',
} as const;

/** Motion tokens — brand 2.0 */
export const MOTION = {
  /** Transición rápida (hover, focus) */
  fast: 'transition duration-fast ease-out-soft',
  /** Transición estándar (expand, fade) */
  normal: 'transition duration-normal ease-out-soft',
  /** Transición lenta (reveal on scroll) */
  slow: 'transition duration-slow ease-out-soft',
  /** Entrada hero (grand entrance) */
  hero: 'transition duration-hero ease-out-pop',
  /** Hover lift estándar */
  lift: 'transition-transform duration-normal ease-out-soft hover:-translate-y-1',
  /** Hover scale sutil */
  scale: 'transition-transform duration-fast ease-out-soft hover:scale-[1.02]',
} as const;

/** Paletas por audiencia — brand 2.0 */
export const AUDIENCE = {
  invest: {
    from: 'from-[#9333ea]',
    to: 'to-[#eab308]',
    gradient: 'bg-gradient-to-br from-[#9333ea] to-[#eab308]',
    text: 'text-[#b45309]',
    bg: 'bg-[#fef3c7]',
    ring: 'ring-[#eab308]',
    shadow: 'shadow-audience-invest',
  },
  companys: {
    from: 'from-[#581c87]',
    to: 'to-[#9333ea]',
    gradient: 'bg-gradient-to-br from-[#581c87] to-[#9333ea]',
    text: 'text-[#7e22ce]',
    bg: 'bg-[#f3e8ff]',
    ring: 'ring-[#9333ea]',
    shadow: 'shadow-audience-companys',
  },
  partners: {
    from: 'from-[#047857]',
    to: 'to-[#10b981]',
    gradient: 'bg-gradient-to-br from-[#047857] to-[#10b981]',
    text: 'text-[#047857]',
    bg: 'bg-[#d1fae5]',
    ring: 'ring-[#10b981]',
    shadow: 'shadow-audience-partners',
  },
  voices: {
    from: 'from-[#be185d]',
    to: 'to-[#ec4899]',
    gradient: 'bg-gradient-to-br from-[#be185d] to-[#ec4899]',
    text: 'text-[#be185d]',
    bg: 'bg-[#fce7f3]',
    ring: 'ring-[#ec4899]',
    shadow: 'shadow-audience-voices',
  },
} as const;

/** Gold premium tokens — reservado para celebración/member/hero */
export const GOLD = {
  gradient: 'bg-brand-gold-gradient',
  text: 'text-gold-700',
  textBright: 'text-gold-500',
  bg: 'bg-gold-50',
  bgSoft: 'bg-gold-100',
  border: 'border-gold-300',
  glow: 'shadow-gold-glow',
  /** Badge Paw Member */
  memberBadge: 'bg-brand-gold-gradient text-white font-bold shadow-gold-glow',
} as const;

/** Colores semanticos por contexto */
export const SEMANTIC_COLORS = {
  /** Estados de salud de mascota */
  health: {
    good: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  },
  /** Badges de verificacion */
  verified: 'bg-blue-50 text-blue-700 border-blue-200',
  /** Premium / upgrade */
  premium: 'bg-purple-50 text-purple-700 border-purple-200',
  /** Labs / beta */
  labs: 'bg-violet-50 text-violet-700 border-violet-200',
  /** Tema proveedor/vet */
  provider: {
    accent: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  /** Tema dueno */
  owner: {
    accent: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
} as const;
