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

// Sprint 1 P1 SEC-013 (2026-04-28): scrub PII antes de enviar a Sentry US.
// Cumplimiento Ley 19.628: email, RUT, telefono y direccion son datos
// personales y no deben salir del territorio sin justificacion. Sentry usa
// nuestro proyecto en infra US, asi que aplicamos un beforeSend que limpia
// los campos sensibles. Si dejamos algo, los logs siguen siendo utiles
// (URL, stack, event_id) sin exponer al usuario.
const PII_KEY_PATTERNS = [
  /email/i,
  /rut/i,
  /phone/i,
  /tel(efono)?/i,
  /address/i,
  /direccion/i,
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
];
// Patrones de valor que se reemplazan in-place por '[scrubbed]':
//   - emails: foo@bar.com
//   - RUT chilenos: 12.345.678-9 / 12345678-K
//   - telefonos chilenos +56 9 XXXX XXXX o 9 XXXX XXXX
//   - JWT tokens (3 grupos base64 separados por punto)
const PII_VALUE_PATTERNS: Array<[RegExp, string]> = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email-scrubbed]'],
  [/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g, '[rut-scrubbed]'],
  [/\+?56[\s-]?9[\s-]?\d{4}[\s-]?\d{4}/g, '[phone-scrubbed]'],
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g, '[jwt-scrubbed]'],
];

function scrubString(s: string): string {
  let out = s;
  for (const [pattern, replacement] of PII_VALUE_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function isPIIKey(key: string): boolean {
  return PII_KEY_PATTERNS.some((p) => p.test(key));
}

// Recursivamente limpia un objeto Sentry. Conservador: si una key matchea PII
// la marca como '[scrubbed]'; si el valor es string lo pasa por scrubString.
// No mutar input — devolvemos copia limpia.
function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[max-depth]';
  if (value == null) return value;
  if (typeof value === 'string') return scrubString(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isPIIKey(k)) {
      out[k] = '[scrubbed]';
    } else {
      out[k] = scrubValue(v, depth + 1);
    }
  }
  return out;
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
      // Scrub PII antes de enviar a Sentry US (Sprint 1 P1 SEC-013).
      beforeSend(event) {
        try {
          if (event.request) event.request = scrubValue(event.request) as typeof event.request;
          if (event.user) {
            // Mantener user.id (identificador interno) pero limpiar email/username.
            event.user = {
              id: event.user.id,
              ip_address: undefined,
            };
          }
          if (event.extra) event.extra = scrubValue(event.extra) as typeof event.extra;
          if (event.contexts) event.contexts = scrubValue(event.contexts) as typeof event.contexts;
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((b) => scrubValue(b) as typeof b);
          }
          if (event.message) event.message = scrubString(event.message);
          if (event.exception?.values) {
            event.exception.values = event.exception.values.map((v) => ({
              ...v,
              value: v.value ? scrubString(v.value) : v.value,
            }));
          }
        } catch {
          // Si el scrub falla, mejor descartar el evento que enviarlo crudo.
          return null;
        }
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        // Limpia breadcrumbs sincronos (navegacion, console, fetch). Los
        // valores pueden contener URLs con tokens en query string.
        try {
          if (breadcrumb.message) breadcrumb.message = scrubString(breadcrumb.message);
          if (breadcrumb.data)
            breadcrumb.data = scrubValue(breadcrumb.data) as typeof breadcrumb.data;
        } catch {
          return null;
        }
        return breadcrumb;
      },
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
