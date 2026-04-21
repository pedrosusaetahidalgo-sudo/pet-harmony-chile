/**
 * ProviderUpgrade — pagina de upgrade B2B para veterinarios.
 *
 * Origen: Lote C auditoría E2E pre-launch 2026-04-20.
 * Muestra los 4 tiers (Basica / Premium / Clinica / Pro Max) con sus
 * features y conecta con flow-create-subscription para pagos B2B.
 *
 * Features NO implementadas todavia se marcan con chip "Próximamente"
 * (multiple_branches y api_access de Pro Max) para ser honestos.
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PROVIDER_PLANS, type ProviderPlanId } from '@/lib/plans';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { PlanComparisonTableVet } from '@/components/pricing/PlanComparisonTable';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from '@/lib/icons';

export default function ProviderUpgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processingPlan, setProcessingPlan] = useState<ProviderPlanId | null>(null);

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider-current-plan', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('id, provider_plan, plan_expires_at, provider_type')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as {
        id: string;
        provider_plan: ProviderPlanId;
        plan_expires_at: string | null;
        provider_type: string | null;
      } | null;
    },
  });

  const currentPlan = provider?.provider_plan ?? 'provider_free';

  const recommended = useMemo<ProviderPlanId>(() => {
    if (provider?.provider_type === 'clinic') return 'provider_clinic_starter';
    return 'provider_premium';
  }, [provider?.provider_type]);

  const handleUpgrade = async (plan: ProviderPlanId) => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }
    if (plan === currentPlan) return;
    if (plan === 'provider_free') {
      toast.info('Para volver a Básica, contacta soporte.');
      return;
    }

    setProcessingPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke('flow-create-subscription', {
        body: { plan },
      });
      if (error) {
        toast.error(error.message || 'No se pudo iniciar el pago');
        return;
      }
      const res = data as { url?: string; error?: string } | null;
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      toast.error('Respuesta inesperada del servidor de pagos');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(msg);
    } finally {
      setProcessingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <PageHeader title="Planes para veterinarios" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Helmet>
        <title>Activar plan — Paw Friend para veterinarios</title>
      </Helmet>

      <PageHeader
        title="Planes para veterinarios"
        subtitle="Elige el plan que te acompañe mejor. Puedes cambiar o cancelar cuando quieras."
      />

      {provider?.plan_expires_at && currentPlan !== 'provider_free' && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>
              Tu plan <strong>{PROVIDER_PLANS[currentPlan].name}</strong> está activo hasta{' '}
              <strong>{new Date(provider.plan_expires_at).toLocaleDateString('es-CL')}</strong>.
            </span>
          </CardContent>
        </Card>
      )}

      <PlanComparisonTableVet
        onCta={handleUpgrade}
        ctaLabel={(planId) => (planId === 'provider_free' ? '—' : 'Activar')}
        currentPlanId={currentPlan}
        processingPlanId={processingPlan}
        recommendedPlanId={recommended}
        disabledPlanIds={['provider_free']}
      />

      <Card className="border-border/60">
        <CardContent className="p-5 space-y-2 text-sm">
          <p className="font-semibold">¿Preguntas frecuentes?</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong>Pago:</strong> procesado por Flow.cl (webpay, transferencia, tarjeta).
            </li>
            <li>
              <strong>Ciclo:</strong> mensual. Se renueva automáticamente cada 30 días.
            </li>
            <li>
              <strong>Cancelación:</strong> puedes cancelar cuando quieras. Mantienes acceso hasta
              el término del mes pagado.
            </li>
            <li>
              <strong>Downgrade:</strong> volver a Básica se puede escribiendo a soporte.
            </li>
            <li>
              <strong>Boletas:</strong> se emiten automáticamente a nombre del vet o clínica.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            ¿Dudas? Escríbenos a{' '}
            <a href="mailto:pawfriendcl@gmail.com" className="underline">
              pawfriendcl@gmail.com
            </a>
            .
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/provider/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
