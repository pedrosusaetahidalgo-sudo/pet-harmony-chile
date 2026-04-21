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
import { PROVIDER_PLANS, type ProviderPlanId, formatCLP } from '@/lib/plans';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Loader2, Sparkles, Clock } from '@/lib/icons';
import { cn } from '@/lib/utils';

type FeatureRow = {
  label: string;
  getValue: (plan: ProviderPlanId) => { value: string; ok: boolean; soon?: boolean };
};

function yesNo(b: boolean): { value: string; ok: boolean } {
  return { value: b ? 'Sí' : '—', ok: b };
}

function unlimited(n: number, unit: string): { value: string; ok: boolean } {
  if (n === -1) return { value: 'Ilimitado', ok: true };
  return { value: `${n} ${unit}`, ok: n > 0 };
}

const FEATURES: FeatureRow[] = [
  {
    label: 'Pacientes',
    getValue: (p) => unlimited(PROVIDER_PLANS[p].features.max_clients, 'activos'),
  },
  {
    label: 'Reservas / mes',
    getValue: (p) => unlimited(PROVIDER_PLANS[p].features.max_bookings_per_month, 'al mes'),
  },
  {
    label: 'Seats (vets bajo tu cuenta)',
    getValue: (p) => unlimited(PROVIDER_PLANS[p].features.max_vet_seats, 'vets'),
  },
  {
    label: 'Perfil público en directorio',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.directory_listing),
  },
  {
    label: 'Destacado en directorio',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.featured_position),
  },
  {
    label: 'Transcripción de consultas (audio)',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.audio_transcription),
  },
  {
    label: 'Importación masiva de pacientes (CSV)',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.bulk_patient_import),
  },
  {
    label: 'Analytics',
    getValue: (p) => {
      const lvl = PROVIDER_PLANS[p].features.analytics_level;
      if (lvl === 'advanced') return { value: 'Avanzada', ok: true };
      if (lvl === 'basic') return { value: 'Básica', ok: true };
      return { value: '—', ok: false };
    },
  },
  {
    label: 'Branding del perfil',
    getValue: (p) => {
      const lvl = PROVIDER_PLANS[p].features.branding_level;
      if (lvl === 'full') return { value: 'Completo', ok: true };
      if (lvl === 'basic') return { value: 'Básico', ok: true };
      return { value: '—', ok: false };
    },
  },
  {
    label: 'Priority support',
    getValue: (p) => yesNo(PROVIDER_PLANS[p].features.priority_support),
  },
  {
    label: 'Multi-sucursal',
    getValue: (p) => {
      const val = PROVIDER_PLANS[p].features.multiple_branches;
      if (!val) return { value: '—', ok: false };
      // Honesto: feature declarada pero no implementada todavia
      return { value: 'Próximamente', ok: true, soon: true };
    },
  },
  {
    label: 'API access',
    getValue: (p) => {
      const val = PROVIDER_PLANS[p].features.api_access;
      if (!val) return { value: '—', ok: false };
      return { value: 'Próximamente', ok: true, soon: true };
    },
  },
  {
    label: 'Comisión en reservas',
    getValue: (p) => ({
      value: `${PROVIDER_PLANS[p].commissionRate}%`,
      ok: PROVIDER_PLANS[p].commissionRate < 10,
    }),
  },
];

const PLAN_ORDER: ProviderPlanId[] = [
  'provider_free',
  'provider_premium',
  'provider_clinic_starter',
  'provider_pro_max',
];

