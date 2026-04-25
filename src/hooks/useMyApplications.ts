/**
 * useMyApplications — vista unificada de postulaciones del usuario.
 *
 * Plan PRODUCT_SYSTEM_COHERENCE §43 item 10 y apendice G.
 *
 * Problema: al postular como Paw Voice, Paw Company o via pitch form
 * generico, el usuario quedaba sin feedback visual de su aplicacion
 * porque el listado publico filtra por `status='active'` / `is_active=true`.
 * Los registros existian en la DB pero el usuario no los veia.
 *
 * Este hook agrega las 3 fuentes:
 *  - `paw_voices` (match por user_id o contact_email)
 *  - `paw_companys` (match por contact_email)
 *  - `pitch_applications` (match por contact_email — RLS ya lo permite
 *    via policy `pitch_apps_self_read`)
 *
 * Retorna un array unificado ordenado por fecha desc.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ApplicationSource = 'paw_voice' | 'paw_company' | 'pitch';

export type ApplicationStatus =
  | 'submitted'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'active'
  | 'rejected'
  | 'contacted'
  | 'inactive';

export interface UnifiedApplication {
  id: string;
  source: ApplicationSource;
  title: string;
  subtitle?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  kind?: string | null;
  detailUrl?: string | null;
}

const PAW_VOICE_COLUMNS = 'id,name,handle,platform,status,created_at,contact_email,user_id';
// La columna canónica es `name` (no `company_name`). Bug detectado en consola
// 2026-04-25 — paw_companys?select=company_name devolvía 400.
const PAW_COMPANY_COLUMNS = 'id,name,partnership_type,status,is_active,created_at,contact_email';
const PITCH_COLUMNS = 'id,kind,organization_name,contact_name,status,created_at,contact_email';

export function useMyApplications() {
  const { user } = useAuth();
  const email = user?.email ?? null;
  const uid = user?.id ?? null;

  return useQuery({
    queryKey: ['my-applications', uid, email],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<UnifiedApplication[]> => {
      const unified: UnifiedApplication[] = [];

      // Paw Voices — intentar por user_id; si hay email, tambien por contact_email.
      const voicesQuery = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_voices' as any)
        .select(PAW_VOICE_COLUMNS);

      if (uid && email) {
        voicesQuery.or(`user_id.eq.${uid},contact_email.eq.${email}`);
      } else if (uid) {
        voicesQuery.eq('user_id', uid);
      } else if (email) {
        voicesQuery.eq('contact_email', email);
      }

      const { data: voices, error: voicesError } = await voicesQuery;
      if (!voicesError && voices) {
        for (const v of voices as Array<Record<string, unknown>>) {
          unified.push({
            id: String(v.id),
            source: 'paw_voice',
            title: `Paw Voice · ${String(v.name ?? 'Sin nombre')}`,
            subtitle: v.handle ? `${v.platform} · @${v.handle}` : String(v.platform ?? ''),
            status: (v.status as ApplicationStatus) ?? 'pending',
            createdAt: String(v.created_at ?? ''),
            detailUrl: '/paw-voices',
          });
        }
      }

      // Paw Companys — match por contact_email (no hay user_id).
      if (email) {
        const { data: companys, error: companysError } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('paw_companys' as any)
          .select(PAW_COMPANY_COLUMNS)
          .eq('contact_email', email);
        if (!companysError && companys) {
          for (const c of companys as Array<Record<string, unknown>>) {
            unified.push({
              id: String(c.id),
              source: 'paw_company',
              title: `Paw Company · ${String(c.name ?? 'Sin nombre')}`,
              subtitle: c.partnership_type === 'sponsor' ? 'Sponsor' : 'Partner',
              status: (c.status as ApplicationStatus) ?? 'pending',
              createdAt: String(c.created_at ?? ''),
              detailUrl: '/paw-companys',
            });
          }
        }

        // Pitch applications (generic form /aplicar) — RLS permite self-read.
        const { data: pitches, error: pitchesError } = await supabase
          .from('pitch_applications')
          .select(PITCH_COLUMNS)
          .eq('contact_email', email);
        if (!pitchesError && pitches) {
          for (const p of pitches as Array<Record<string, unknown>>) {
            unified.push({
              id: String(p.id),
              source: 'pitch',
              title: `Postulación · ${humanizeKind(String(p.kind ?? ''))}`,
              subtitle: (p.organization_name as string) ?? (p.contact_name as string) ?? null,
              status: (p.status as ApplicationStatus) ?? 'submitted',
              createdAt: String(p.created_at ?? ''),
              kind: String(p.kind ?? ''),
              detailUrl: `/aplicar?tipo=${String(p.kind ?? 'otro')}`,
            });
          }
        }
      }

      unified.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
      return unified;
    },
  });
}

function humanizeKind(kind: string): string {
  const map: Record<string, string> = {
    corfo: 'CORFO SSAF-I',
    startup_chile: 'Start-Up Chile',
    paw_companys: 'Paw Companys',
    angels_vc: 'Angels / VC',
    refugio: 'Refugio / Hogar',
    paw_partners: 'Paw Partners',
    vet: 'Veterinario/a',
    paw_voices: 'Paw Voices',
    otro: 'Otro',
  };
  return map[kind] ?? kind;
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    submitted: 'Recibida',
    pending: 'Pendiente',
    in_review: 'En revisión',
    approved: 'Aprobada',
    active: 'Activa',
    rejected: 'Rechazada',
    contacted: 'En contacto',
    inactive: 'Inactiva',
  };
  return labels[status] ?? status;
}

export function applicationStatusTone(
  status: ApplicationStatus
): 'pending' | 'positive' | 'negative' | 'neutral' {
  if (status === 'approved' || status === 'active') return 'positive';
  if (status === 'rejected') return 'negative';
  if (status === 'contacted' || status === 'inactive') return 'neutral';
  return 'pending';
}
