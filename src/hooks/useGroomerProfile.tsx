import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";


export interface GroomerProfileRow {
  id: string;
  user_id: string;
  business_name: string | null;
  bio: string | null;
  experience_years: number | null;
  base_price_clp: number | null;
  services_offered: string[] | null;
  accepts_cats: boolean | null;
  accepts_dogs: boolean | null;
  accepts_long_hair: boolean | null;
  mobile_service: boolean | null;
  city: string | null;
  commune: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  service_areas: string[] | null;
  avg_rating: number | null;
  total_reviews: number | null;
  total_services: number | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface GroomerProfileForm {
  business_name: string;
  bio: string;
  experience_years: number | null;
  base_price_clp: number | null;
  services_offered: string[];
  accepts_cats: boolean;
  accepts_dogs: boolean;
  accepts_long_hair: boolean;
  mobile_service: boolean;
  commune: string | null;
  service_areas: string[];
}

/** Lista groomers aprobados (público). */
export function useApprovedGroomers(commune?: string) {
  return useQuery<GroomerProfileRow[]>({
    queryKey: ['groomers-approved', commune],
    queryFn: async () => {
      let query = sb
        .from('groomer_profiles')
        .select('*')
        .eq('status', 'approved');
      if (commune) query = query.eq('commune', commune);
      const { data, error } = await query
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) {
        logger.warn('groomer_profiles query failed:', error.message);
        return [];
      }
      return (data ?? []) as GroomerProfileRow[];
    },
  });
}

/** El perfil de groomer del usuario logueado. */
export function useMyGroomerProfile() {
  const { user } = useAuth();
  return useQuery<GroomerProfileRow | null>({
    queryKey: ['my-groomer-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from('groomer_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as GroomerProfileRow | null;
    },
  });
}

export function useUpsertGroomerProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation<GroomerProfileRow, Error, GroomerProfileForm>({
    mutationFn: async (form) => {
      if (!user) throw new Error('No autenticado');

      const payload = {
        user_id: user.id,
        business_name: form.business_name.trim() || null,
        bio: form.bio.trim() || null,
        experience_years: form.experience_years,
        base_price_clp: form.base_price_clp,
        services_offered: form.services_offered,
        accepts_cats: form.accepts_cats,
        accepts_dogs: form.accepts_dogs,
        accepts_long_hair: form.accepts_long_hair,
        mobile_service: form.mobile_service,
        commune: form.commune,
        service_areas: form.service_areas,
      };

      const { data, error } = await sb
        .from('groomer_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data as GroomerProfileRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-groomer-profile', user?.id] });
    },
  });
}

export const GROOMER_SERVICES = [
  'Baño',
  'Corte de pelo',
  'Corte de uñas',
  'Limpieza de oídos',
  'Limpieza dental',
  'Desparasitación externa',
  'Arreglo de raza',
  'Stripping',
  'Spa completo',
] as const;
