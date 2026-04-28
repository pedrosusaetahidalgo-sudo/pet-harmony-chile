/**
 * UpgradePlanBanner — CTA contextual para que el vet free suba a Premium.
 *
 * Solo aparece si el vet actual está en plan_free. Muestra 1-2 diferenciadores
 * clave del siguiente plan recomendado.
 *
 * Origen: Lote C auditoría E2E pre-launch 2026-04-20.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PROVIDER_PLANS, type ProviderPlanId, formatCLP } from '@/lib/plans';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Zap, X } from '@/lib/icons';

const PREMIUM_TO_CLINIC_DISMISS_KEY = 'pf_premium_to_clinic_dismissed_at';

export function UpgradePlanBanner() {
  const { user } = useAuth();

  const { data: provider } = useQuery({
    queryKey: ['provider-plan-banner', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('provider_plan, provider_type, plan_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as {
        provider_plan: ProviderPlanId;
        provider_type: string | null;
        plan_expires_at: string | null;
      } | null;
    },
  });

  if (!provider) return null;
  const currentPlan = provider.provider_plan ?? 'provider_free';

  // Sprint 1 P1 BIZ-008 (2026-04-28): upsell visible Premium → Clinica.
  // Antes solo habia banner free → premium. Ahora un vet ya en Premium ve
  // un nudge dismissable a "Empresarial" si trabaja con mas vets, o si su
  // clinica necesita carga masiva / multi-sucursal. Threshold sin metricas:
  // todos los Premium ven el nudge una vez, dismiss localStorage.
  if (currentPlan === 'provider_premium') {
    const expiresSoon =
      provider.plan_expires_at &&
      new Date(provider.plan_expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
    if (expiresSoon) {
      return (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>
                Tu plan <strong>{PROVIDER_PLANS[currentPlan].name}</strong> vence pronto (
                {new Date(provider.plan_expires_at!).toLocaleDateString('es-CL')}).
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/provider/upgrade">Renovar</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
    return <PremiumToClinicNudge />;
  }

  // No mostrar banner si ya está en plan clinic/pro_max y vigente
  if (currentPlan !== 'provider_free') {
    const expiresSoon =
      provider.plan_expires_at &&
      new Date(provider.plan_expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
    if (!expiresSoon) return null;

    return (
      <Card className="border-amber-300 bg-amber-50/60">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>
              Tu plan <strong>{PROVIDER_PLANS[currentPlan].name}</strong> vence pronto (
              {new Date(provider.plan_expires_at!).toLocaleDateString('es-CL')}).
            </span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/provider/upgrade">Renovar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // provider_free: recomendar Premium o Clínica según provider_type
  const recommended: ProviderPlanId =
    provider.provider_type === 'clinic' ? 'provider_clinic_starter' : 'provider_premium';
  const recConfig = PROVIDER_PLANS[recommended];

  const recHighlights =
    recommended === 'provider_premium'
      ? 'Pacientes y reservas ilimitadas + destacado + comisión baja 5%'
      : '3 vets bajo una cuenta + bulk import CSV + analytics avanzada + comisión 3%';

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-purple-50/40">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">
              Activa{' '}
              <span className="text-primary">
                {recConfig.name} {recConfig.badge}
              </span>{' '}
              y escala tu trabajo
            </h3>
            <Badge variant="outline" className="text-[10px] bg-white">
              {formatCLP(recConfig.monthlyPrice)}/mes
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{recHighlights}</p>
        </div>
        <Button asChild size="sm" className="shrink-0 gap-1">
          <Link to="/provider/upgrade">
            Ver planes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Sprint 1 P1 BIZ-008 (2026-04-28): nudge para vets en Premium que pueden
 * subir a Clinica. El plan Clinica esta escondido del pricing publico (modelo
 * v2) pero los vets ya activos en Paw Friend deberian saber que existe.
 *
 * Dismiss: localStorage. Si el vet lo cierra, no vuelve a aparecer en 90
 * dias. Si en 90 dias todavia esta en Premium, reaparece — la cuenta sigue
 * elegible.
 */
function PremiumToClinicNudge() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const ts = localStorage.getItem(PREMIUM_TO_CLINIC_DISMISS_KEY);
      if (!ts) return false;
      const dismissedAt = new Date(ts).getTime();
      if (!Number.isFinite(dismissedAt)) return false;
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      return Date.now() - dismissedAt < ninetyDays;
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(PREMIUM_TO_CLINIC_DISMISS_KEY, new Date().toISOString());
    } catch {
      // ignorar (modo privado)
    }
    setDismissed(true);
  };

  return (
    <Card className="relative border-fuchsia-200 bg-gradient-to-br from-fuchsia-50/60 to-purple-50/40">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar"
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/60 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 pr-10">
        <div className="p-2 rounded-lg bg-fuchsia-100 shrink-0">
          <Sparkles className="h-5 w-5 text-fuchsia-600" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <h3 className="font-semibold text-sm">¿Trabajas con más vets en tu clínica?</h3>
          <p className="text-xs text-muted-foreground">
            Plan Empresarial: 3+ seats, carga masiva CSV, multi-sucursal y comisiones a medida.
            Cotizamos según tu equipo.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0 gap-1">
          <Link to="/aplicar?tipo=vet&segmento=clinica&fuente=dashboard">
            Conocer más
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
