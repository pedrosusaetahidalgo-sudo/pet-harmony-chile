import { Sparkles } from '@/lib/icons';

interface NewBadgeProps {
  /**
   * Variante del badge:
   * - `pilot` (default): feature reciente / en piloto, tono violeta-rose
   * - `community`: iniciativa de comunidad (grupos, causas), tono rose
   * - `impact`: impacto real (adopcion, sangre), tono teal
   */
  variant?: 'pilot' | 'community' | 'impact';
  /** Titulo corto (ej: "Nuevo", "Piloto", "Comunidad"). Si no se pasa usa default por variant. */
  title?: string;
  /** Descripcion corta, 1 linea. */
  description?: string;
}

const VARIANT_CONFIG: Record<
  NonNullable<NewBadgeProps['variant']>,
  { title: string; color: string; border: string; bg: string; icon: string }
> = {
  pilot: {
    title: 'Nuevo',
    color: 'text-violet-800',
    border: 'border-violet-200',
    bg: 'bg-violet-50/60',
    icon: 'text-violet-600',
  },
  community: {
    title: 'Comunidad',
    color: 'text-rose-800',
    border: 'border-rose-200',
    bg: 'bg-rose-50/60',
    icon: 'text-rose-600',
  },
  impact: {
    title: 'Impacto',
    color: 'text-teal-800',
    border: 'border-teal-200',
    bg: 'bg-teal-50/60',
    icon: 'text-teal-600',
  },
};

/**
 * Badge sutil para marcar superficies nuevas / en piloto / de impacto
 * sin connotacion "ludica" de Paw Labs.
 *
 * Usar en vez de <PawLabsBanner> cuando la feature NO es gamificacion
 * (ej: Adopcion, Comunidad, Banco de sangre). Ver §22-23 del plan
 * PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md.
 *
 * Regla: PawLabsBanner queda exclusivamente para PawGame / Missions /
 * PawCollection (`PAWGAME_*` flags).
 */
export function NewBadge({ variant = 'pilot', title, description }: NewBadgeProps) {
  const cfg = VARIANT_CONFIG[variant];
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border ${cfg.border} ${cfg.bg} px-4 py-3`}
      role="note"
    >
      <Sparkles className={`h-5 w-5 ${cfg.icon} mt-0.5 flex-shrink-0`} />
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${cfg.color}`}>{title ?? cfg.title}</p>
        {description ? (
          <p className={`text-xs ${cfg.color} opacity-80 mt-0.5`}>{description}</p>
        ) : null}
      </div>
    </div>
  );
}
