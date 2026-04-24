/**
 * usePetHistoryTimeline — hook que consolida eventos del timeline de una mascota
 *
 * Lee de pet_timeline_events (tabla nueva Fase 0) y fallback a agregacion
 * de tablas existentes (medical_records, pet_reminders, vet_bookings,
 * memorial_events) mientras el trigger de alimentacion automatica no este
 * activo.
 *
 * Refactor Maestro 2026-04-23 §2.4.3 — pilar 3 de la Trinidad del Corazon.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/lib/featureFlags';

export type TimelineCategory =
  | 'health'
  | 'weight'
  | 'nutrition'
  | 'hygiene'
  | 'activity'
  | 'social'
  | 'purchases'
  | 'home'
  | 'milestone'
  | 'legal';

export type TimelineEventSource =
  | 'manual'
  | 'audio'
  | 'auto_trigger'
  | 'ocr'
  | 'vet_note'
  | 'shelter_transfer'
  | 'partner_integration'
  | 'import'
  | 'system';

export interface TimelineEvent {
  id: string;
  pet_id: string;
  category: TimelineCategory;
  title: string;
  description?: string | null;
  event_at: string;
  recorded_at: string;
  source: TimelineEventSource;
  is_milestone: boolean;
  is_user_reported: boolean;
  media_urls?: Record<string, unknown> | null;
  location_geojson?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
  related_record_id?: string | null;
  related_record_table?: string | null;
  visibility: 'private' | 'shared' | 'public';
}

export const TIMELINE_CATEGORY_META: Record<
  TimelineCategory,
  { emoji: string; label: string; color: string; bgColor: string }
> = {
  health: {
    emoji: '🏥',
    label: 'Salud',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
  },
  weight: {
    emoji: '⚖️',
    label: 'Peso',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-200',
  },
  nutrition: {
    emoji: '🍗',
    label: 'Alimentación',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  hygiene: {
    emoji: '🛁',
    label: 'Higiene',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
  },
  activity: {
    emoji: '🐾',
    label: 'Actividad',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
  },
  social: {
    emoji: '📸',
    label: 'Social',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  purchases: {
    emoji: '🛒',
    label: 'Compras',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  home: {
    emoji: '🏠',
    label: 'Hogar',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 border-teal-200',
  },
  milestone: {
    emoji: '💜',
    label: 'Hitos',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50 border-pink-200',
  },
  legal: {
    emoji: '📋',
    label: 'Legal',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
  },
};

interface UseTimelineOptions {
  /** Filtrar por 1+ categorias. undefined = todas */
  categories?: TimelineCategory[];
  /** Limite de eventos retornados (default 200) */
  limit?: number;
  /** Incluir fallback de tablas existentes mientras pet_timeline_events no tiene data */
  includeFallback?: boolean;
}

