/**
 * UpgradePlanBanner — CTA contextual para que el vet free suba a Premium.
 *
 * Solo aparece si el vet actual está en plan_free. Muestra 1-2 diferenciadores
 * clave del siguiente plan recomendado.
 *
 * Origen: Lote C auditoría E2E pre-launch 2026-04-20.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PROVIDER_PLANS, type ProviderPlanId, formatCLP } from '@/lib/plans';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Zap } from '@/lib/icons';

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

  // No mostrar banner si ya está en plan pagado y vigente
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
