import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from '@/lib/icons';
import { track, EVENTS } from '@/lib/analytics';
import { usePlan } from '@/hooks/usePlan';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface PremiumGateProps {
  /** Feature key de plans.ts (export_pdf, pro_analytics, etc.) */
  feature: string;
  /** Para features con límite numérico (ej: max_reminders) */
  currentUsage?: number;
  /** Contenido real que se previsualiza con blur */
  children: React.ReactNode;
  /** Título del overlay */
  title?: string;
  /** Descripción del overlay */
  description?: string;
  /** Nivel de blur (default 6) */
  blurLevel?: number;
  /** Barra de progreso de uso */
  usage?: { current: number; max: number };
  /** Texto del CTA (default: "Desbloquear con Premium") */
  ctaText?: string;
}

export function PremiumGate({
  feature,
  currentUsage,
  children,
  title = 'Disponible en Premium',
  description = 'Mejora tu plan para desbloquear esta función',
  blurLevel = 6,
  usage,
  ctaText = 'Desbloquear con Premium',
}: PremiumGateProps) {
  const navigate = useNavigate();
  const { checkAccess, isPremium, isAdmin } = usePlan();

  // Si USER_PREMIUM está apagado, todo es gratis
  if (!isFeatureEnabled('USER_PREMIUM')) return <>{children}</>;

  // Admins y premium pasan directo
  if (isAdmin || isPremium) return <>{children}</>;

  const access = checkAccess(feature, currentUsage);
  if (access.allowed) return <>{children}</>;

  const handleUpgrade = () => {
    track({
      event: EVENTS.PRO_PANEL_UPGRADE_CTA_CLICKED,
      properties: { source: `gate_${feature}` },
    });
    navigate(`/upgrade?feature=${feature}`);
  };

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="pointer-events-none select-none" style={{ filter: `blur(${blurLevel}px)` }}>
        {children}
      </div>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="rounded-full bg-purple-100 p-3">
          <Lock className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{description}</p>
        </div>

        {usage && (
          <div className="w-full max-w-[200px] space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Uso</span>
              <span className="font-medium">
                {usage.current} / {usage.max}
              </span>
            </div>
            <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, (usage.current / usage.max) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <Button
          size="sm"
          onClick={handleUpgrade}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
        >
          <Crown className="h-3.5 w-3.5" />
          {ctaText}
        </Button>
      </div>
    </div>
  );
}
