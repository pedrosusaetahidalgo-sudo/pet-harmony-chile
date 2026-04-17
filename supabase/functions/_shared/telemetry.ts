// ==========================================================================
// Telemetría compartida para edge functions.
//
// Uso:
//   import { withTelemetry } from '../_shared/telemetry.ts';
//   serve(withTelemetry('my-function', async (req) => {
//     // ... tu handler normal ...
//   }));
//
// El wrapper mide tiempo de ejecución, detecta status (success/error/timeout),
// y escribe a system_health_log + analytics_events + error_logs. Todo "best
// effort": si la telemetría falla, NO rompe la función (try/catch interno).
//
// Extrae el userId del header Authorization si está presente (mejor esfuerzo).
// ==========================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type TelemetryStatus = "success" | "error" | "timeout";

interface LogEdgeCallOptions {
  functionName: string;
  status: TelemetryStatus;
  executionTimeMs: number;
  userId?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Escribe una entrada de telemetría a las 3 tablas (fire-and-forget).
 * Si alguna falla, no lanza — solo se pierde esa linea de telemetria.
 */
export async function logEdgeFunctionCall(opts: LogEdgeCallOptions): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !key) return;

    const supabase = createClient(url, key);

    // 1) system_health_log — monitoreo de edge functions
    await supabase.from("system_health_log").insert({
      function_name: opts.functionName,
      status: opts.status,
      execution_time_ms: opts.executionTimeMs,
      error_message: opts.error ?? null,
      metadata: opts.metadata ?? {},
    });

    // 2) analytics_events — tracking genérico de invocaciones
    await supabase.from("analytics_events").insert({
      event_type: "edge_function_call",
      event_name: opts.functionName,
      user_id: opts.userId ?? null,
      duration_ms: opts.executionTimeMs,
      metadata: {
        status: opts.status,
        ...(opts.metadata ?? {}),
      },
    });

    // 3) error_logs — solo cuando hay falla REAL del servidor.
    //    4xx (rate limit, input invalido del cliente) NO son fallas: los filtramos.
    const httpStatus = (opts.metadata as Record<string, unknown> | undefined)?.http_status;
    const is4xx = typeof httpStatus === "number" && httpStatus >= 400 && httpStatus < 500;
    if (opts.status === "error" && opts.error && !is4xx) {
      await supabase.from("error_logs").insert({
        source: "edge_function",
        severity: "error",
        message: `${opts.functionName}: ${opts.error}`.slice(0, 2000),
        context: {
          function_name: opts.functionName,
          ...(opts.metadata ?? {}),
        },
        user_id: opts.userId ?? null,
      });
    }
  } catch {
    // Best effort — la telemetría nunca rompe la función.
  }
}

/**
 * Extrae user_id desde el header Authorization si existe (Supabase JWT).
 * No valida la firma — solo parsea el payload base64 para obtener el sub.
 * Mejor esfuerzo: retorna null si cualquier paso falla.
 */
function tryExtractUserId(req: Request): string | null {
  try {
    const auth = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Decodifica el payload (base64url → JSON)
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(
      parts[1].length + ((4 - (parts[1].length % 4)) % 4),
      "="
    );
    const json = JSON.parse(atob(padded));
    return typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}

/**
 * Envuelve un handler de edge function para registrar telemetría automáticamente.
 *
 * - Si el handler retorna una Response 2xx → status 'success'.
 * - Si retorna una Response 4xx/5xx → status 'error' con el body como mensaje.
 * - Si el handler lanza → status 'error' con el mensaje de la excepción.
 * - Si supera el timeout configurado → status 'timeout'.
 *
 * Nunca modifica la Response retornada — telemetría va en paralelo.
 */
export function withTelemetry(
  functionName: string,
  handler: (req: Request) => Promise<Response>,
  options: { timeoutMs?: number } = {}
): (req: Request) => Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 60_000;

  return async (req: Request): Promise<Response> => {
    // OPTIONS (CORS preflight) no se loguea — es ruido para el gateway.
    if (req.method === "OPTIONS") return handler(req);

    const t0 = performance.now();
    const userId = tryExtractUserId(req);
    let status: TelemetryStatus = "success";
    let errorMsg: string | null = null;
    let statusCode: number | null = null;
    let response: Response;

    try {
      // Race entre handler y timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TELEMETRY_TIMEOUT")), timeoutMs)
      );
      response = await Promise.race([handler(req), timeoutPromise]);
      statusCode = response.status;
      if (statusCode >= 400) {
        status = "error";
        errorMsg = `HTTP ${statusCode}`;
        // Intenta extraer el mensaje real del body JSON (sin consumir la Response original)
        try {
          const clone = response.clone();
          const contentType = clone.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const body = await clone.json();
            const detail = body?.error ?? body?.message ?? body?.detail;
            if (typeof detail === "string" && detail.trim()) {
              errorMsg = `HTTP ${statusCode}: ${detail.slice(0, 300)}`;
            }
          }
        } catch {
          // No pasa nada si falla el parse — mantiene el HTTP NNN original
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "TELEMETRY_TIMEOUT") {
        status = "timeout";
        errorMsg = `Exceeded ${timeoutMs}ms`;
      } else {
        status = "error";
        errorMsg = message.slice(0, 500);
      }
      // Respuesta de fallback si el handler lanzó (no gatea al usuario final
      // en un 500 si el handler falló — mantenemos el comportamiento original
      // propagando la excepción al runtime de Deno tras loguear).
      const executionTimeMs = Math.round(performance.now() - t0);
      // Log antes de re-throw
      logEdgeFunctionCall({
        functionName,
        status,
        executionTimeMs,
        userId,
        error: errorMsg,
        metadata: { http_method: req.method },
      });
      throw err;
    }

    const executionTimeMs = Math.round(performance.now() - t0);
    // Fire-and-forget: no esperamos a que termine el log para responder al cliente.
    logEdgeFunctionCall({
      functionName,
      status,
      executionTimeMs,
      userId,
      error: errorMsg,
      metadata: {
        http_method: req.method,
        http_status: statusCode,
      },
    });

    return response;
  };
}
