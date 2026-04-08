import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type CanAddPetResult = {
  can: boolean;
  reason?: "grandfathered" | "premium" | "free_slot" | "premium_required" | "forbidden";
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
    queryKey: ["can-add-pet", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<CanAddPetResult> => {
      // @ts-expect-error RPC types se regeneran tras aplicar migracion 20260413000000
      const { data, error } = await supabase.rpc("can_add_pet", { p_user_id: user!.id });
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
