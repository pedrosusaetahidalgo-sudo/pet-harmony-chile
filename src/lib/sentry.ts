// Lazy-loaded Sentry — keeps ~80 kB out of the critical render path.
// The actual @sentry/react import happens asynchronously after first paint.

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

export function initSentry() {
  if (import.meta.env.PROD) {
    import('@sentry/react').then((mod) => {
      mod.init({
        dsn: import.meta.env.VITE_SENTRY_DSN || '',
        environment: 'production',
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.5,
      });
      _sentry = mod;
      flush();
    });
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
