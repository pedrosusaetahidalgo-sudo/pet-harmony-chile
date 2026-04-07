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
    padding: "p-4",
    paddingLg: "p-4 md:p-6",
    gap: "gap-3",
  },
  /** Padding vertical de secciones grandes (mobile-first) */
  section: {
    paddingY: "py-6 md:py-10",
    paddingYLg: "py-8 md:py-12",
    paddingYHero: "py-10 md:py-16",
    gap: "gap-6",
  },
  /** Padding horizontal de la página completa */
  page: {
    paddingX: "px-4 md:px-6",
    container: "container px-4 md:px-6",
  },
  /** Empty states centrados */
  empty: {
    paddingY: "py-8 md:py-12",
  },
} as const;

export const TYPOGRAPHY = {
  /** Título de la página (uno por pantalla) */
  pageTitle: "text-2xl md:text-3xl font-bold tracking-tight",
  /** Título de sección dentro de una página */
  sectionTitle: "text-lg md:text-xl font-semibold",
  /** Título dentro de una card */
  cardTitle: "text-base font-semibold",
  /** Contenido principal */
  body: "text-base leading-relaxed",
  /** Label de un campo o metadato secundario */
  label: "text-sm text-muted-foreground",
  /** Caption pequeño (timestamps, disclaimers, footers) */
  caption: "text-xs text-muted-foreground",
  /** Eyebrow (uppercase encima de un título) */
  eyebrow: "text-xs uppercase tracking-wider font-semibold text-muted-foreground",
} as const;

export const TOUCH = {
  /** Tamaño mínimo de touch target (44pt iOS / 48dp Android) */
  minTarget: "min-h-11 min-w-11",
  /** Botón estándar */
  button: "h-11 px-4",
  /** Botón secundario */
  buttonSm: "h-10 px-3 text-sm",
  /** Botón ícono cuadrado */
  iconButton: "h-11 w-11",
  /** Touch optimization CSS */
  optimized: "touch-manipulation active:scale-[0.98] transition-transform",
} as const;

export const RADIUS = {
  card: "rounded-xl",
  button: "rounded-lg",
  pill: "rounded-full",
} as const;

export const SHADOWS = {
  card: "shadow-sm",
  cardHover: "hover:shadow-md transition-shadow",
  elevated: "shadow-lg",
} as const;
