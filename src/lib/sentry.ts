// Lazy-loaded Sentry — keeps ~458 kB out of the critical render path.
// The actual @sentry/react import ahora se pospone a requestIdleCallback
// (o 3s) para no competir con TTI mobile (INIT-12 Plan 90d).
//
// Bundle reduction plan (pendiente, requiere npm install de Pedro):
//   Ver docs-raiz/operacion/SENTRY_BUNDLE_OPTIMIZATION.md para migracion
//   futura a @sentry/browser (ahorro ~200-300 kB adicionales).

let _sentry: typeof import('@sentry/react') | null = null;

/**
 * Queue of calls made before the SDK finishes loading.
 * Once Sentry is ready we flush them all.
 */
const _queue: Array<{ method: 'captureException'; args: unknown[] }> = [];

function flush() {
  if (!_sentry) return;
  for (const item of _queue) {
    if (item.method === 'captureException') {
      (_sentry.captureException as (...a: unknown[]) => void)(...item.args);
    }
  }
  _queue.length = 0;
}

function loadSentry() {
  if (_sentry) return;
  import('@sentry/react').then((mod) => {
    mod.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: 'production',
      tracesSampleRate: 0.1,
      // Performance budget (I.4 auditoría top-tier 2026-04-20):
      // browserTracingIntegration activo con sample rate conservador.
      // Captura automáticamente navegación SPA + fetch/XHR con timing.
      // Usar Sentry Dashboard → Performance para alertas p95 > 3s.
      integrations: [mod.browserTracingIntegration({ enableInp: true })],
      tracePropagationTargets: [
        'https://gwailbjlvevkhwcrovfd.supabase.co',
        'https://pawfriend.cl',
        /^\/(?!paw-friend-assets-v2)/,
      ],
      replaysSessionSampleRate: 0,
      // Bajado de 0.5 a 0.1 (INIT-12): menos replays por error, menos
      // egress + menos riesgo de llegar a tier pago de Sentry.
      replaysOnErrorSampleRate: 0.1,
    });
    _sentry = mod;
    flush();
  });
}

export function initSentry() {
  if (!import.meta.env.PROD) return;

  // Diferir la carga de Sentry hasta que el browser este idle o hayan
  // pasado 3s. Protege TTI del primer paint mobile.
  type IdleCallbackWindow = typeof window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  const w = window as IdleCallbackWindow;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(() => loadSentry(), { timeout: 3000 });
  } else {
    setTimeout(loadSentry, 3000);
  }
}

/**
 * Lightweight proxy so consumers can call `Sentry.captureException()`
 * without a synchronous import of @sentry/react.
 */
export const Sentry = {
  captureException(...args: unknown[]) {
    if (_sentry) {
      (_sentry.captureException as (...a: unknown[]) => void)(...args);
    } else {
      _queue.push({ method: 'captureException', args });
    }
  },
};
