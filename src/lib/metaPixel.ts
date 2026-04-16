/**
 * Meta Pixel (Facebook Pixel) integration for web tracking.
 * On native, Facebook SDK App Events are automatically handled by the Facebook Login plugin.
 *
 * Standard events mapped: https://developers.facebook.com/docs/meta-pixel/reference
 */

import { logger } from '@/lib/logger';

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
let _initialized = false;

// Extend window for fbq
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Meta Pixel. Injects the pixel script into the page.
 * Only runs on web and only if VITE_META_PIXEL_ID is set.
 */
export function initMetaPixel(): void {
  if (_initialized || !META_PIXEL_ID || typeof window === 'undefined') return;
  _initialized = true;

  try {
    // Standard Meta Pixel initialization snippet
    /* eslint-disable */
    const f = window;
    const b = document;
    const e = 'script';
    // @ts-ignore
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      // @ts-ignore
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    // @ts-ignore
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
    /* eslint-enable */

    window.fbq?.('init', META_PIXEL_ID);
    window.fbq?.('track', 'PageView');

    logger.debug('[Meta Pixel] Inicializado con ID:', META_PIXEL_ID);
  } catch (error) {
    logger.debug('[Meta Pixel] Error inicializando:', error);
  }
}

/**
 * Track a standard Meta Pixel event.
 */
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!window.fbq) return;
  try {
    if (params) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
  } catch {
    // Best effort
  }
}

/**
 * Track a custom Meta Pixel event.
 */
export function trackMetaCustomEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!window.fbq) return;
  try {
    if (params) {
      window.fbq('trackCustom', eventName, params);
    } else {
      window.fbq('trackCustom', eventName);
    }
  } catch {
    // Best effort
  }
}

/**
 * Map Paw Friend events to Meta standard events.
 */
export const META_EVENT_MAP: Record<string, string> = {
  signup_completed: 'CompleteRegistration',
  login_completed: 'Login',
  pet_created: 'Lead',
  booking_completed: 'Schedule',
  premium_converted: 'Subscribe',
  premium_viewed: 'ViewContent',
  search_vet: 'Search',
  view_vet_profile: 'ViewContent',
  checkout_started: 'InitiateCheckout',
  payment_completed: 'Purchase',
};
