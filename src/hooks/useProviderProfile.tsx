import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase;
import { useAuth } from '@/hooks/useAuth';
import type { ServiceProviderRow } from '@/types/vetDirectory';

/** @internal Datos de perfiles demo — bloquear si un vet real intenta guardar sin editar. */
const DEMO_GUARD = {
  emails: new Set([
    'javiera.munoz@demo.pawfriend.cl',
    'matias.fernandez@demo.pawfriend.cl',
    'cristian.rojas@demo.pawfriend.cl',
    'contacto@patitas.demo.pawfriend.cl',
    'contacto@altamira.demo.pawfriend.cl',
  ]),
  phones: new Set([
    '+56 9 8765 1001',
    '+56 9 8765 1002',
    '+56 9 8765 1003',
    '+56 9 8765 1004',
    '+56 9 8765 1005',
  ]),
  colmevet: new Set(['12345', '67890', '11111', '22222', '33333']),
} as const;

export interface ProviderProfileForm {
  display_name: string;
  bio: string;
  provider_type: 'individual' | 'home_visit' | 'clinic';
  specialties: string[];
  service_areas: string[];
  commune: string | null;
  license_number: string;
  experience_years: number | null;
  price_from: number | null;
  avatar_url: string | null;
  public_email: string | null;
  public_phone: string | null;
  is_directory_visible: boolean;
  clinic_name?: string | null;
  address?: string | null;
}

export function useMyProvider() {
  const { user } = useAuth();
  return useQuery<ServiceProviderRow | null>({
    queryKey: ['my-provider', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from('service_providers')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ServiceProviderRow | null;
    },
  });
}

export function useUpsertProviderProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation<ServiceProviderRow, Error, ProviderProfileForm>({
    mutationFn: async (form) => {
      if (!user) throw new Error('No autenticado');

      // Guard: bloquear si email, teléfono o Colmevet coinciden con un perfil demo
      const email = form.public_email?.trim().toLowerCase() ?? '';
      const phone = form.public_phone?.trim() ?? '';
      const colmevet = form.license_number?.trim() ?? '';
      if (
        DEMO_GUARD.emails.has(email) ||
        DEMO_GUARD.phones.has(phone) ||
        DEMO_GUARD.colmevet.has(colmevet)
      ) {
        throw new Error(
          'Estos datos coinciden con un perfil de demostración. Edítalos antes de publicar tu perfil.'
        );
      }

      const payload = {
        user_id: user.id,
        display_name: form.display_name.trim(),
        bio: form.bio.trim() || null,
        provider_type: form.provider_type,
        specialties: form.specialties,
        service_areas: form.service_areas,
        commune: form.commune,
        license_number: form.license_number.trim() || null,
        experience_years: form.experience_years,
        price_from: form.price_from,
        avatar_url: form.avatar_url,
        public_email: form.public_email?.trim() || null,
        public_phone: form.public_phone?.trim() || null,
        is_directory_visible: form.is_directory_visible,
        ...(form.clinic_name !== undefined && { clinic_name: form.clinic_name?.trim() || null }),
        ...(form.address !== undefined && { address: form.address?.trim() || null }),
      };

      const { data, error } = await sb
        .from('service_providers')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data as ServiceProviderRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-provider', user?.id] });
    },
  });
}

/** Score 0–100 con secciones requeridas para `is_directory_visible`. */
export function calculateProfileCompleteness(p: Partial<ProviderProfileForm> | null | undefined): {
  score: number;
  missing: string[];
} {
  if (!p) return { score: 0, missing: ['Todo el perfil'] };
  const missing: string[] = [];
  let score = 0;

  if (p.display_name && p.display_name.trim()) score += 10;
  else missing.push('Nombre');

  if (p.avatar_url) score += 15;
  else missing.push('Foto profesional');

  if (p.bio && p.bio.trim().length >= 50) score += 15;
  else missing.push('Bio (mínimo 50 caracteres)');

  if (p.specialties && p.specialties.length > 0) score += 10;
  else missing.push('Al menos 1 especialidad');

  if (p.service_areas && p.service_areas.length > 0) score += 10;
  else missing.push('Al menos 1 zona de atención');

  if (p.experience_years && p.experience_years > 0) score += 5;
  else missing.push('Años de experiencia');

  if (p.license_number && p.license_number.trim()) score += 10;
  else missing.push('Número Colmevet');

  if (p.price_from && p.price_from > 0) score += 15;
  else missing.push('Precio desde');

  if (p.commune) score += 5;
  else missing.push('Comuna base');

  if (p.public_phone || p.public_email) score += 5;
  else missing.push('Email o teléfono público');

  return { score, missing };
}

export const REQUIRED_FOR_DIRECTORY_SCORE = 80;

export async function uploadProviderAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
