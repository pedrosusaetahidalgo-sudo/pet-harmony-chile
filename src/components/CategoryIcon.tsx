/**
 * CategoryIcon — icono de audiencia / categoria de Paw Friend.
 *
 * Renderiza el SVG del brand kit v2 (`/paw-friend-assets-v2/icons/categories/<kind>.svg`)
 * si esta disponible. Si el archivo aun no existe o el browser falla la
 * carga, cae graciosamente al icono Lucide correspondiente. Esto permite
 * que Pedro vaya soltando los SVGs que esta diseñando sin romper la
 * app mientras tanto.
 *
 * Kinds soportados (1:1 con los tipos de pitch_applications):
 *   - voice      → Paw Voices (creadores)
 *   - partner    → Paw Partners (tiendas/alianzas)
 *   - company    → Paw Companys (sponsors)
 *   - shelter    → Hogares de adopcion
 *   - investor   → Inversionistas
 *   - vet        → Veterinarios
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

interface CategoryMeta {
  label: string;
  /** Lucide icon fallback mientras el SVG v2 no exista. */
  fallback: LucideIcon;
  /** Color base Tailwind del badge/squircle. */
  color: 'purple' | 'pink' | 'amber' | 'teal';
}

// eslint-disable-next-line react-refresh/only-export-components -- constante compartida de labels/colores de categorias; util exportarla para reusar en paginas que no usan el componente directamente
export const CATEGORY_META: Record<CategoryKind, CategoryMeta> = {
  voice: { label: 'Paw Voice', fallback: Sparkles, color: 'pink' },
  partner: { label: 'Paw Partner', fallback: Megaphone, color: 'pink' },
  company: { label: 'Paw Company', fallback: Building2, color: 'amber' },
  shelter: { label: 'Hogar de adopcion', fallback: HomeIcon, color: 'purple' },
  investor: { label: 'Inversionista', fallback: Target, color: 'teal' },
  vet: { label: 'Veterinario', fallback: Stethoscope, color: 'teal' },
};

function svgPath(kind: CategoryKind): string {
  return `/paw-friend-assets-v2/icons/categories/${kind}.svg`;
}

interface Props {
  kind: CategoryKind;
  className?: string;
  /**
   * Si `true`, envuelve el icono en un circulo con color de fondo de la
   * categoria (util para badges grandes / hero). Por defecto el icono
   * se renderiza directo (inline).
   */
  badge?: boolean;
  /** Tamaño del icono interno cuando badge=true. Default 'md'. */
  size?: 'sm' | 'md' | 'lg';
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
  'aria-label': ariaLabel,
}: Props) {
  const meta = CATEGORY_META[kind];
  const [brokenSvg, setBrokenSvg] = useState(false);
  const Fallback = meta.fallback;

  const sizes = {
    sm: { icon: 'h-4 w-4', wrap: 'h-8 w-8' },
    md: { icon: 'h-5 w-5', wrap: 'h-10 w-10' },
    lg: { icon: 'h-7 w-7', wrap: 'h-14 w-14' },
  }[size];

  const iconNode = brokenSvg ? (
    <Fallback className={cn(badge ? sizes.icon : className)} aria-hidden />
  ) : (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- graceful fallback si el SVG v2 aun no esta desplegado
    <img
      src={svgPath(kind)}
      alt={ariaLabel || meta.label}
      className={cn(badge ? sizes.icon : className, 'object-contain')}
      onError={() => setBrokenSvg(true)}
      loading="lazy"
    />
  );

  if (!badge) return iconNode;

  const colorClass = {
    purple: 'bg-purple-100 text-purple-700',
    pink: 'bg-pink-100 text-pink-700',
    amber: 'bg-amber-100 text-amber-700',
    teal: 'bg-teal-100 text-teal-700',
  }[meta.color];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
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
