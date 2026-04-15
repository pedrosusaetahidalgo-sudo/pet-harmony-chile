/**
 * Tipos extendidos del directorio de veterinarios.
 *
 * Estos tipos cubren campos que existen en Postgres pero todavía NO están en
 * `src/integrations/supabase/types.ts` (porque no se regeneraron los tipos
 * después de las migraciones del pivot médico).
 *
 * Cuando se ejecute `npx supabase gen types typescript ...`, estos tipos
 * pueden eliminarse y reemplazarse por los generados automáticos.
 */

export type ProviderType = 'individual' | 'home_visit' | 'clinic';
export type ProviderStatus = 'pending' | 'approved' | 'rejected';

export interface ServiceProviderRow {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: ProviderStatus | null;
  provider_plan: string | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;

  // Geolocalización
  address: string | null;
  city: string | null;
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  coverage_radius_km: number | null;

  // Métricas (mantenidas por triggers)
  avg_rating: number | null;
  total_reviews: number | null;
  total_services_completed: number | null;
  rating: number | null;
  experience_years: number | null;

  clinic_name: string | null;

  // === Campos del pivot médico (migración 20260406) ===
  slug: string | null;
  specialties: string[] | null;
  service_areas: string[] | null;
  license_number: string | null;
  price_from: number | null;
  provider_type: ProviderType | null;
  is_directory_visible: boolean | null;
  directory_views: number | null;
  public_email: string | null;
  public_phone: string | null;

  // === Campos de emergencia y horarios (migración 20260408) ===
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opening_hours: any;
  emergency_available: boolean | null;
  emergency_phone: string | null;
  emergency_surcharge_pct: number | null;
}

export interface ServiceReviewRow {
  id: string;
  provider_id: string;
  reviewer_id: string;
  booking_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  service_type: string;
  is_visible: boolean;
  provider_response: string | null;
  provider_responded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // === Campos del pivot médico ===
  verification_type: 'booking' | 'invitation' | null;
  invitation_id: string | null;
}

export interface ReviewInvitationRow {
  id: string;
  provider_id: string;
  invitation_token: string;
  client_email: string | null;
  client_name: string | null;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}

export interface ReviewInvitationWithProvider extends ReviewInvitationRow {
  service_providers: Pick<ServiceProviderRow, 'id' | 'slug' | 'display_name' | 'avatar_url'> | null;
}

/** Helper para extraer mensaje de error de manera segura. */
export function errorMessage(err: unknown, fallback = 'Error desconocido'): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}