export function usePetHistoryTimeline(petId: string | undefined, options: UseTimelineOptions = {}) {
  const { categories, limit = 200, includeFallback = true } = options;

  return useQuery({
    queryKey: ['pet-timeline', petId, categories, limit, includeFallback],
    enabled: !!petId,
    staleTime: 60_000,
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!petId) return [];
      const events: TimelineEvent[] = [];

      // 1. Eventos de pet_timeline_events (canonico)
      if (isFeatureEnabled('TIMELINE_CATEGORIES')) {
        let query = supabase
          .from('pet_timeline_events')
          .select('*')
          .eq('pet_id', petId)
          .order('event_at', { ascending: false })
          .limit(limit);

        if (categories && categories.length > 0) {
          query = query.in('category', categories);
        }

        const { data, error } = await query;
        if (error) {
          // Tabla puede no existir aun (antes de aplicar mig 20260525000000)
          if (!error.message.includes('does not exist')) {
            throw error;
          }
        } else if (data) {
          events.push(...(data as TimelineEvent[]));
        }
      }

      // 2. Fallback: agregar eventos de tablas existentes si el timeline canonico
      // esta vacio o el flag esta off. Evita que el usuario vea ficha vacia.
      if (includeFallback && events.length < limit) {
        const remaining = limit - events.length;
        const fallbackEvents = await fetchFallbackEvents(petId, categories, remaining);
        events.push(...fallbackEvents);
      }

      // Ordenar por event_at descendente y deduplicar por (category, title, event_at)
      const seen = new Set<string>();
      const unique: TimelineEvent[] = [];
      for (const e of events.sort(
        (a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime()
      )) {
        const key = `${e.category}|${e.title}|${e.event_at}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(e);
        }
      }
      return unique.slice(0, limit);
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Fallback: leer eventos de tablas existentes y mapearlos a TimelineEvent
// ──────────────────────────────────────────────────────────────────────────
async function fetchFallbackEvents(
  petId: string,
  categories: TimelineCategory[] | undefined,
  limit: number
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];
  const shouldInclude = (cat: TimelineCategory) => !categories || categories.includes(cat);

  // medical_records → categoria 'health'
  if (shouldInclude('health')) {
    const { data } = await supabase
      .from('medical_records')
      .select('id, pet_id, record_type, title, description, date, veterinarian_name, created_at')
      .eq('pet_id', petId)
      .order('date', { ascending: false })
      .limit(50);

    if (data) {
      for (const rec of data) {
        events.push({
          id: `mr_${rec.id}`,
          pet_id: rec.pet_id,
          category: 'health',
          title: rec.title || `Registro: ${rec.record_type}`,
          description: rec.description ?? null,
          event_at: rec.date ? `${rec.date}T00:00:00Z` : rec.created_at,
          recorded_at: rec.created_at,
          source: 'vet_note',
          is_milestone: false,
          is_user_reported: !rec.veterinarian_name,
          visibility: 'private',
          related_record_id: rec.id,
          related_record_table: 'medical_records',
          data: { record_type: rec.record_type, vet: rec.veterinarian_name },
        });
      }
    }
  }

  // pet_reminders completados → category segun type
  if (shouldInclude('health') || shouldInclude('hygiene') || shouldInclude('activity')) {
    const { data } = await supabase
      .from('pet_reminders')
      .select('id, pet_id, title, type, due_date, is_completed, completed_at, created_at')
      .eq('pet_id', petId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (data) {
      for (const rem of data) {
        const cat = mapReminderTypeToCategory(rem.type);
        if (!shouldInclude(cat)) continue;
        events.push({
          id: `rem_${rem.id}`,
          pet_id: rem.pet_id,
          category: cat,
          title: rem.title,
          event_at: rem.completed_at || rem.due_date,
          recorded_at: rem.created_at,
          source: 'auto_trigger',
          is_milestone: false,
          is_user_reported: true,
          visibility: 'private',
          related_record_id: rem.id,
          related_record_table: 'pet_reminders',
          data: { reminder_type: rem.type },
        });
      }
    }
  }

  // memorial_events → categoria 'milestone'
  if (shouldInclude('milestone')) {
    const { data } = await supabase
      .from('memorial_events')
      .select('id, pet_id, event_type, content, created_at')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      for (const me of data) {
        events.push({
          id: `me_${me.id}`,
          pet_id: me.pet_id,
          category: 'milestone',
          title: memorialEventTypeLabel(me.event_type),
          description: me.content ?? null,
          event_at: me.created_at,
          recorded_at: me.created_at,
          source: 'system',
          is_milestone: true,
          is_user_reported: true,
          visibility: 'private',
          related_record_id: me.id,
          related_record_table: 'memorial_events',
          data: { event_type: me.event_type },
        });
      }
    }
  }

  return events.slice(0, limit);
}

function mapReminderTypeToCategory(type: string): TimelineCategory {
  switch (type) {
    case 'vaccine':
    case 'medication':
    case 'checkup':
    case 'deworming':
    case 'antiparasitic':
    case 'followup':
      return 'health';
    case 'weight':
      return 'weight';
    case 'grooming':
      return 'hygiene';
    default:
      return 'health';
  }
}

function memorialEventTypeLabel(eventType: string): string {
  const map: Record<string, string> = {
    passing_registered: 'Registro de fallecimiento',
    tribute_added: 'Tributo agregado',
    photo_added: 'Foto memorial',
    message_added: 'Mensaje memorial',
    remembrance_enabled: 'Recuerdos activados',
  };
  return map[eventType] || eventType;
}
