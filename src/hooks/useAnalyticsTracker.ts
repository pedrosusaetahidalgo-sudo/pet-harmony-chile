import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Session ID persists across page navigations but not tab refreshes
const SESSION_ID =
  sessionStorage.getItem('pf_session') ||
  (() => {
    const id = crypto.randomUUID();
    sessionStorage.setItem('pf_session', id);
    return id;
  })();

const getDevice = () => {
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
};

// Batch queue to avoid too many inserts
let eventQueue: Array<Record<string, unknown>> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('analytics_events') as any).insert(batch);
  } catch {
    // Best effort — don't crash on analytics failure
  }
}

function queueEvent(event: Record<string, unknown>) {
  eventQueue.push(event);

  // Flush every 5 seconds or when batch hits 10 events
  if (eventQueue.length >= 10) {
    flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushEvents();
    }, 5000);
  }
}

/**
 * Tracks page views, dwell time, and provides a trackEvent function.
 * Call once in AppLayout. Automatically tracks route changes.
 */
export function useAnalyticsTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const userId = user?.id;
  const pageEnteredAt = useRef<number>(Date.now());
  const lastPath = useRef<string>('');

  // Track page view on route change
  useEffect(() => {
    const currentPath = location.pathname;

    // Record dwell time for previous page
    if (lastPath.current && lastPath.current !== currentPath) {
      const dwellMs = Date.now() - pageEnteredAt.current;
      if (dwellMs > 1000) {
        // Ignore < 1s (redirects)
        queueEvent({
          event_type: 'page_leave',
          event_name: lastPath.current,
          user_id: userId || null,
          session_id: SESSION_ID,
          duration_ms: dwellMs,
          metadata: { dwell_time_ms: dwellMs },
        });
      }
    }

    // Record new page view
    queueEvent({
      event_type: 'page_view',
      event_name: currentPath,
      user_id: userId || null,
      session_id: SESSION_ID,
      metadata: {
        referrer: document.referrer || null,
        device: getDevice(),
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
    });

    lastPath.current = currentPath;
    pageEnteredAt.current = Date.now();
  }, [location.pathname, userId]);

  // Track session start
  useEffect(() => {
    const alreadyTracked = sessionStorage.getItem('pf_session_tracked');
    if (!alreadyTracked) {
      sessionStorage.setItem('pf_session_tracked', '1');
      queueEvent({
        event_type: 'session_start',
        event_name: 'session',
        user_id: userId || null,
        session_id: SESSION_ID,
        metadata: {
          device: getDevice(),
          browser: navigator.userAgent.slice(0, 200),
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
    }
  }, [userId]);

  // Flush on page unload
  useEffect(() => {
    const onUnload = () => {
      // Record final dwell time
      if (lastPath.current) {
        const dwellMs = Date.now() - pageEnteredAt.current;
        eventQueue.push({
          event_type: 'page_leave',
          event_name: lastPath.current,
          user_id: userId || null,
          session_id: SESSION_ID,
          duration_ms: dwellMs,
          metadata: { dwell_time_ms: dwellMs },
        });
      }

      eventQueue.push({
        event_type: 'session_end',
        event_name: 'session',
        user_id: userId || null,
        session_id: SESSION_ID,
      });

      // Use sendBeacon for reliable delivery on page close
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL || 'https://gwailbjlvevkhwcrovfd.supabase.co';
      const url = `${supabaseUrl}/rest/v1/analytics_events`;
      const body = JSON.stringify(eventQueue);
      navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }));
    };

    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [userId]);

  // Manual track function for feature usage, button clicks, etc.
  const trackEvent = useCallback(
    (
      eventType: 'feature_use' | 'button_click',
      eventName: string,
      metadata?: Record<string, unknown>
    ) => {
      queueEvent({
        event_type: eventType,
        event_name: eventName,
        user_id: userId || null,
        session_id: SESSION_ID,
        metadata: metadata || {},
      });
    },
    [userId]
  );

  return { trackEvent, sessionId: SESSION_ID };
}
