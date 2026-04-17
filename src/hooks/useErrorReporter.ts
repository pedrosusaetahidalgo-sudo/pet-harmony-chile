import { useAuth } from './useAuth';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://gwailbjlvevkhwcrovfd.supabase.co';

let initialized = false;

// Ruido conocido del navegador/libs que NO debe inflar error_logs.
// Estos errores son benignos o fuera de nuestro control:
//   - "Lock was stolen..." → Supabase auth multi-tab (no rompe nada)
//   - "Script error." → 3rd party con CORS bloqueado (sin stack util)
//   - "ResizeObserver loop..." → conocido de Chrome, inofensivo
//   - "Non-Error promise rejection captured" → promesas rejectadas con valor no-Error
//   - "AbortError" / "The operation was aborted" → fetch cancelado intencionalmente
const IGNORED_MESSAGE_PATTERNS = [
  /lock was stolen/i,
  /^script error\.?$/i,
  /resizeobserver loop (limit exceeded|completed with undelivered notifications)/i,
  /non-error promise rejection captured/i,
  /the operation was aborted/i,
  /^aborterror/i,
  /network request failed/i, // usualmente offline temporal
];

function shouldIgnore(message: string): boolean {
  return IGNORED_MESSAGE_PATTERNS.some((p) => p.test(message));
}

async function sendError(payload: {
  source: string;
  severity: string;
  message: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  user_id?: string;
}) {
  if (shouldIgnore(payload.message)) return; // ruido benigno, no reportar

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await fetch(`${SUPABASE_URL}/functions/v1/log-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
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
