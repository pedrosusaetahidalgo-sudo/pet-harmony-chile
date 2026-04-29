/**
 * BrandBadge — Renderiza los badges artisticos del brand kit v2.
 *
 * Para uso en heros de paginas dedicadas (`/paw-member`, `/paw-voices`,
 * `/paw-companys`) y cards de reconocimiento. NO sustituye a PawMemberBadge
 * (que es la pildora compacta inline para usar al lado del nombre del user).
 *
 * Assets en `public/brand-assets/badges/`:
 *   - badge_paw_member.svg
 *   - badge_paw_voice.svg
 *   - badge_paw_company.svg
 *   - badge_vet_verified.svg
 */
import { cn } from '@/lib/utils';

export type BrandBadgeKind = 'paw_member' | 'paw_voice' | 'paw_company' | 'vet_verified';

const PATHS: Record<BrandBadgeKind, string> = {
  paw_member: '/brand-assets/badges/badge_paw_member.svg',
  paw_voice: '/brand-assets/badges/badge_paw_voice.svg',
  paw_company: '/brand-assets/badges/badge_paw_company.svg',
  vet_verified: '/brand-assets/badges/badge_vet_verified.svg',
};

const ALT: Record<BrandBadgeKind, string> = {
  paw_member: 'Insignia Paw Member',
  paw_voice: 'Insignia Paw Voice',
  paw_company: 'Insignia Paw Company',
  vet_verified: 'Insignia veterinario verificado',
};

const SIZE: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-32 w-32',
  xl: 'h-48 w-48',
};

interface BrandBadgeProps {
  kind: BrandBadgeKind;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
}

export function BrandBadge({ kind, size = 'md', className, title }: BrandBadgeProps) {
  return (
    <img
      src={PATHS[kind]}
      alt={title ?? ALT[kind]}
      className={cn(SIZE[size], className)}
      loading="lazy"
    />
  );
}
