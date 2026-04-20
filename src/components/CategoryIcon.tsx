/**
 * CategoryIcon — icono de audiencia / categoria de Paw Friend (brand v2).
 *
 * Renderiza el SVG oficial del brand kit v2 en `/paw-friend-assets-v2/`:
 *   - voice      → paw_voices_{icon|full}.svg
 *   - partner    → paw_partners_{icon|full}.svg
 *   - company    → paw_companys_{bronze|silver|gold}_{icon|full}.svg
 *   - shelter    → paw_shelter_{icon|full}.svg
 *   - investor   → paw_investors_{icon|full}.svg
 *   - vet        → paw_vets_{icon|full}.svg
 *
 * Variantes:
 *   - `icon` (default): squircle con el simbolo, cuadrado. Ideal para
 *     avatars/badges/hero circles.
 *   - `full`: version con wordmark / texto incluido. Ideal para headers
 *     de paginas de categoria (ej. el titulo de /paw-partners).
 *
 * Fallback: si el archivo no carga (404 o error), cae al icono Lucide
 * equivalente sin romper la UI.
 */
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  Megaphone,
  Building2,
  Home as HomeIcon,
  Target,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CategoryKind = 'voice' | 'partner' | 'company' | 'shelter' | 'investor' | 'vet';
export type CompanyTier = 'bronze' | 'silver' | 'gold';
export type CategoryVariant = 'icon' | 'full';

interface CategoryMeta {
  label: string;
  /** Lucide icon fallback si el SVG v2 no carga. */
  fallback: LucideIcon;
  /** Color base Tailwind del badge/squircle. */
  color: 'purple' | 'pink' | 'amber' | 'teal';
}

// eslint-disable-next-line react-refresh/only-export-components -- constante compartida; util reusarla en paginas que no renderizan el componente directamente
export const CATEGORY_META: Record<CategoryKind, CategoryMeta> = {
  voice: { label: 'Paw Voice', fallback: Sparkles, color: 'pink' },
  partner: { label: 'Paw Partner', fallback: Megaphone, color: 'pink' },
  company: { label: 'Paw Company', fallback: Building2, color: 'amber' },
  shelter: { label: 'Hogar de adopcion', fallback: HomeIcon, color: 'purple' },
  investor: { label: 'Inversionista', fallback: Target, color: 'teal' },
  vet: { label: 'Veterinario', fallback: Stethoscope, color: 'teal' },
};

/** Stem de archivo por kind. */
const KIND_STEM: Record<CategoryKind, string> = {
  voice: 'paw_voices',
  partner: 'paw_partners',
  company: 'paw_companys',
  shelter: 'paw_shelter',
  investor: 'paw_investors',
  vet: 'paw_vets',
};

function svgPath(kind: CategoryKind, variant: CategoryVariant, tier?: CompanyTier): string {
  const stem = KIND_STEM[kind];
  if (kind === 'company') {
    const t = tier || 'bronze';
    return `/paw-friend-assets-v2/${stem}_${t}_${variant}.svg`;
  }
  return `/paw-friend-assets-v2/${stem}_${variant}.svg`;
}

interface Props {
  kind: CategoryKind;
  className?: string;
  /**
   * Si `true`, envuelve el icono en un circulo con color de fondo de la
   * categoria (util para hero sections que quieren solo el simbolo).
   * Ignorado cuando `variant='full'` (el wordmark ya trae fondo propio).
   */
  badge?: boolean;
  /** Tamaño del badge (solo si badge=true). Default 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** 'icon' (squircle del simbolo) o 'full' (con texto). Default 'icon'. */
  variant?: CategoryVariant;
  /** Solo para kind='company': tier Bronze/Silver/Gold. Default 'bronze'. */
  tier?: CompanyTier;
  /** Aria-label override. Default usa CATEGORY_META.label. */
  'aria-label'?: string;
}

/**
 * Icono con fallback Lucide mientras el SVG v2 no este listo.
 * Usa `onError` + state para alternar.
 */
export function CategoryIcon({
  kind,
  className,
  badge = false,
  size = 'md',
  variant = 'icon',
  tier,
  'aria-label': ariaLabel,
}: Props) {
  const meta = CATEGORY_META[kind];
  const [brokenSvg, setBrokenSvg] = useState(false);
  const Fallback = meta.fallback;

  // Modo 'full' nunca lleva badge: el SVG ya es el wordmark completo.
  const useBadge = badge && variant === 'icon';

  const sizes = {
    sm: { icon: 'h-4 w-4', wrap: 'h-8 w-8' },
    md: { icon: 'h-5 w-5', wrap: 'h-10 w-10' },
    lg: { icon: 'h-7 w-7', wrap: 'h-14 w-14' },
  }[size];

  const iconNode = brokenSvg ? (
    <Fallback className={cn(useBadge ? sizes.icon : className)} aria-hidden />
  ) : (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- graceful fallback al Lucide equivalente si el SVG no carga
    <img
      src={svgPath(kind, variant, tier)}
      alt={ariaLabel || meta.label}
      className={cn(useBadge ? sizes.icon : className, 'object-contain')}
      onError={() => setBrokenSvg(true)}
      loading="lazy"
    />
  );

  if (!useBadge) return iconNode;

  const colorClass = {
    purple: 'bg-purple-100 text-purple-700',
    pink: 'bg-pink-100 text-pink-700',
    amber: 'bg-amber-100 text-amber-700',
    teal: 'bg-teal-100 text-teal-700',
  }[meta.color];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
        sizes.wrap,
        colorClass,
        className
      )}
      role="img"
      aria-label={ariaLabel || meta.label}
    >
      {iconNode}
    </div>
  );
}
