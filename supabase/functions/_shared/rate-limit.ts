import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type QuotaResult =
  | { allowed: true; remaining: number; resetInSeconds: number }
  | { allowed: false; remaining: 0; resetInSeconds: number };

/**
 * Incrementa atómicamente el contador de requests del usuario y devuelve
 * si está dentro del límite. Usa service_role para bypassear RLS.
 */
export async function checkAiQuota(
  userId: string,
  opts: { limit?: number; windowSeconds?: number } = {}
): Promise<QuotaResult> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabaseAdmin.rpc("check_and_increment_ai_quota", {
    p_user_id: userId,
    p_limit: opts.limit ?? 30,
    p_window_seconds: opts.windowSeconds ?? 3600,
  });

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    // Si la RPC falla, fail-OPEN (permitir) para no bloquear app por bug de DB.
    // Pero loguear el error para visibility.
    console.error("[rate-limit] RPC failed, allowing request:", error);
    return { allowed: true, remaining: 0, resetInSeconds: 0 };
  }

  const row = data[0] as { allowed: boolean; remaining: number; reset_in_seconds: number };
  if (row.allowed) {
    return { allowed: true, remaining: row.remaining, resetInSeconds: row.reset_in_seconds };
  }
  return { allowed: false, remaining: 0, resetInSeconds: row.reset_in_seconds };
}

export function rateLimitResponse(quota: QuotaResult, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      error: "Has alcanzado el límite de solicitudes a la IA. Intentá de nuevo más tarde.",
      reset_in_seconds: quota.resetInSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(quota.resetInSeconds),
      },
    }
  );
}
