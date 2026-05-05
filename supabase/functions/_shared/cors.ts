/**
 * Shared CORS helper for all edge functions.
 * Permite pawfriend.cl en prod + localhost para dev + capacitor:// /
 * https://localhost para WebView Capacitor (iOS+Android) + previews
 * Lovable (*.lovable.app, dominio efimero pero util mientras este vivo).
 *
 * Si el Origin no matchea ninguno de los permitidos, devuelve el primero
 * (pawfriend.cl) — el navegador entonces bloqueara la respuesta CORS, que
 * es el comportamiento deseado.
 */
const ALLOWED_ORIGINS_EXACT = [
  "https://pawfriend.cl",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
];

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.lovable\.app$/i,
];

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS_EXACT.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS_EXACT[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function handleCorsOptions(req: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}
