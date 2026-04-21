import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Stethoscope } from '@/lib/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useProviderPlan } from '@/hooks/useProviderPlan';
import { PageHeader } from '@/components/PageHeader';
import { haptics } from '@/lib/haptics';

/**
 * ProviderUpgradeSuccess — callback Flow.cl al confirmar pago B2B vet.
 *
 * Origen: Lote D auditoría E2E pre-launch 2026-04-20.
 */

export default function ProviderUpgradeSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: planCtx } = useProviderPlan();

  useEffect(() => {
    haptics.success();
    queryClient.invalidateQueries({ queryKey: ['provider-plan-context'] });
    queryClient.invalidateQueries({ queryKey: ['provider-plan-banner'] });
    queryClient.invalidateQueries({ queryKey: ['provider-current-plan'] });
  }, [queryClient]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Plan activo — Paw Friend para veterinarios</title>
      </Helmet>
      <PageHeader title="Plan activo" onBack={() => navigate('/provider/dashboard')} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(280 100% 92% / 0.6), transparent 60%)',
        }}
      />
      <div className="container px-4 py-16 max-w-md mx-auto animate-fade-in">
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-purple-50/70 to-white shadow-lg">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-10 w-10 text-primary" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-3xl">
              {planCtx && !planCtx.isFree ? (
                <>
                  Plan <span className="text-primary">{planCtx.planName}</span> activo
                </>
              ) : (
                'Plan activo'
              )}
            </CardTitle>
            <CardDescription className="mt-3 text-base leading-relaxed">
              Tu pago fue confirmado. Ya puedes usar todas las features de tu nuevo plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-8">
            <div className="rounded-lg bg-white border border-emerald-200 p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" strokeWidth={3} />
                <span>Pago confirmado por Flow</span>
              </div>
              {planCtx?.planExpiresAt && (
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Próxima renovación:{' '}
                  <strong>{new Date(planCtx.planExpiresAt).toLocaleDateString('es-CL')}</strong>
                </p>
              )}
            </div>

            <div className="space-y-2 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Qué puedes hacer ahora
              </p>
              {planCtx?.canBulkImport && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Importar pacientes en lote (CSV / Excel)</span>
                </div>
              )}
              {planCtx?.canAudioTranscription && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Transcribir consultas por audio con IA</span>
                </div>
              )}
              {planCtx?.canMultiVet && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Invitar vets a tu cuenta (seats)</span>
                </div>
              )}
              {planCtx && planCtx.features.max_clients === -1 && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Pacientes ilimitados</span>
                </div>
              )}
              {planCtx && planCtx.features.featured_position && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Tu perfil destaca en el directorio</span>
                </div>
              )}
            </div>

            <Button
              className="w-full h-12 font-semibold"
              onClick={() => navigate('/provider/dashboard')}
            >
              Ir al dashboard
            </Button>
            {planCtx?.canMultiVet && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/provider/seats')}
              >
                Invitar vets a mi cuenta
              </Button>
            )}
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Si tu plan no se actualiza en unos segundos, refresca la página.
        </p>
      </div>
    </div>
  );
}
