/**
 * Analytics Event Tracking — Unified multi-provider analytics.
 *
 * Providers (all optional, graceful degradation):
 * - PostHog: set VITE_POSTHOG_KEY in .env
 * - Firebase Analytics: set VITE_FIREBASE_* vars (web) or add google-services.json (native)
 * - Meta Pixel: set VITE_META_PIXEL_ID (web only; native uses Facebook SDK App Events)
 *
 * All events flow through a single `track()` function that fans out to all active providers.
 */

import { logger } from '@/lib/logger';
import {
  initFirebaseAnalytics,
  logFirebaseEvent,
  setFirebaseUserId,
  setFirebaseScreenName,
} from '@/lib/firebaseConfig';
import {
  initMetaPixel,
  trackMetaEvent,
  trackMetaCustomEvent,
  META_EVENT_MAP,
} from '@/lib/metaPixel';

interface TrackEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
}

const IS_DEV = import.meta.env.DEV;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

// Rutas con tokens que NO deben salir a PostHog (privacy leak).
// El path completo se guarda igual en logs internos, solo se saneam para analytics.
const TOKEN_ROUTE_PATTERNS: Array<{ re: RegExp; replace: string }> = [
  { re: /\/qr\/[^/?#]+/g, replace: '/qr/[redacted]' },
  { re: /\/medical-share\/[^/?#]+/g, replace: '/medical-share/[redacted]' },
  { re: /\/paw-card\/[^/?#]+/g, replace: '/paw-card/[redacted]' },
  { re: /\/resena\/[^/?#]+/g, replace: '/resena/[redacted]' },
];

function scrubTokenizedUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  let out = value;
  for (const { re, replace } of TOKEN_ROUTE_PATTERNS) {
    out = out.replace(re, replace);
  }
  return out;
}

function sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const URL_KEYS = ['$current_url', '$pathname', '$referrer', 'url', 'url_raw', 'screen'];
  const next: Record<string, unknown> = { ...properties };
  for (const key of URL_KEYS) {
    if (key in next) next[key] = scrubTokenizedUrl(next[key]);
  }
  return next;
}

// ── Lazy PostHog singleton ──────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _posthog: any | null = null;
let _posthogInitAttempted = false;

/** Queue of calls made before PostHog finishes loading */
const _queue: Array<{ type: 'capture' | 'identify'; args: unknown[] }> = [];

function flushPostHogQueue() {
  if (!_posthog) return;
  for (const item of _queue) {
    try {
      if (item.type === 'capture') {
        _posthog.capture(...(item.args as [string, Record<string, unknown>?]));
      } else if (item.type === 'identify') {
        _posthog.identify(...(item.args as [string, Record<string, unknown>?]));
      }
    } catch {
      // Best effort — don't crash on analytics
    }
  }
  _queue.length = 0;
}

/**
 * Initialize all analytics providers. Call once at app start (e.g. in main.tsx).
 */
export async function initAnalytics(): Promise<void> {
  // PostHog — skip en dev para evitar contaminar prod con eventos de localhost.
  // Opt-in con VITE_POSTHOG_ENABLE_IN_DEV=1 si algun dia se quiere debuggear.
  if (!_posthogInitAttempted) {
    _posthogInitAttempted = true;

    const enableInDev = import.meta.env.VITE_POSTHOG_ENABLE_IN_DEV === '1';
    const shouldInitPosthog = POSTHOG_KEY && (!IS_DEV || enableInDev);

    if (shouldInitPosthog) {
      try {
        const posthogModule = await import('posthog-js');
        const posthog = posthogModule.default;

        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          autocapture: true,
          capture_pageview: true,
          capture_pageleave: true,
          persistence: 'localStorage',
          // Saneamos URLs con tokens antes de que salgan del cliente
          // (aplicado tambien a autocapture + pageview, no solo a track()).
          sanitize_properties: (properties) =>
            sanitizeProperties(properties as Record<string, unknown>),
          loaded: () => {
            if (IS_DEV) logger.debug('[Analytics] PostHog inicializado');
          },
        });

        _posthog = posthog;
        flushPostHogQueue();
      } catch {
        if (IS_DEV) logger.debug('[Analytics] posthog-js no disponible');
      }
    } else if (POSTHOG_KEY && IS_DEV) {
      logger.debug(
        '[Analytics] PostHog deshabilitado en dev (set VITE_POSTHOG_ENABLE_IN_DEV=1 para forzar)'
      );
    }
  }

  // Firebase Analytics
  await initFirebaseAnalytics();

  // Meta Pixel (web only)
  initMetaPixel();
}

// Key events to track
export const EVENTS = {
  // Auth
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT: 'logout',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP: 'onboarding_step',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Pets
  PET_CREATED: 'pet_created',
  PET_PROFILE_VIEWED: 'pet_profile_viewed',
  CLINICAL_RECORD_VIEWED: 'clinical_record_viewed',
  CLINICAL_PDF_DOWNLOADED: 'clinical_pdf_downloaded',

  // Medical
  MEDICAL_RECORD_ADDED: 'medical_record_added',
  FICHA_COMPLETE: 'complete_ficha',
  FICHA_SHARED: 'share_ficha',
  MEDICAL_SHARE_OPENED: 'medical_share_opened',
  REMINDER_CREATED: 'reminder_created',
  REMINDER_COMPLETED: 'reminder_completed',
  DOCUMENT_UPLOADED: 'document_uploaded',

  // Social
  POST_CREATED: 'post_created',
  POST_LIKED: 'post_liked',
  COMMENT_ADDED: 'comment_added',
  USER_FOLLOWED: 'user_followed',

  // Services / Vets
  PROVIDER_VIEWED: 'provider_viewed',
  SEARCH_VET: 'search_vet',
  VIEW_VET_PROFILE: 'view_vet_profile',
  BOOK_VET: 'book_vet',
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_COMPLETED: 'payment_completed',

  // Gamification
  STREAK_CLAIMED: 'streak_claimed',
  MISSION_COMPLETED: 'mission_completed',
  BADGE_EARNED: 'badge_earned',
  POINTS_EARNED: 'points_earned',
  LEVEL_UP: 'level_up',

  // Premium
  PREMIUM_VIEWED: 'premium_viewed',
  PREMIUM_STARTED: 'premium_started',
  PREMIUM_CONVERTED: 'premium_converted',

  // Donations (playbook §9.1 · 2026-04-19)
  DONATION_INITIATED: 'donation_initiated',
  DONATION_COMPLETED: 'donation_completed',

  // B2B Vet funnel (playbook §9.1 · 2026-04-19)
  // Nota: vet_patient_created se dispara en cada paciente — "first patient"
  // se calcula en PostHog filtrando por unique provider_id.
  VET_SIGNUP_STARTED: 'vet_signup_started',
  VET_SIGNUP_COMPLETED: 'vet_signup_completed',
  VET_PATIENT_CREATED: 'vet_patient_created',
  FOUNDING_VET_CTA_CLICKED: 'founding_vet_cta_clicked',

  // First PDF nudge (playbook §9.3 · 2026-04-19)
  FIRST_PDF_NUDGE_SHOWN: 'first_pdf_nudge_shown',
  FIRST_PDF_NUDGE_CLICKED: 'first_pdf_nudge_clicked',

  // Pro Analytics
  ANALYTICS_PREVIEW_VIEWED: 'analytics_preview_viewed',
  ANALYTICS_PREVIEW_CTA_CLICKED: 'analytics_preview_cta_clicked',
  PRO_PANEL_VIEWED: 'pro_panel_viewed',
  PRO_PANEL_FILTER_CHANGED: 'pro_panel_filter_changed',
  PRO_PANEL_EXPORT_CLICKED: 'pro_panel_export_clicked',
  PRO_PANEL_UPGRADE_CTA_CLICKED: 'pro_panel_upgrade_cta_clicked',
  VET_REPORT_VIEWED: 'vet_report_viewed',

  // Reviews
  REVIEW_CREATED: 'review_created',
  REVIEW_INVITATION_SENT: 'review_invitation_sent',

  // Chat / messaging
  CONVERSATION_STARTED: 'conversation_started',
  MESSAGE_SENT: 'message_sent',

  // Engagement
  APP_OPENED: 'app_opened',
  PAGE_VIEWED: 'page_viewed',
  SEARCH_USED: 'search_used',
  MAP_OPENED: 'map_opened',
  CHAT_STARTED: 'chat_started',
  SHARE_LINK_CREATED: 'share_link_created',

  // Admin actions — para auditoria + futuro AI agent
  ADMIN_ACTION: 'admin_action',
  ADMIN_SECTION_VIEWED: 'admin_section_viewed',
  ADMIN_BULK_ACTION: 'admin_bulk_action',
} as const;

/**
 * Normaliza pathnames equivalentes a la "vista lógica" del usuario.
 *
 * Importante para agenda unificada: hoy `/reminders`, `/rutinas` y
 * `/mis-reservas` son rutas fisicas separadas, pero semanticamente son
 * tabs de `/calendario`. Cuando el refactor a tabs aterrice, los mismos
 * eventos deben seguir agrupados por la misma vista logica para que
 * las metricas historicas no se fragmenten.
 */
function normalizeAnalyticsPath(pathname: string): string {
  if (pathname === '/reminders') return '/calendario#recordatorios';
  if (pathname === '/rutinas') return '/calendario#rutinas';
  if (pathname === '/mis-reservas') return '/calendario#reservas';
  // Peek de /mascota/:petId/(timeline|rutinas) a la ficha canonica
  if (/^\/mascota\/[^/]+\/timeline$/.test(pathname)) return '/ficha#historial';
  if (/^\/mascota\/[^/]+\/rutinas$/.test(pathname)) return '/calendario#rutinas';
  return pathname;
}

/**
 * Track an analytics event across all providers.
 */
export function track({ event, properties, userId }: TrackEvent): void {
  const rawPath = window.location.pathname;
  const scrubbedRawPath = scrubTokenizedUrl(rawPath) as string;
  const enrichedProperties = sanitizeProperties({
    ...properties,
    timestamp: new Date().toISOString(),
    url: normalizeAnalyticsPath(scrubbedRawPath),
    url_raw: scrubbedRawPath,
  });

  // Always log in dev for debugging
  if (IS_DEV) {
    logger.debug('[Analytics]', event, enrichedProperties);
  }

  // PostHog
  if (POSTHOG_KEY) {
    if (_posthog) {
      try {
        _posthog.capture(event, enrichedProperties);
      } catch {
        // Best effort
      }
    } else {
      _queue.push({ type: 'capture', args: [event, enrichedProperties] });
    }
  }

  // Firebase Analytics
  logFirebaseEvent(event, enrichedProperties);

  // Meta Pixel — map to standard events when possible, otherwise custom
  const metaStandardEvent = META_EVENT_MAP[event];
  if (metaStandardEvent) {
    trackMetaEvent(metaStandardEvent, enrichedProperties);
  } else {
    trackMetaCustomEvent(event, enrichedProperties);
  }
}

/**
 * Identify a user across all analytics providers.
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (IS_DEV) {
    logger.debug('[Analytics] Identify:', userId, traits);
  }

  // PostHog
  if (POSTHOG_KEY) {
    if (_posthog) {
      try {
        _posthog.identify(userId, traits);
      } catch {
        // Best effort
      }
    } else {
      _queue.push({ type: 'identify', args: [userId, traits] });
    }
  }

  // Firebase
  setFirebaseUserId(userId);
}

/**
 * Track screen view across all providers. Call from route changes.
 */
export function trackScreen(screenName: string): void {
  if (IS_DEV) {
    logger.debug('[Analytics] Screen:', screenName);
  }

  track({ event: EVENTS.PAGE_VIEWED, properties: { screen: screenName } });
  setFirebaseScreenName(screenName);
}

/**
 * Reset analytics identity (call on logout).
 */
export function resetAnalytics(): void {
  if (_posthog) {
    try {
      _posthog.reset();
    } catch {
      // Best effort
    }
  }
}
