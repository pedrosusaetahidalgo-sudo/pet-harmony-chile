import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from '@/lib/icons';
import { useCanOfferServices } from '@/hooks/useCanOfferServices';
import { OfferServicesDialog } from '@/components/OfferServicesDialog';

/**
 * Banner que aparece en Profile/Home cuando un dueno cumple los criterios
 * para ofrecer servicios (paseo, cuidado, entrenamiento) con auto-aprobacion.
 *
 * Si NO es eligible, muestra el nextStep para motivar a completar el perfil
 * o registrar una visita veterinaria (drive completar perfiles).
 */
export function OfferServicesBanner() {
  const { data: eligibility, isLoading } = useCanOfferServices();
  const [open, setOpen] = useState(false);

  if (isLoading || !eligibility) return null;
  if (eligibility.alreadyProvider) return null;

  // Si no es eligible, motivador suave (no spammy)
  if (!eligibility.eligible) {
    if (!eligibility.profileComplete && !eligibility.hasPetWithRecord) return null;
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Gana ingresos extras con Paw Friend
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Te falta: <strong>{eligibility.nextStep}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Gana ingresos extras ofreciendo tus servicios
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tu perfil y ficha estan al dia. Publica paseo, cuidado o entrenamiento y recibe
                reservas segun tus horarios.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            Activar servicios
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
      <OfferServicesDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