/** Resumen humano: qué suma cada tier sobre el anterior. */
const PLAN_UPGRADES: Record<ProviderPlanId, { pitch: string; adds: string[] }> = {
  provider_free: {
    pitch: 'Para que pruebes Paw Friend sin costo. Hasta 5 pacientes activos y reservas limitadas.',
    adds: [
      'Perfil público verificable en el directorio',
      'Hasta 5 pacientes con ficha clínica compartida',
      'Hasta 10 reservas al mes',
    ],
  },
  provider_premium: {
    pitch: 'El salto a volumen real. Sin límites de pacientes ni reservas + bajada de comisión.',
    adds: [
      'Pacientes y reservas **ilimitadas**',
      'Tu perfil aparece **destacado** en el directorio por comuna',
      '**Transcripción de audio** de consultas con IA',
      'Analytics básica del desempeño',
      'Comisión baja de **10% → 5%** en reservas pagadas',
    ],
  },
  provider_clinic_starter: {
    pitch: 'Para clínicas con varios vets. Suma 3 seats, carga masiva y comisión más baja.',
    adds: [
      '**3 seats** de veterinarios bajo la misma cuenta clínica',
      '**Carga masiva** de pacientes por CSV/Excel',
      'Analytics **avanzada** y branding completo',
      'Priority support (respuesta < 24h)',
      'Comisión baja de **5% → 3%**',
    ],
  },
  provider_pro_max: {
    pitch: 'Para clínicas con varias sucursales. Todo ilimitado, 0% comisión, API + branding.',
    adds: [
      '**Seats ilimitados** — toda la clínica en una cuenta',
      '**Multi-sucursal** (próximamente Q3 2026)',
      '**API access** para integrar con tu sistema (próximamente Q3 2026)',
      'Comisión **0%** en reservas — todo lo que cobras es tuyo',
    ],
  },
};

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PROVIDER_PLANS[planId];
          const isCurrent = planId === currentPlan;
          const isRecommended = planId === recommended && currentPlan === 'provider_free';
          const isProcessing = processingPlan === planId;

          return (
            <Card
              key={planId}
              className={cn(
                'relative flex flex-col',
                isRecommended && 'border-primary ring-1 ring-primary/30 shadow-lg',
                isCurrent && 'border-emerald-400 ring-1 ring-emerald-300/40'
              )}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recomendado
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3">
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 border-emerald-300 text-emerald-700"
                  >
                    Tu plan actual
                  </Badge>
                </div>
              )}

              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      {plan.segment === 'clinic' ? 'Clínica' : 'Individual'}
                    </p>
                  </div>
                  {plan.badge && <span className="text-xl">{plan.badge}</span>}
                </div>

                <div className="mt-1 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {plan.monthlyPrice === 0 ? 'Gratis' : formatCLP(plan.monthlyPrice)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-xs text-muted-foreground">/mes</span>
                    )}
                  </div>
                  {plan.yearlyMonthly > 0 && plan.yearlyMonthly < plan.monthlyPrice && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatCLP(plan.yearlyMonthly)}/mes en plan anual
                    </p>
                  )}
                </div>

                {/* Propuesta de valor clara: qué ganas al subir aquí */}
                <div
                  className={cn(
                    'rounded-md p-3 mb-3 border',
                    planId === 'provider_free'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-primary/5 border-primary/20'
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
                    {planId === 'provider_free' ? 'Ideal para empezar' : 'Qué ganas al subir aquí'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    {PLAN_UPGRADES[planId].pitch}
                  </p>
                  <ul className="space-y-1 text-[11px]">
                    {PLAN_UPGRADES[planId].adds.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">+</span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: bullet
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>'),
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                <details className="text-xs mb-4">
                  <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                    Ver todas las características
                  </summary>
                  <ul className="space-y-1.5 text-xs mt-2 pl-1">
                    {FEATURES.map((f) => {
                      const v = f.getValue(planId);
                      return (
                        <li key={f.label} className="flex items-start gap-2">
                          {v.ok ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                          )}
                          <span className={cn(!v.ok && 'text-muted-foreground/70')}>
                            <span className="text-[11px] text-muted-foreground">{f.label}:</span>{' '}
                            <strong className="text-foreground">{v.value}</strong>
                            {v.soon && (
                              <Badge
                                variant="outline"
                                className="ml-1 text-[9px] bg-amber-50 border-amber-200 text-amber-700"
                              >
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                Q3 2026
                              </Badge>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </details>

                <div className="mt-auto">
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="secondary">
                      Activo
                    </Button>
                  ) : planId === 'provider_free' ? (
                    <Button variant="ghost" disabled className="w-full">
                      —
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isRecommended ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(planId)}
                      disabled={!!processingPlan}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Redirigiendo...
                        </>
                      ) : (
                        'Activar'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
