/**
 * NextActionCard — la UNA accion proxima sugerida para la mascota
 *
 * Refactor Maestro 2026-04-23 §5.2.2. En el Home "Mi mascota hoy",
 * mostramos 1 sola accion, no una lista. Reduce decision fatigue.
 *
 * Prioridad de accion:
 * 1. Recordatorio vencido (overdue)
 * 2. Recordatorio proximo (<7 dias)
 * 3. Sugerencia de la app (foto mensual, peso, etc.)
 * 4. Empty state positivo
 */
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, ArrowRight, Sparkles } from '@/lib/icons';
import { cn } from '@/lib/utils';

export type NextActionKind = 'overdue_reminder' | 'upcoming_reminder' | 'suggestion' | 'all_good';

interface NextActionCardProps {
  kind: NextActionKind;
  /** Titulo de la accion: "Vacuna antirrabica vence en 3 dias" */
  title: string;
  /** Descripcion corta opcional */
  description?: string;
  /** CTA label: "Agendar", "Marcar hecha", "Ver detalle" */
  ctaLabel?: string;
  /** CTA action */
  onAction?: () => void;
  /** Accion secundaria opcional */
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

const KIND_STYLES: Record<NextActionKind, { bg: string; accent: string; icon: typeof Bell }> = {
  overdue_reminder: {
    bg: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200',
    accent: 'text-rose-700',
    icon: Bell,
  },
  upcoming_reminder: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    accent: 'text-amber-700',
    icon: Bell,
  },
  suggestion: {
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200',
    accent: 'text-purple-700',
    icon: Sparkles,
  },
  all_good: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200',
    accent: 'text-emerald-700',
    icon: Sparkles,
  },
};

export function NextActionCard({
  kind,
  title,
  description,
  ctaLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: NextActionCardProps) {
  const style = KIND_STYLES[kind];
  const Icon = style.icon;

  return (
    <Card className={cn('p-4 border transition-all', style.bg, className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 mt-0.5 w-10 h-10 rounded-full flex items-center justify-center bg-white/70',
            style.accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground leading-none">
            {kind === 'overdue_reminder' && 'Pendiente vencido'}
            {kind === 'upcoming_reminder' && 'Próximo'}
            {kind === 'suggestion' && 'Sugerencia'}
            {kind === 'all_good' && 'Todo al día'}
          </p>
          <p className={cn('text-sm font-semibold mt-0.5 leading-tight', style.accent)}>{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {onAction && ctaLabel && (
              <Button
                size="sm"
                onClick={onAction}
                className={cn(
                  'h-8 text-xs gap-1.5',
                  kind === 'overdue_reminder' && 'bg-rose-600 hover:bg-rose-700',
                  kind === 'upcoming_reminder' && 'bg-amber-600 hover:bg-amber-700',
                  kind === 'suggestion' && 'bg-purple-600 hover:bg-purple-700',
                  kind === 'all_good' && 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {ctaLabel}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
            {onSecondary && secondaryLabel && (
              <Button size="sm" variant="ghost" onClick={onSecondary} className="h-8 text-xs">
                {secondaryLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
