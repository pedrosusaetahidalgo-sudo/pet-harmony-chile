/**
 * Tipos de publicación en el feed.
 * El campo post_type ya existe en la tabla posts (nullable string).
 *
 * Los iconos se referencian por nombre (Lucide) en vez de emoji para
 * mantener estilo consistente con el resto de la app. Ver `getPostTypeIcon`
 * en `src/lib/icons.ts` si es necesario mapear dinámicamente.
 */

import type { LucideIcon } from 'lucide-react';
import { Camera, HelpCircle, Lightbulb, Search, Home, Trophy } from '@/lib/icons';

export const POST_TYPES: ReadonlyArray<{
  readonly value: string;
  readonly label: string;
  readonly icon: LucideIcon;
}> = [
  { value: 'foto', label: 'Foto', icon: Camera },
  { value: 'pregunta', label: 'Pregunta', icon: HelpCircle },
  { value: 'consejo', label: 'Consejo', icon: Lightbulb },
  { value: 'perdido', label: 'Perdido / Encontrado', icon: Search },
  { value: 'adopcion', label: 'Adopción', icon: Home },
  { value: 'logro', label: 'Logro', icon: Trophy },
] as const;

export type PostType = (typeof POST_TYPES)[number]['value'];

export function getPostTypeLabel(type: string | null): string {
  if (!type) return 'Publicación';
  const found = POST_TYPES.find((pt) => pt.value === type);
  return found ? found.label : 'Publicación';
}

export function getPostTypeIcon(type: string | null): LucideIcon | null {
  if (!type) return null;
  const found = POST_TYPES.find((pt) => pt.value === type);
  return found ? found.icon : null;
}
