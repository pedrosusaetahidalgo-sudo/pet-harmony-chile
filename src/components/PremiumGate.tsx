/**
 * PremiumGate — bloquea features que requieren Paw Member o Manada.
 *
 * Creado 2026-04-29 (Plan v5 Opcion 3, paywall B2C real).
 *
 * Diferencia con PremiumNudge:
 *   - PremiumNudge es soft (aparece AL LADO de un feature gratis, sugiere apoyo).
 *   - PremiumGate es hard (bloquea contenido, fuerza upgrade para acceder).
 *
 * Feature key (string): debe matchear EXACTAMENTE una key de PLANS.*.features
 * en plans.ts. Si no matchea, canAccess() devuelve allowed=true por fallthrough
 * (NO bloquea). Para evitar bugs como share_clinical vs share_clinical_days,
 * pasa el key tipado o copia desde el JSDoc de plans.ts.
 *
 * Uso:
 *   <PremiumGate feature="paw_passport" title="Paw Passport" desc="...">
 *     <PawPassportButton />
 *   </PremiumGate>
 *
 * Si el user es admin, free con flag USER_PREMIUM=false, o tiene un tier que
 * desbloquea la feature → renderiza children sin friction.
 * Si bloqueado → renderiza card upsell con CTA a /paw-member.
 */
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { canAccess, PLANS, type PlanId } from '@/lib/plans';
import { usePlan } from '@/hooks/usePlan';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { track, EVENTS } from '@/lib/analytics';
import { ReactNode } from 'react';

interface PremiumGateProps {
  /** Feature key de plans.ts (ej: 'paw_shield', 'paw_passport', 'insights_pro'). */
  feature: string;
  /** Titulo card upsell. */
  title: string;
  /** Descripcion (1-2 frases sobre el valor). */
  description: string;
  /** Children = contenido premium real. */
  children: ReactNode;
  /** Override visual: card completa o banner inline. Default: 'card'. */
  variant?: 'card' | 'banner';
  /** Override CTA. Default: navegar a /paw-member. */
  onUpgradeClick?: () => void;
  /**
   * Si pasas usage actual, el gate evalua limites numericos
   * (ej: max_pets=2 con currentUsage=2 → bloquea).
   */
  currentUsage?: number;
}

export function PremiumGate({
  feature,
  title,
  description,
  children,
  variant = 'card',
  onUpgradeClick,
  currentUsage,
}: PremiumGateProps) {
  const navigate = useNavigate();
  const { plan } = usePlan();
  const { isAdmin } = useIsAdmin();

  const planId = (plan?.id as PlanId | undefined) ?? 'free';
  const access = canAccess(planId, feature, currentUsage, isAdmin);

  // Permitido → renderiza children
  if (access.allowed) {
    return <>{children}</>;
  }

  const upgradeRequired: PlanId = access.upgradeRequired ?? 'premium';
  const targetPlan = PLANS[upgradeRequired];

  const handleUpgrade = () => {
    track({
      event: EVENTS.PRO_PANEL_UPGRADE_CTA_CLICKED,
      properties: {
        source: 'premium_gate',
        feature,
        from_plan: planId,
        to_plan: upgradeRequired,
      },
    });
    if (onUpgradeClick) {
      onUpgradeClick();
      return;
    }
    navigate('/paw-member');
  };

  const priceLabel =
    targetPlan.monthlyPrice > 0
      ? `$${targetPlan.monthlyPrice.toLocaleString('es-CL')}/mes`
      : 'gratis';

  if (variant === 'banner') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-3">
        <div className="rounded-full bg-purple-100 p-1.5 flex-shrink-0">
          <Lock className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-purple-900">{title}</p>
          <p className="text-xs text-purple-700 mt-0.5">{description}</p>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Activa {targetPlan.name} · {priceLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 flex-shrink-0">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <Badge className="bg-purple-600 text-white text-xs">
                {targetPlan.badge} {targetPlan.name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="bg-white/60 rounded-lg p-3 text-xs text-gray-700 space-y-1">
          <p className="font-semibold text-gray-900">Lo que desbloqueas con {targetPlan.name}:</p>
          <ul className="space-y-0.5 list-disc list-inside text-[11px]">
            {upgradeRequired === 'premium' && (
              <>
                <li>Paw Passport PDF compartible</li>
                <li>Insights Pro (data agregada de tu raza/comuna)</li>
                <li>Audio notes con transcripción IA</li>
                <li>Reportes históricos completos · ficha 1 año</li>
                <li>Hasta 4 mascotas + descuentos Paw Partners</li>
              </>
            )}
            {upgradeRequired === 'paw_manada' && (
              <>
                <li>Todo lo de Paw Member</li>
                <li>Hasta 5 mascotas</li>
                <li>Descuentos Paw Partners exclusivos</li>
                <li>Soporte prioritario · Early access</li>
                <li>$2.000/mes a Fondo Paw Friend Refugios</li>
              </>
            )}
          </ul>
        </div>

        <Button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Activa {targetPlan.name} · {priceLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          Cancelable en cualquier momento · Sin permanencia
        </p>
      </CardContent>
    </Card>
  );
}
