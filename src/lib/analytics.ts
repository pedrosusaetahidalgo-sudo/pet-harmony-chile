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
  // PostHog
  if (!_posthogInitAttempted) {
    _posthogInitAttempted = true;

    if (POSTHOG_KEY) {
      try {
        const moduleName = 'posthog' + '-js';
        const posthogModule = await import(/* @vite-ignore */ moduleName);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const posthog = (posthogModule as any).default ?? posthogModule;

        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          persistence: 'localStorage',
          loaded: () => {
            if (IS_DEV) logger.debug('[Analytics] PostHog inicializado');
          },
        });

        _posthog = posthog;
        flushPostHogQueue();
      } catch {
        if (IS_DEV) logger.debug('[Analytics] posthog-js no disponible');
      }
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
} as const;

/**
 * Track an analytics event across all providers.
 */
export function track({ event, properties, userId }: TrackEvent): void {
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
  };

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
