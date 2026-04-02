/**
 * Analytics Event Tracking
 * Foundation for product analytics - tracks key user events
 *
 * Events are logged via logger in development.
 * Replace with actual analytics provider (Mixpanel, Amplitude, PostHog)
 * when ready for production analytics.
 */

import { logger } from "@/lib/logger";

interface TrackEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
}

const IS_DEV = import.meta.env.DEV;

// Key events to track
export const EVENTS = {
  // Auth
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_COMPLETED: "login_completed",
  LOGOUT: "logout",

  // Onboarding
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP: "onboarding_step",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_SKIPPED: "onboarding_skipped",

  // Pets
  PET_CREATED: "pet_created",
  PET_PROFILE_VIEWED: "pet_profile_viewed",
  CLINICAL_RECORD_VIEWED: "clinical_record_viewed",
  CLINICAL_PDF_DOWNLOADED: "clinical_pdf_downloaded",

  // Medical
  MEDICAL_RECORD_ADDED: "medical_record_added",
  REMINDER_CREATED: "reminder_created",
  REMINDER_COMPLETED: "reminder_completed",
  DOCUMENT_UPLOADED: "document_uploaded",

  // Social
  POST_CREATED: "post_created",
  POST_LIKED: "post_liked",
  COMMENT_ADDED: "comment_added",
  USER_FOLLOWED: "user_followed",

  // Services
  PROVIDER_VIEWED: "provider_viewed",
  BOOKING_STARTED: "booking_started",
  BOOKING_COMPLETED: "booking_completed",
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_COMPLETED: "payment_completed",

  // Gamification
  STREAK_CLAIMED: "streak_claimed",
  MISSION_COMPLETED: "mission_completed",
  BADGE_EARNED: "badge_earned",
  POINTS_EARNED: "points_earned",
  LEVEL_UP: "level_up",

  // Premium
  PREMIUM_VIEWED: "premium_viewed",
  PREMIUM_STARTED: "premium_started",
  PREMIUM_CONVERTED: "premium_converted",

  // Engagement
  APP_OPENED: "app_opened",
  PAGE_VIEWED: "page_viewed",
  SEARCH_USED: "search_used",
  MAP_OPENED: "map_opened",
  CHAT_STARTED: "chat_started",
  SHARE_LINK_CREATED: "share_link_created",
} as const;

/**
 * Track an analytics event
 * In development: logs to console
 * In production: send to analytics provider
 */
export function track({ event, properties, userId }: TrackEvent): void {
  const payload = {
    event,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
    },
    userId,
  };

  if (IS_DEV) {
    logger.debug("[Analytics]", payload.event, payload.properties);
  }

  // TODO: Replace with actual analytics provider
  // Examples:
  // mixpanel.track(event, payload.properties);
  // posthog.capture(event, payload.properties);
  // amplitude.logEvent(event, payload.properties);
}

/**
 * Identify a user for analytics
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (IS_DEV) {
    logger.debug("[Analytics] Identify:", userId, traits);
  }

  // TODO: Replace with actual analytics provider
  // mixpanel.identify(userId);
  // mixpanel.people.set(traits);
}
