import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { track, EVENTS } from '@/lib/analytics';

interface PremiumNudgeProps {
  /** Feature que disparó el nudge (para tracking). */
  feature: string;
  /** Título breve. */
  title: string;
  /** Descripción opcional. */
  description: string;
  /** Texto del CTA. Default 2026-04-29: "Activa Paw Member". */
  ctaText?: string;
  /** Card completa o inline compacto. */
  variant?: 'card' | 'inline';
  /**
   * Compat con uso histórico: algunos llamados pasan progreso de uso (ej
   * "3/5 OCR este mes"). Con el pivot a "app gratis" ya no tiene sentido
   * mostrarlo como presión de upgrade, pero se acepta para no romper los
   * sitios que lo mandan. Ignorado internamente.
   */
  usage?: { current: number; max: number };
}

/**
 * Refactor 2026-04-29 (Plan v5 Opción 3): vuelve a ser Paw Member upsell soft.
 * Aparece AL LADO de un feature ya usado o gratis. Para BLOQUEAR uso, usar
 * `PremiumGate` (componente hermano).
 *
 * - No bloquea: queda al lado/después del feature, como invitación.
 * - Copy dirige a `/paw-member` (página oficial del plan B2C).
 * - Paleta rosa/violeta (comunidad), icono Heart (amor, no status).
 *
 * La prop `ctaText` acepta override. Los 11 archivos que lo usan siguen
 * pasando los mismos props sin romper.
 */
export function PremiumNudge({
  feature,
  title,
  description,
  ctaText = 'Activa Paw Member',
  variant = 'card',
}: PremiumNudgeProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    track({
      event: EVENTS.PRO_PANEL_UPGRADE_CTA_CLICKED,
      properties: { source: `paw_member_nudge_${feature}` },
    });
    navigate('/paw-member');
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 dark:from-pink-950/40 dark:via-rose-950/30 dark:to-amber-950/30 border border-pink-200/70 dark:border-pink-900/50 px-3 py-2">
        <Heart className="h-4 w-4 text-pink-500 fill-pink-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-pink-900 dark:text-pink-200">{title}</p>
          <p className="text-[10px] text-pink-600 dark:text-pink-300">{description}</p>
        </div>
        <Button
          size="sm"
          onClick={handleClick}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs h-7 px-2 flex-shrink-0"
        >
          Activar
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-pink-200/70 bg-gradient-to-br from-pink-50 via-rose-50/60 to-amber-50/40 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-amber-950/10 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-gradient-to-br from-pink-500 to-rose-500 p-2 flex-shrink-0">
          <Heart className="h-5 w-5 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground italic leading-snug">
        Paw Member desbloquea Paw Passport, Insights Pro, Audio IA, reportes históricos y más.
        $3.990/mes · cancelable cuando quieras.
      </p>

      <Button
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white gap-1.5"
        size="sm"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {ctaText}
      </Button>
    </div>
  );
}
