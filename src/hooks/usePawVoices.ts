import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PawVoicePlatform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter' | 'otro';
export type PawVoiceStatus = 'pending' | 'active' | 'inactive' | 'rejected';

export interface PawVoice {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  handle: string | null;
  platform: PawVoicePlatform;
  profile_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  speciality: string | null;
  followers_estimated: number | null;
  status: PawVoiceStatus;
  featured: boolean;
  started_at: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PawVoiceInput {
  name: string;
  slug: string;
  handle?: string | null;
  platform: PawVoicePlatform;
  profile_url?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  speciality?: string | null;
  followers_estimated?: number | null;
  status?: PawVoiceStatus;
  featured?: boolean;
  started_at?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}

/** Lectura publica: solo voices activos, columnas no sensibles. */
const PUBLIC_COLUMNS =
  'id,name,slug,handle,platform,profile_url,avatar_url,bio,speciality,followers_estimated,featured,started_at';

export function usePublicPawVoices() {
  return useQuery({
    queryKey: ['paw-voices', 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_voices' as any)
        .select(PUBLIC_COLUMNS)
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('followers_estimated', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Array<
        Pick<
          PawVoice,
          | 'id'
          | 'name'
          | 'slug'
          | 'handle'
          | 'platform'
          | 'profile_url'
          | 'avatar_url'
          | 'bio'
          | 'speciality'
          | 'followers_estimated'
          | 'featured'
          | 'started_at'
        >
      >;
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useAdminPawVoices() {
  return useQuery({
    queryKey: ['paw-voices', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_voices' as any)
        .select('*')
        .order('status', { ascending: true })
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PawVoice[];
    },
    staleTime: 60_000,
  });
}

/** Aplicacion publica: inserta un Paw Voice con status='pending'. */
export function useApplyAsPawVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<PawVoiceInput, 'status' | 'featured' | 'notes'>) => {
      const payload = {
        ...input,
        status: 'pending' as const,
        featured: false,
        notes: null,
      };
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_voices' as any)
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paw-voices'] });
      // 2026-04-21 (plan §33.4): invalidar tambien el widget "Mis
      // postulaciones" del profile para que el user vea su aplicacion
      // recien creada sin tener que hacer refresh. Mismo patron del fix
      // de adopciones Dia 1.
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function useUpsertPawVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: PawVoiceInput }) => {
      if (id) {
        const { error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('paw_voices' as any)
          .update(input)
          .eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_voices' as any)
        .insert(input)
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paw-voices'] });
    },
  });
}

export function useDeletePawVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_voices' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paw-voices'] });
    },
  });
}
