import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, Sparkles } from '@/lib/icons';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';

/**
 * PawMemberSuccess — callback de Flow.cl cuando el pago B2C se confirma.
 *
 * Origen: Lote D auditoría E2E pre-launch 2026-04-20 (Opción B: URLs limpias).
 * Reemplaza el legacy UpgradeSuccess (que decía "Bienvenido a Premium", obsoleto
 * desde el pivot 2026-04-19 a Paw Member como membresía voluntaria).
 */

const PAW_MEMBER_PERKS = [
  'Badge Paw Member 💛 en tu perfil',
  'Tu aporte mensual visible en /paw-member',
  'Acceso a descuentos de alianzas (Paw Partners)',
  'Reconocimiento público en muralla de donantes',
];

export default function PawMemberSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['my-donation-stats'] });
    queryClient.invalidateQueries({ queryKey: ['my-donation-history'] });
    queryClient.invalidateQueries({ queryKey: ['public-donations'] });
    queryClient.invalidateQueries({ queryKey: ['donations-goal-progress'] });
  }, [queryClient]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Gracias por sostener Paw Friend</title>
      </Helmet>
      <PageHeader title="Pago confirmado" onBack={() => navigate('/paw-member')} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(330 100% 90% / 0.6), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, hsl(45 100% 90% / 0.5), transparent 70%)',
        }}
      />
      <div className="container px-4 py-16 max-w-md mx-auto animate-fade-in">
        <Card className="border-2 border-pink-200/60 bg-gradient-to-br from-pink-50/70 to-amber-50/50 shadow-lg overflow-hidden">
          <CardHeader className="text-center pt-10">
            <div className="mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full bg-pink-300/40 blur-2xl opacity-60" />
              <div className="relative h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center shadow-md">
                <Heart className="h-10 w-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <CardTitle className="text-3xl">
              Gracias por sostener{' '}
              <span className="bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent">
                Paw Friend
              </span>
            </CardTitle>
            <CardDescription className="mt-3 text-base leading-relaxed">
              Tu aporte nos ayuda a mantener la app gratis para todos los dueños de mascotas en
              Chile. Eres parte oficial de Paw Member 💛.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-8">
            <div className="rounded-lg bg-white/70 backdrop-blur-sm border border-pink-200/40 p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" strokeWidth={3} />
                <span>Pago confirmado por Flow</span>
              </div>
            </div>

            <div className="space-y-2 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Lo que recibes
              </p>
              {PAW_MEMBER_PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-amber-500 hover:opacity-90 text-white border-0 font-semibold"
              onClick={() => navigate('/paw-member')}
            >
              <Heart className="h-4 w-4 mr-2" />
              Ir a mi perfil Paw Member
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/home')}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Si tu badge no aparece en unos segundos, refresca la página. El procesamiento de Flow
          puede tardar unos instantes.
        </p>
      </div>
    </div>
  );
}
