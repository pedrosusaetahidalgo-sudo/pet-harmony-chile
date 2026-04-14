import { useAuth } from './useAuth';
import { useCallback, useEffect } from 'react';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://gwailbjlvevkhwcrovfd.supabase.co';

let initialized = false;

async function sendError(payload: {
  source: string;
  severity: string;
  message: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  user_id?: string;
}) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best effort — don't crash on error reporting
  }
}

/**
 * Hook that sets up global error capture and provides a manual report function.
 * Call once in App.tsx or a top-level component.
 */
export function useErrorReporter() {
  const { user } = useAuth();
  const userId = user?.id;

  const reportError = useCallback(
    (
      message: string,
      extra?: { severity?: string; context?: Record<string, unknown>; stack?: string }
    ) => {
      sendError({
        source: 'frontend',
        severity: extra?.severity || 'error',
        message,
        stack_trace: extra?.stack,
        context: { url: window.location.pathname, ...extra?.context },
        user_id: userId,
      });
    },
    [userId]
  );

  useEffect(() => {
    if (initialized) return;
    initialized = true;

    // Capture unhandled errors
    const onError = (event: ErrorEvent) => {
      sendError({
        source: 'frontend',
        severity: 'error',
        message: event.message || 'Unknown error',
        stack_trace: event.error?.stack,
        context: {
          url: window.location.pathname,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        user_id: userId,
      });
    };

    // Capture unhandled promise rejections
    const onRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      sendError({
        source: 'frontend',
        severity: 'error',
        message: error?.message || String(error) || 'Unhandled promise rejection',
        stack_trace: error?.stack,
        context: { url: window.location.pathname },
        user_id: userId,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      initialized = false;
    };
  }, [userId]);

  return { reportError };
}
