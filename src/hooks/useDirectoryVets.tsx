import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DirectoryVetFilters {
  search?: string;
  type?: 'individual' | 'home_visit' | 'clinic';
  comuna?: string;
  specialty?: string;
  minRating?: number;
}

const PAGE_SIZE = 12;

export function useDirectoryVets(filters: DirectoryVetFilters) {
  return useInfiniteQuery({
    queryKey: ['directory-vets', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('service_providers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('*' as any)
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

      const { data, error } = await query
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .order('total_reviews', { ascending: false, nullsFirst: false })
        .range(from, to);

      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });
}

export function useDirectoryVetBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['directory-vet', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('*' as any)
        .eq('slug', slug!)
        .eq('is_directory_visible', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useVetReviews(providerId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['vet-reviews', providerId, limit],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_reviews')
        .select('*')
        .eq('provider_id', providerId!)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function trackProviderView(slug: string) {
  const key = `pf_view_${slug}`;
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('increment_provider_views', { provider_slug: slug });
}
