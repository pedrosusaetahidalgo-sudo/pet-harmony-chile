/**
 * Sprint 1 P1 SEC-007 (2026-04-28): autenticación de invocaciones cron.
 *
 * Contexto: 15+ edge fns están registradas con `verify_jwt = false` porque
 * pg_cron las invoca server-side via `pg_net` con service_role. Pero al
 * estar en `verify_jwt = false`, su URL pública también queda accesible a
 * cualquier atacante que conozca el slug. Algunas envían emails (Resend),
 * postean a Slack/Discord, escriben en DB con service_role — abuse vector.
 *
 * Solución: shared secret. La fn exige uno de estos headers:
 *   - `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
 *     (lo que pg_cron + supabase.functions.invoke con service_role envían)
 *   - `X-Cron-Secret: <PAWFRIEND_CRON_SECRET>`
 *     (para crons externos / GitHub Actions / health checks)
 *
 * Uso típico al inicio de la fn:
 *
 *   const authError = requireCronAuth(req);
 *   if (authError) return authError;
 *
 * Notas:
 *   - Falla-cerrado: si NO hay header válido, devuelve 401.
 *   - El secret debe tener >=32 chars; recomendamos generar con
 *     `openssl rand -base64 48` y guardar en Supabase Vault como
 *     `PAWFRIEND_CRON_SECRET`.
 *   - El header se compara con tiempo constante para evitar timing attacks.
 */

const CRON_SECRET_ENV = 'PAWFRIEND_CRON_SECRET';
const SERVICE_ROLE_ENV = 'SUPABASE_SERVICE_ROLE_KEY';

/**
 * Comparación con tiempo constante. Evita filtrar el largo del secret real
 * via timing del strncmp default de JS.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Igual hacemos un loop dummy para no leak el length por timing.
    let dummy = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      dummy |= 1;
    }
    void dummy;
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function isValidSecret(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected || expected.length < 16) return false;
  return timingSafeEqual(provided, expected);
}

/**
 * Verifica que el caller sea un cron interno autorizado.
 * Devuelve `null` si OK, o una `Response` 401 si falta/no coincide el secret.
 *
 * Acepta dos credenciales (en orden de preferencia):
 *   1. `X-Cron-Secret: <PAWFRIEND_CRON_SECRET>`
 *   2. `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
 */
export function requireCronAuth(req: Request): Response | null {
  const cronSecretHeader = req.headers.get('X-Cron-Secret');
  const cronSecretEnv = Deno.env.get(CRON_SECRET_ENV);
  if (cronSecretEnv && isValidSecret(cronSecretHeader, cronSecretEnv)) {
    return null;
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    const serviceRoleKey = Deno.env.get(SERVICE_ROLE_ENV);
    if (serviceRoleKey && isValidSecret(token, serviceRoleKey)) {
      return null;
    }
  }

  return new Response(JSON.stringify({ error: 'cron auth required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
