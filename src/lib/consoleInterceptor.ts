// ──────────────────────────────────────────────────────────────
// Console interceptor: captura console.error explicitos
// ──────────────────────────────────────────────────────────────
// Cubre el gap donde un try/catch hace `console.error('x failed', err)`
// y el error nunca llega a error_logs (no dispara window.onerror ni
// unhandledrejection porque ya esta manejado).
//
// Reglas estrictas para evitar ruido/loops:
//   - Solo en prod (DEV imprime en consola local y ya).
//   - Throttle por mensaje (1 por minuto).
//   - Lista negra de ruido conocido (React warnings, Vite HMR, etc).
//   - Fire-and-forget con keepalive; falla silente.
//   - Nunca loguea errores que contengan "log-error" o "consoleInterceptor"
//     (corta loops potenciales).

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://gwailbjlvevkhwcrovfd.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const IGNORED_PATTERNS = [
  /lock was stolen/i,
  /^script error\.?$/i,
  /resizeobserver loop/i,
  /non-error promise rejection/i,
  /the operation was aborted/i,
  /^aborterror/i,
  /network request failed/i,
  /^warning:/i, // React dev warnings (defensivo; en prod no deberian salir)
  /\bvite:\b/i, // Vite HMR
  /\[hmr\]/i,
  /downloadable font/i, // browser font warnings
];

const THROTTLE_MS = 60_000;
const recent = new Map<string, number>();

function shouldIgnore(message: string): boolean {
  if (!message) return true;
  if (message.includes('log-error')) return true;
  if (message.includes('consoleInterceptor')) return true;
  return IGNORED_PATTERNS.some((p) => p.test(message));
}

function argsToPayload(args: unknown[]): { message: string; stack?: string } {
  // Extrae stack del primer Error que aparezca
  const errArg = args.find((a) => a instanceof Error) as Error | undefined;
  const message = args
    .map((a) => {
      if (a instanceof Error) return a.message;
      if (typeof a === 'string') return a;
      if (a === null || a === undefined) return String(a);
      try {
        return JSON.stringify(a);
      } catch {
        return '[unserializable]';
      }
    })
    .join(' ')
    .slice(0, 500);
  return { message, stack: errArg?.stack?.slice(0, 2000) };
}

export function initConsoleInterceptor(): void {
  if (typeof window === 'undefined') return;
  if (import.meta.env.DEV) return; // solo prod
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const origError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    // Siempre preservar el output original a la consola del browser
    origError(...args);

    try {
      const { message, stack } = argsToPayload(args);
      if (shouldIgnore(message)) return;

      const key = message.slice(0, 120);
      const now = Date.now();
      const last = recent.get(key) ?? 0;
      if (now - last < THROTTLE_MS) return;
      recent.set(key, now);

      void fetch(`${SUPABASE_URL}/functions/v1/log-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          source: 'console',
          severity: 'error',
          message,
          stack_trace: stack,
          context: {
            url: window.location.pathname,
            user_agent: navigator.userAgent.slice(0, 200),
          },
        }),
        keepalive: true,
      }).catch(() => {
        // Silent: no podemos reportar que no podemos reportar.
      });
    } catch {
      // Interceptor no debe romper nada jamas.
    }
  };
}
