/**
 * Tab "Identidad" de la ficha clínica — wrappea PetIdCardDisplay con
 * el hook usePetIdCard que maneja carga + generación on-demand.
 *
 * Pilar 1 de la Trinidad del Corazón (Refactor Maestro §2.4.1).
 * Solo se muestra cuando PET_ID_CARD_V1 está activo.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PetIdCardDisplay } from './PetIdCardDisplay';
import { PetRiskScoreCard } from './PetRiskScoreCard';
import { BreedComparisonCard } from './BreedComparisonCard';
import { usePetIdCard } from '@/hooks/usePetIdCard';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';
import { useEffect } from 'react';

interface PetIdCardSectionProps {
  petId: string;
}

export function PetIdCardSection({ petId }: PetIdCardSectionProps) {
  const { data, isLoading, hasCard, generate, isGenerating, error } = usePetIdCard(petId);

  useEffect(() => {
    trackRefactor(RefactorEvent.petIdCardOpened, { has_card: hasCard });
  }, [hasCard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-900">Error al cargar la cédula</p>
            <p className="text-sm text-red-700 mt-0.5">{(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No pudimos cargar los datos de la mascota.
        </CardContent>
      </Card>
    );
  }

  // Si no tiene card_number, ofrecer generar
  if (!hasCard) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/40 to-white">
        <CardContent className="p-6 text-center space-y-4">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-purple-100 items-center justify-center">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Cédula digital de {data.pet_name}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Una identificación oficial estilo cédula chilena con QR para emergencias. Útil en
              consultas vet, viajes y cuando se pierde tu mascota.
            </p>
          </div>
          <Button
            onClick={() => {
              generate(undefined, {
                onSuccess: () => {
                  trackRefactor(RefactorEvent.petIdCardGenerated);
                  toast.success('Cédula generada correctamente');
                },
                onError: (err: Error) => toast.error(err.message),
              });
            }}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" /> Generar cédula
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PetIdCardDisplay
        data={data}
        qrMode="emergency"
        interactive
        onDownload={() => toast.info('Descarga PDF próximamente')}
        onShare={() => {
          trackRefactor(RefactorEvent.petIdCardShared);
          if (navigator.share) {
            navigator
              .share({
                title: `Cédula de ${data.pet_name}`,
                text: `Cédula digital de ${data.pet_name} en Paw Friend`,
                url: `${window.location.origin}/qr/${data.card_number}`,
              })
              .catch(() => undefined);
          } else {
            navigator.clipboard.writeText(`${window.location.origin}/qr/${data.card_number}`);
            toast.success('Link copiado al portapapeles');
          }
        }}
      />
      {/* Refactor Maestro Fase 2 §7.5 — Score de salud heuristico que ademas
          es la base del deal con aseguradoras (B2B API risk_score endpoint).
          Se renderiza solo si la mig 20260902100000 esta aplicada y la RPC
          devuelve resultados (silent fail si no). */}
      <PetRiskScoreCard petId={petId} />

      {/* §14.bis.3 Tensión 3: comparacion social temprana. Solo aparece si
          la raza tiene >=50 pets en public_breed_stats (privacy). Da valor
          al dueño desde el dia 1. */}
      <BreedComparisonCard petId={petId} petName={data.pet_name} />
    </div>
  );
}
