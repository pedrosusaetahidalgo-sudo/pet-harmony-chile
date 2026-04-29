/**
 * PawShieldStatusCard — Tarjeta en tab Identidad de la ficha clinica.
 *
 * Estado visual segun pets.petify_pet_id + petify_quality:
 *   - SIN ACTIVAR (petify_pet_id IS NULL):
 *       → CTA "Activar Paw Shield" → abre PawShieldEnrollment dialog
 *   - LOW QUALITY (1-2 fingerprints):
 *       → Banner "Paw Shield activo, 1 foto. Recomendado 3+. Mejorar"
 *       → CTA "Sumar mas fotos"
 *   - HIGH QUALITY (>=3 fingerprints):
 *       → Estado "Paw Shield activo · 3 fotos"
 *       → Link "Ver eventos / desactivar" (future)
 *
 * Solo se renderiza si feature flag PAW_SHIELD_PETIFY=true.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ShieldCheck, Shield, AlertCircle } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { PawShieldEnrollment } from './PawShieldEnrollment';

interface PawShieldStatusCardProps {
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed?: string;
}

interface PetShieldRow {
  petify_pet_id: string | null;
  petify_registered_at: string | null;
  petify_fingerprint_count: number;
  petify_quality: 'high' | 'low' | null;
  nose_print_pending: boolean;
}

export function PawShieldStatusCard({
  petId,
  petName,
  petSpecies,
  petBreed,
}: PawShieldStatusCardProps) {
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: pet, isLoading } = useQuery<PetShieldRow | null>({
    queryKey: ['paw-shield-status', petId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('pets')
        .select(
          'petify_pet_id, petify_registered_at, petify_fingerprint_count, petify_quality, nose_print_pending'
        )
        .eq('id', petId)
        .maybeSingle();
      return (data as PetShieldRow) ?? null;
    },
    staleTime: 60_000,
    enabled: isFeatureEnabled('PAW_SHIELD_PETIFY'),
  });

  if (!isFeatureEnabled('PAW_SHIELD_PETIFY')) return null;
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Normalizar species → enum Petify
  const species: 'DOG' | 'CAT' =
    petSpecies.toLowerCase().includes('gato') || petSpecies.toLowerCase() === 'cat' ? 'CAT' : 'DOG';

  const isActive = !!pet?.petify_pet_id;
  const quality = pet?.petify_quality;
  const fingerprintCount = pet?.petify_fingerprint_count ?? 0;
  const isPending = pet?.nose_print_pending === true;

  const handleSuccess = () => {
    setEnrollmentOpen(false);
    queryClient.invalidateQueries({ queryKey: ['paw-shield-status', petId] });
  };

  // ── Sin activar ──
  if (!isActive) {
    return (
      <>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-8 w-8 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">Paw Shield</h3>
                <p className="text-sm text-muted-foreground">
                  {isPending
                    ? `Activacion pendiente para ${petName}. Probemos otra vez cuando este tranquilo.`
                    : `Si ${petName} se pierde, otros pueden encontrarlo escaneando su hocico. Sin costo.`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setEnrollmentOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              {isPending ? 'Reintentar Paw Shield' : 'Activar Paw Shield'}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={enrollmentOpen} onOpenChange={setEnrollmentOpen}>
          <DialogContent className="max-w-md p-0">
            <PawShieldEnrollment
              petId={petId}
              petName={petName}
              petSpecies={species}
              petBreed={petBreed}
              onSuccess={handleSuccess}
              onClose={() => setEnrollmentOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Activo low quality (1-2 fotos) ──
  if (quality === 'low') {
    return (
      <>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Paw Shield activo (mejora la captura)</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Tienes {fingerprintCount} foto registrada. Recomendamos 3+ para que el match sea
                  robusto.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setEnrollmentOpen(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Sumar mas fotos
            </Button>
          </CardContent>
        </Card>
        {/* Re-enroll dialog: en este MVP usamos el mismo flow (sobrescribe). */}
        <Dialog open={enrollmentOpen} onOpenChange={setEnrollmentOpen}>
          <DialogContent className="max-w-md p-0">
            <PawShieldEnrollment
              petId={petId}
              petName={petName}
              petSpecies={species}
              petBreed={petBreed}
              onSuccess={handleSuccess}
              onClose={() => setEnrollmentOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Activo high quality (>=3 fotos) ──
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Paw Shield activo</h3>
            <p className="text-xs text-muted-foreground">
              {fingerprintCount} fotos registradas · biometria optima
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
