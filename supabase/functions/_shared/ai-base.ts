import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://pawfriend.cl",
  "http://localhost:8080",
  "http://localhost:5173",
];

/** Static CORS headers for production (backward-compatible export). */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Dynamic CORS based on request Origin. Use this in new code. */
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function jsonResponse(data: unknown, status = 200, req?: Request) {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 500, req?: Request) {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export function createSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );
}

export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("AUTH_REQUIRED");

  const supabase = createSupabaseClient(authHeader);
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("AUTH_INVALID");

  return { user: data.user, supabase };
}

export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  skillName: string,
  maxPerDay: number
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("ai_usage")
    .select("calls_today, last_reset_date")
    .eq("user_id", userId)
    .eq("skill_name", skillName)
    .maybeSingle();

  if (!data) {
    // First use ever
    await supabase.from("ai_usage").insert({
      user_id: userId,
      skill_name: skillName,
      calls_today: 1,
      calls_total: 1,
      last_reset_date: today,
      last_called_at: new Date().toISOString(),
    });
    return { allowed: true, remaining: maxPerDay - 1 };
  }

  // Reset if new day
  let callsToday = data.calls_today;
  if (data.last_reset_date !== today) {
    callsToday = 0;
  }

  if (callsToday >= maxPerDay) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from("ai_usage")
    .update({
      calls_today: callsToday + 1,
      calls_total: (data.calls_total || 0) + 1,
      last_reset_date: today,
      last_called_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("skill_name", skillName);

  return { allowed: true, remaining: maxPerDay - callsToday - 1 };
}

/**
 * Sanitiza input del usuario para prevenir prompt injection.
 * Elimina patrones comunes de inyección sin alterar preguntas legítimas.
 */
export function sanitizeForPrompt(input: string): string {
  let s = input.trim();
  // Truncar a 500 chars (suficiente para una pregunta)
  s = s.slice(0, 500);
  // Eliminar patrones de prompt injection comunes
  s = s.replace(/(?:ignore|olvida|ignora|forget)\s+(?:previous|anterior|all|todo|las)\s+(?:instructions?|instrucciones?)/gi, "[filtrado]");
  s = s.replace(/(?:system|sistema)\s*(?:prompt|mensaje)/gi, "[filtrado]");
  s = s.replace(/(?:you are now|ahora eres|actúa como|act as|pretend)/gi, "[filtrado]");
  s = s.replace(/```[\s\S]*?```/g, "[código removido]");
  return s;
}

export async function callClaude(options: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  images?: Array<{ type: "base64"; media_type: string; data: string }>;
}): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [];
  if (options.images?.length) {
    for (const img of options.images) {
      content.push({ type: "image", source: img });
    }
  }
  content.push({ type: "text", text: options.userMessage });

  const body = {
    model: options.model ?? "claude-sonnet-4-5-20250514",
    max_tokens: options.maxTokens ?? 600,
    temperature: options.temperature ?? 0.3,
    system: [{ type: "text", text: options.systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (!response.ok) throw new Error(`CLAUDE_ERROR_${response.status}`);

    const data = await response.json();

    // Token usage logging for cost monitoring
    if (data.usage) {
      console.log(JSON.stringify({
        event: 'ai_token_usage',
        model: body.model,
        input_tokens: data.usage.input_tokens ?? 0,
        output_tokens: data.usage.output_tokens ?? 0,
        cache_read: data.usage.cache_read_input_tokens ?? 0,
        cache_creation: data.usage.cache_creation_input_tokens ?? 0,
      }));
    }

    return data.content?.[0]?.text ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export function parseJSON<T>(text: string, fallback: T): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const cleaned = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(cleaned.trim());
  } catch {
    return fallback;
  }
}

export function handleEdgeFunctionError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Edge function error:", message);

  if (message === "AUTH_REQUIRED") return errorResponse("Authorization required", 401);
  if (message === "AUTH_INVALID") return errorResponse("User not authenticated", 401);
  if (message === "RATE_LIMITED") return errorResponse("Límite de solicitudes excedido. Intenta más tarde.", 429);
  if (message === "AI_NOT_CONFIGURED") return errorResponse("Service configuration error", 503);
  if (message.startsWith("CLAUDE_ERROR_")) return errorResponse("AI service temporarily unavailable", 502);

  return errorResponse("An internal error occurred. Please try again later.", 500);
}

/**
 * Log edge function execution to analytics_events + system_health_log.
 * Call at the end of every edge function for telemetry.
 */
export async function logEdgeFunctionCall(options: {
  functionName: string;
  status: "success" | "error" | "timeout";
  executionTimeMs: number;
  userId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Log to system_health_log
    await supabase.from("system_health_log").insert({
      function_name: options.functionName,
      status: options.status,
      execution_time_ms: options.executionTimeMs,
      error_message: options.error || null,
      metadata: options.metadata || {},
    });

    // Log to analytics_events for usage tracking
    await supabase.from("analytics_events").insert({
      event_type: "edge_function_call",
      event_name: options.functionName,
      user_id: options.userId || null,
      duration_ms: options.executionTimeMs,
      metadata: {
        status: options.status,
        ...options.metadata,
      },
    });

    // If error, also log to error_logs
    if (options.status === "error" && options.error) {
      await supabase.from("error_logs").insert({
        source: "edge_function",
        severity: "error",
        message: `${options.functionName}: ${options.error}`,
        context: { function_name: options.functionName, ...options.metadata },
        user_id: options.userId || null,
      });
    }
  } catch {
    // Best effort — don't fail the main function on telemetry error
  }
}
