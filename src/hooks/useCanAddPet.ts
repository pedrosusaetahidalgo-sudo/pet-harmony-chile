import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';

type CanAddPetResult = {
  can: boolean;
  reason?: 'grandfathered' | 'premium' | 'free_slot' | 'premium_required' | 'forbidden';
  pet_count: number;
};

/**
 * Devuelve si el usuario puede agregar una nueva mascota.
 * - Grandfathered (pioneros + early adopters con 2+ pets): siempre puede.
 * - Premium activo: siempre puede.
 * - Free: 1 mascota gratis. La 2da requiere upgrade.
 */
export function useCanAddPet() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['can-add-pet', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<CanAddPetResult> => {
      const { data, error } = await supabase.rpc('can_add_pet', { p_user_id: user!.id });
      if (error) throw error;
      return data as unknown as CanAddPetResult;
    },
    staleTime: 30_000,
  });

  return {
    can: data?.can ?? true, // optimistic: si no cargó, no bloquees
    reason: data?.reason,
    petCount: data?.pet_count ?? 0,
    isLoading,
    error,
  };
}

/**
 * Devuelve un handler que decide a donde mandar al user cuando clickea
 * cualquier boton de "Agregar mascota" en la app:
 *   - puede agregar -> /add-pet
 *   - bloqueado por premium -> /upgrade
 * Asi el paywall se muestra ANTES de cargar el formulario.
 */
export function useGoToAddPet() {
  const navigate = useNavigate();
  const { can, reason, isLoading } = useCanAddPet();

  return () => {
    if (isLoading) {
      navigate(LINKS.addPet());
      return;
    }
    if (!can && reason === 'premium_required') {
      navigate('/paw-member');
      return;
    }
    navigate(LINKS.addPet());
  };
}
