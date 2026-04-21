/**
 * queryConfig — tiempos de cache centralizados para @tanstack/react-query.
 *
 * Problema que resuelve (auditoría top-tier 2026-04-20, QW-7):
 *   El repo tiene ~184 menciones de `staleTime` entre 68 hooks, con
 *   valores entre 30s y 600s sin patrón claro. Esto:
 *     - hace impredecible cuándo una pantalla se refresca
 *     - genera refetch innecesarios en mobile (batería) y picos de
 *       QPS contra Supabase que escalan mal a >10k MAU
 *     - complica debugging ("¿por qué esto no se actualizó?")
 *
 * Regla: tiempos por *tipo de entidad* (qué tan "estático" es el dato).
 *        No por hook.
 *
 * Cómo usar:
 *   import { QUERY_STALE_TIMES, QUERY_GC_TIMES } from '@/lib/queryConfig';
 *
 *   useQuery({
 *     queryKey: ['reminders', petId],
 *     queryFn: ...,
 *     staleTime: QUERY_STALE_TIMES.REALTIME,
 *   });
 *
 * Los hooks existentes pueden migrar gradualmente. Los nuevos deberían
 * importar siempre desde aquí.
 */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

/**
 * staleTime: cuánto tiempo un resultado es "fresco" y no requiere refetch
 * en el próximo mount. En mobile baja agresividad es crítico.
 */
export const QUERY_STALE_TIMES = {
  /** Datos que pueden cambiar en segundos: chat, live metrics admin, status. */
  REALTIME: 15 * SECOND,

  /** Datos que cambian en ~1 min: reminders próximos a vencer, notifs, feed nuevo. */
  NEAR_REALTIME: 60 * SECOND,

  /** Datos que cambian en ~5 min: bookings, mascotas, ficha clínica, paw points. */
  FRESH: 5 * MINUTE,

  /** Datos que cambian en ~15 min: perfil vet, configuración, permisos. */
  STABLE: 15 * MINUTE,

  /** Directorios y listados que casi no cambian: vets, refugios, paw companys,
   *  razas, comunas, precios de referencia, blog posts. */
  DIRECTORY: 30 * MINUTE,

  /** Datos estáticos o de configuración: feature flags, planes, legal copy. */
  STATIC: 60 * MINUTE,

  /** Nunca stale — solo refetch on demand. Usar con cuidado. */
  INFINITY: Infinity,
} as const;

/**
 * gcTime (antes cacheTime): cuánto tiempo se conserva en memoria después de
 * que deja de haber observadores. Influye en navegación hacia atrás (UX).
 */
export const QUERY_GC_TIMES = {
  /** Se puede botar rápido: data grande poco reusada. */
  SHORT: 2 * MINUTE,

  /** Default razonable: mantiene cache durante una sesión típica. */
  DEFAULT: 10 * MINUTE,

  /** Data cara de volver a pedir (directorios, planos): quédate más. */
  LONG: 30 * MINUTE,
} as const;

/**
 * Presets combinados para el 80% de los casos. Azúcar sintáctica:
 *
 *   useQuery({ ...QUERY_PRESETS.DIRECTORY, queryKey, queryFn });
 */
export const QUERY_PRESETS = {
  REALTIME: {
    staleTime: QUERY_STALE_TIMES.REALTIME,
    gcTime: QUERY_GC_TIMES.SHORT,
    refetchOnWindowFocus: true,
  },
  NEAR_REALTIME: {
    staleTime: QUERY_STALE_TIMES.NEAR_REALTIME,
    gcTime: QUERY_GC_TIMES.DEFAULT,
    refetchOnWindowFocus: false,
  },
  FRESH: {
    staleTime: QUERY_STALE_TIMES.FRESH,
    gcTime: QUERY_GC_TIMES.DEFAULT,
    refetchOnWindowFocus: false,
  },
  STABLE: {
    staleTime: QUERY_STALE_TIMES.STABLE,
    gcTime: QUERY_GC_TIMES.DEFAULT,
    refetchOnWindowFocus: false,
  },
  DIRECTORY: {
    staleTime: QUERY_STALE_TIMES.DIRECTORY,
    gcTime: QUERY_GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  },
  STATIC: {
    staleTime: QUERY_STALE_TIMES.STATIC,
    gcTime: QUERY_GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  },
} as const;

/**
 * Mapeo guía entidad → preset. Referencia para code review, no se usa en runtime.
 * Si agregas un hook nuevo, busca la entidad acá primero.
 */
export const QUERY_ENTITY_GUIDE = {
  // Usuario / auth
  profile: 'STABLE',
  session: 'FRESH',
  isAdmin: 'STABLE',
  activeRole: 'STABLE',

  // Mascotas y ficha
  pets: 'FRESH',
  petDetail: 'FRESH',
  medicalRecords: 'FRESH',
  vaccinations: 'FRESH',
  medications: 'FRESH',
  clinicalHistory: 'FRESH',

  // Calendario / reminders / rutinas
  reminders: 'NEAR_REALTIME',
  upcomingReminders: 'NEAR_REALTIME',
  bookings: 'FRESH',
  routines: 'FRESH',
  unifiedCalendar: 'NEAR_REALTIME',

  // Provider / vet / clinic
  providerDashboard: 'FRESH',
  providerPatients: 'FRESH',
  providerSeats: 'STABLE',
  vetAnalytics: 'STABLE',
  vetPublicProfile: 'DIRECTORY',

  // Shelter
  shelterDashboard: 'FRESH',
  shelterPets: 'FRESH',
  shelterPublicProfile: 'DIRECTORY',

  // Social / engagement
  feed: 'NEAR_REALTIME',
  posts: 'NEAR_REALTIME',
  community: 'FRESH',
  pawGame: 'FRESH',
  pawPoints: 'FRESH',
  missions: 'FRESH',

  // Donaciones / Paw Member
  donations: 'FRESH',
  pawMemberStatus: 'STABLE',
  transparencia: 'DIRECTORY',

  // Directorios públicos
  directoryVets: 'DIRECTORY',
  directoryShelters: 'DIRECTORY',
  directoryPartners: 'DIRECTORY',
  pawVoices: 'DIRECTORY',
  pawCompanys: 'DIRECTORY',
  blogPosts: 'DIRECTORY',

  // Admin
  adminDashboard: 'NEAR_REALTIME',
  adminAnalytics: 'NEAR_REALTIME',
  adminFeedback: 'FRESH',
  adminLeads: 'FRESH',
  adminHealth: 'REALTIME',
  adminPitchApplications: 'FRESH',

  // Configuración
  featureFlags: 'STATIC',
  plans: 'STATIC',
  legalCopy: 'STATIC',
} as const satisfies Record<string, keyof typeof QUERY_PRESETS>;

export type QueryPresetName = keyof typeof QUERY_PRESETS;
