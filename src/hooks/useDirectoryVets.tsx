import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase;
import type { ServiceProviderRow, ServiceReviewRow } from '@/types/vetDirectory';

export interface DirectoryVetFilters {
  search?: string;
  type?: 'individual' | 'home_visit' | 'clinic';
  comuna?: string;
  specialty?: string;
  minRating?: number;
}

const PAGE_SIZE = 12;

export function useDirectoryVets(filters: DirectoryVetFilters) {
  return useInfiniteQuery<ServiceProviderRow[]>({
    queryKey: ['directory-vets', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      // Sprint 1 P1 PERF-003 (2026-04-28): solo columnas que VetCard renderiza.
      // Antes select('*') traia 40+ columnas/row × 12 rows = ~5KB innecesarios.
      // El detail page (useDirectoryVetBySlug) sigue trayendo todo.
      let query = sb
        .from('service_providers')
        .select(
          'id, user_id, slug, display_name, avatar_url, is_verified, ' +
            'provider_type, commune, service_areas, specialties, ' +
            'avg_rating, total_reviews, price_from, ' +
            'opening_hours, emergency_available, featured_until'
        )
        .eq('is_directory_visible', true);

      if (filters.search && filters.search.trim()) {
        query = query.ilike('display_name', `%${filters.search.trim()}%`);
      }
      if (filters.type) {
        query = query.eq('provider_type', filters.type);
      }
      if (filters.comuna) {
        query = query.or(`commune.eq.${filters.comuna},service_areas.cs.{${filters.comuna}}`);
      }
      if (filters.specialty) {
        query = query.contains('specialties', [filters.specialty]);
      }
      if (filters.minRating && filters.minRating > 0) {
        query = query.gte('avg_rating', filters.minRating);
      }

      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Ordering: featured_until (vigente) DESC primero, luego rating, luego reviews.
      // Mig 20260712010000 agrega featured_until que flow-webhook setea al activar
      // plan pago. Vets con featured vigente aparecen arriba del directorio.
      const { data, error } = await query
        .order('featured_until', { ascending: false, nullsFirst: false })
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .order('total_reviews', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (error) throw error;
      // Cast a la forma completa: VetCard solo lee columnas listadas arriba,
      // las restantes quedan undefined (no usadas en list view).
      return (data ?? []) as unknown as ServiceProviderRow[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });
}

export function useDirectoryVetBySlug(
  slug: string | undefined,
  opts?: { skipVisibilityFilter?: boolean }
) {
  return useQuery<ServiceProviderRow | null>({
    queryKey: ['directory-vet', slug, opts?.skipVisibilityFilter],
    enabled: !!slug,
    queryFn: async () => {
      let query = sb.from('service_providers').select('*').eq('slug', slug!);
      if (!opts?.skipVisibilityFilter) {
        query = query.eq('is_directory_visible', true);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return (data ?? null) as ServiceProviderRow | null;
    },
  });
}

export function useVetReviews(providerId: string | undefined, limit = 20) {
  return useQuery<ServiceReviewRow[]>({
    queryKey: ['vet-reviews', providerId, limit],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('service_reviews')
        .select('*')
        .eq('provider_id', providerId!)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ServiceReviewRow[];
    },
  });
}

export async function trackProviderView(slug: string) {
  const key = `pf_view_${slug}`;
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  await supabase.rpc('increment_provider_views', { provider_slug: slug });
}
