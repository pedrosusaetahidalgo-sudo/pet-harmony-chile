/**
 * Hook que unifica el feed de adopcion: posts de owner + pets de refugio.
 *
 * Fuentes:
 *   1. adoption_posts (owners postean adopcion de su mascota)
 *   2. pets WHERE created_by_shelter_id IS NOT NULL AND owner_id IS NULL
 *      AND shelter_adopted_at IS NULL (mascotas activas en refugio)
 *
 * Decision: NO duplicamos en SQL (no creamos adoption_post automaticos para
 * mascotas de refugio). Hacemos UNION en TS y normalizamos a AdoptableItem.
 *
 * Ver REFACTOR_ADOPCION_2026_04_24.md §1.2.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AdoptableItem = {
  /** Identificador unico del item en el feed (post.id o pet.id) */
  id: string;
  /** Origen: post de owner o mascota directa de refugio */
  source: 'owner_post' | 'shelter_pet';
  /** Solo presente si source='shelter_pet' (apunta a pets.id real) */
  pet_id: string | null;
  /** Solo presente si source='owner_post' (apunta a adoption_posts.id) */
  adoption_post_id: string | null;
  name: string;
  species: string;
  breed: string | null;
  age_months: number | null;
  gender: string | null;
  size: string | null;
  /** Comuna en formato texto libre (owner_post) o comuna estructurada (shelter) */
  comuna: string | null;
  photo_url: string | null;
  description: string | null;
  /** Solo shelter_pet: nombre del refugio dueno */
  shelter_id: string | null;
  shelter_name: string | null;
  shelter_slug: string | null;
  /** Solo owner_post: id del owner que postea */
  owner_user_id: string | null;
  created_at: string;
};

export type AdoptionFilters = {
  comuna?: string;
  species?: string;
  size?: string;
  /** 'cachorro' | 'joven' | 'adulto' | 'senior' */
  ageBucket?: string;
  /** Solo refugios o solo posts owner */
  sourceFilter?: 'all' | 'shelters_only' | 'owners_only';
};

const AGE_BUCKETS = {
  cachorro: { min: 0, max: 6 },
  joven: { min: 6, max: 24 },
  adulto: { min: 24, max: 96 },
  senior: { min: 96, max: 999 },
};

function ageBucketMatch(months: number | null, bucket: string): boolean {
  if (!months || !(bucket in AGE_BUCKETS)) return true;
  const { min, max } = AGE_BUCKETS[bucket as keyof typeof AGE_BUCKETS];
  return months >= min && months < max;
}

function calcAgeMonthsFromBirth(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
}

function postToItem(p: Record<string, unknown>): AdoptableItem {
  const ageYears = (p.age_years as number) ?? 0;
  const ageMonths = (p.age_months as number) ?? 0;
  const totalMonths = ageYears * 12 + ageMonths;
  const photos = (p.photos as string[]) ?? [];
  return {
    id: p.id as string,
    source: 'owner_post',
    pet_id: null,
    adoption_post_id: p.id as string,
    name: p.pet_name as string,
    species: p.species as string,
    breed: (p.breed as string) ?? null,
    age_months: totalMonths > 0 ? totalMonths : null,
    gender: (p.gender as string) ?? null,
    size: (p.size as string) ?? null,
    comuna: (p.location as string) ?? null,
    photo_url: photos[0] ?? null,
    description: (p.description as string) ?? null,
    shelter_id: null,
    shelter_name: null,
    shelter_slug: null,
    owner_user_id: p.user_id as string,
    created_at: p.created_at as string,
  };
}

