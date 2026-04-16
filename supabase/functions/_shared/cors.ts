/**
 * Shared CORS helper for all edge functions.
 * Allows pawfriend.cl in prod + localhost for dev.
 */
const ALLOWED_ORIGINS = [
  "https://pawfriend.cl",
  "http://localhost:8080",
  "http://localhost:5173",
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function handleCorsOptions(req: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}
