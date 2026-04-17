/**
 * Firebase configuration — lazy-loaded only when env vars are present.
 * Used for Firebase Analytics (web) and as config reference for native.
 */
import { logger } from '@/lib/logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _app: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _analytics: any = null;
let _initAttempted = false;

/**
 * Initialize Firebase for web analytics. No-op if config is missing or on native.
 */
export async function initFirebaseAnalytics(): Promise<void> {
  if (_initAttempted) return;
  _initAttempted = true;

  if (!isFirebaseConfigured) {
    logger.debug('[Firebase] No configurado — variables VITE_FIREBASE_* ausentes');
    return;
  }

  // On native, analytics goes through @capacitor-firebase/analytics plugin (auto-configured)
  // We only init web SDK for browser
  if (typeof window === 'undefined') return;

  try {
    // Dynamic imports via string variables to prevent Vite from resolving
    // firebase packages at build time when they're not installed.
    const firebaseAppModule = 'firebase/app';
    const firebaseAnalyticsModule = 'firebase/analytics';
    const { initializeApp } = await import(/* @vite-ignore */ firebaseAppModule);
    const { getAnalytics, isSupported } = await import(/* @vite-ignore */ firebaseAnalyticsModule);

    const supported = await isSupported();
    if (!supported) {
      logger.debug('[Firebase] Analytics not supported in this environment');
      return;
    }

    _app = initializeApp(firebaseConfig);
    _analytics = getAnalytics(_app);
    logger.debug('[Firebase] Analytics inicializado');
  } catch (error) {
    logger.debug('[Firebase] Error inicializando analytics:', error);
  }
}

/**
 * Log event to Firebase Analytics (web). On native, use the Capacitor plugin directly.
 */
export async function logFirebaseEvent(
  eventName: string,
  params?: Record<string, unknown>
): Promise<void> {
  try {
    if (_analytics) {
      // Web
      const mod = 'firebase/analytics';
      const { logEvent } = await import(/* @vite-ignore */ mod);
      logEvent(_analytics, eventName, params);
    } else {
      // Native — try Capacitor plugin
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        try {
          const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
          await FirebaseAnalytics.logEvent({
            name: eventName,
            params: params as Record<string, string>,
          });
        } catch {
          // Plugin not available
        }
      }
    }
  } catch {
    // Best effort — never crash on analytics
  }
}

/**
 * Set Firebase user ID for cross-session tracking.
 */
export async function setFirebaseUserId(userId: string): Promise<void> {
  try {
    if (_analytics) {
      const mod = 'firebase/analytics';
      const { setUserId } = await import(/* @vite-ignore */ mod);
      setUserId(_analytics, userId);
    } else {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        try {
          const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
          await FirebaseAnalytics.setUserId({ userId });
        } catch {
          // Plugin not available
        }
      }
    }
  } catch {
    // Best effort
  }
}

export async function setFirebaseScreenName(screenName: string): Promise<void> {
  try {
    if (_analytics) {
      const mod = 'firebase/analytics';
      const { logEvent } = await import(/* @vite-ignore */ mod);
      logEvent(_analytics, 'screen_view' as string, { firebase_screen: screenName });
    } else {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        try {
          const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
          await FirebaseAnalytics.setCurrentScreen({ screenName });
        } catch {
          // Plugin not available
        }
      }
    }
  } catch {
    // Best effort
  }
}