function shelterPetToItem(
  pet: Record<string, unknown>,
  shelter: { id: string; legal_name: string; slug: string | null; commune: string } | null
): AdoptableItem {
  return {
    id: pet.id as string,
    source: 'shelter_pet',
    pet_id: pet.id as string,
    adoption_post_id: null,
    name: pet.name as string,
    species: pet.species as string,
    breed: (pet.breed as string) ?? null,
    age_months: calcAgeMonthsFromBirth((pet.birth_date as string) ?? null),
    gender: (pet.gender as string) ?? null,
    size: (pet.size as string) ?? null,
    comuna: shelter?.commune ?? null,
    photo_url: (pet.photo_url as string) ?? null,
    description: (pet.bio as string) ?? (pet.shelter_notes as string) ?? null,
    shelter_id: shelter?.id ?? (pet.created_by_shelter_id as string),
    shelter_name: shelter?.legal_name ?? null,
    shelter_slug: shelter?.slug ?? null,
    owner_user_id: null,
    created_at: pet.created_at as string,
  };
}

function applyFilters(items: AdoptableItem[], filters: AdoptionFilters): AdoptableItem[] {
  return items.filter((item) => {
    if (filters.sourceFilter === 'shelters_only' && item.source !== 'shelter_pet') return false;
    if (filters.sourceFilter === 'owners_only' && item.source !== 'owner_post') return false;
    if (filters.species && item.species !== filters.species) return false;
    if (filters.size && item.size !== filters.size) return false;
    if (filters.ageBucket && !ageBucketMatch(item.age_months, filters.ageBucket)) return false;
    if (filters.comuna) {
      const wantedLower = filters.comuna.toLowerCase();
      const itemComuna = (item.comuna ?? '').toLowerCase();
      if (!itemComuna.includes(wantedLower)) return false;
    }
    return true;
  });
}

export function useAdoptionFeed(filters: AdoptionFilters = {}) {
  return useQuery({
    queryKey: ['adoption-feed', filters],
    queryFn: async (): Promise<AdoptableItem[]> => {
      const [postsRes, petsRes] = await Promise.all([
        // 1. Posts de owners disponibles
        supabase
          .from('adoption_posts')
          .select('*')
          .eq('status', 'disponible')
          .order('created_at', { ascending: false })
          .limit(200),

        // 2. Pets de refugios disponibles + JOIN al refugio
        supabase
          .from('pets')
          .select(
            `
            id, name, species, breed, gender, size, photo_url, bio,
            shelter_notes, birth_date, created_by_shelter_id, created_at,
            adoption_centers!created_by_shelter_id (
              id, legal_name, slug, commune
            )
          `
          )
          .not('created_by_shelter_id', 'is', null)
          .is('owner_id', null)
          .is('shelter_adopted_at', null)
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (petsRes.error) throw petsRes.error;

      const items: AdoptableItem[] = [
        ...(postsRes.data ?? []).map(postToItem),
        ...(petsRes.data ?? []).map((p) => {
          // adoption_centers viene como objeto único por la FK
          const shelter = (p as Record<string, unknown>).adoption_centers as {
            id: string;
            legal_name: string;
            slug: string | null;
            commune: string;
          } | null;
          return shelterPetToItem(p as Record<string, unknown>, shelter);
        }),
      ];

      // Sort merged by created_at desc (más reciente primero)
      items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

      return applyFilters(items, filters);
    },
    staleTime: 60_000, // 1 min: el feed cambia poco
  });
}

/** Lista de refugios para el tab "Refugios" del feed unificado. */
export function useShelterDirectory(filters: { comuna?: string; type?: string } = {}) {
  return useQuery({
    queryKey: ['shelter-directory', filters],
    queryFn: async () => {
      let q = supabase
        .from('adoption_centers')
        .select(
          'id, legal_name, slug, commune, type, mission, logo_url, total_pets_in_care, verified'
        )
        .eq('status', 'active')
        .order('total_pets_in_care', { ascending: false });

      if (filters.comuna) {
        q = q.ilike('commune', `%${filters.comuna}%`);
      }
      if (filters.type) {
        q = q.eq('type', filters.type);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000, // 5 min: refugios cambian poco
  });
}
