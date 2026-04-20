/**
 * Hook que devuelve el adoption_center del user actual (si tiene uno).
 * Tabla adoption_centers se crea en migracion 20260620000000 — si no esta
 * aplicada, la query falla gracefully y devuelve null.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdoptionCenter {
  id: string;
  user_id: string;
  legal_name: string;
  rut: string | null;
  type: 'ong' | 'fundacion' | 'refugio' | 'independiente' | 'municipal';
  mission: string | null;
  commune: string;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  social_media: Record<string, string>;
  animal_types: string[];
  capacity: number | null;
  logo_url: string | null;
  banner_url: string | null;
  slug: string | null;
  accepts_donations: boolean;
  donation_percentage: number;
  verified: boolean;
  verified_at: string | null;
  total_pets_adopted: number;
  total_pets_in_care: number;
  total_donations_clp: number;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export function useShelter() {
  const { user } = useAuth();

  const query = useQuery<AdoptionCenter | null>({
    queryKey: ['shelter', 'current', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('adoption_centers' as any) as any)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return null;
        return (data as AdoptionCenter) || null;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  return {
    shelter: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
