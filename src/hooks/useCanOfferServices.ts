import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Determina si el usuario actual cumple los criterios para ofrecer servicios
 * no profesionales (paseo, cuidado, entrenamiento) con auto-aprobacion.
 *
 * Criterios (mismos que el panel admin aplica para auto-aprobar):
 *   1. Perfil completo: display_name + bio + location + avatar_url.
 *   2. Al menos 1 mascota con al menos 1 registro medico (ficha activa).
 *
 * NO incluye verificacion de documentos porque los servicios no-profesionales
 * no requieren titulo. Para vet/grooming sigue vigente el flujo con docs.
 */
export interface OfferServicesEligibility {
  eligible: boolean;
  profileComplete: boolean;
  hasPetWithRecord: boolean;
  alreadyProvider: boolean;
  /** Mensaje corto que explica que falta para ser eligible. */
  nextStep: string | null;
}

export function useCanOfferServices() {
  const { user } = useAuth();
  return useQuery<OfferServicesEligibility>({
    queryKey: ['can-offer-services', user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!user?.id) {
        return {
          eligible: false,
          profileComplete: false,
          hasPetWithRecord: false,
          alreadyProvider: false,
          nextStep: 'Inicia sesion para ofrecer servicios',
        };
      }

      const [profileRes, petsRes, recordsRes, providerRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, bio, location, avatar_url')
          .eq('id', user.id)
          .maybeSingle(),
        supabase.from('pets').select('id').eq('owner_id', user.id),
        supabase.from('medical_records').select('pet_id').eq('owner_id', user.id),
        supabase
          .from('service_providers')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const profile = profileRes.data;
      const profileComplete = !!(
        profile?.display_name &&
        profile?.bio &&
        profile?.location &&
        profile?.avatar_url
      );

      const pets = petsRes.data ?? [];
      const recordedPetIds = new Set((recordsRes.data ?? []).map((r) => r.pet_id));
      const hasPetWithRecord = pets.some((p) => recordedPetIds.has(p.id));

      const alreadyProvider = !!providerRes.data;

      const eligible = profileComplete && hasPetWithRecord && !alreadyProvider;

      let nextStep: string | null = null;
      if (alreadyProvider) nextStep = 'Ya ofreces servicios';
      else if (!profileComplete) nextStep = 'Completa tu perfil (foto, bio, comuna)';
      else if (!hasPetWithRecord) nextStep = 'Registra al menos 1 visita veterinaria';

      return {
        eligible,
        profileComplete,
        hasPetWithRecord,
        alreadyProvider,
        nextStep,
      };
    },
  });
}
