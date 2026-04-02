import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
  supabase: any,
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

export async function callClaude(options: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  images?: Array<{ type: "base64"; media_type: string; data: string }>;
}): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");

  const content: any[] = [];
  if (options.images?.length) {
    for (const img of options.images) {
      content.push({ type: "image", source: img });
    }
  }
  content.push({ type: "text", text: options.userMessage });

  const body = {
    model: "claude-sonnet-4-5-20241022",
    max_tokens: options.maxTokens ?? 1000,
    temperature: options.temperature ?? 0.3,
    system: options.systemPrompt,
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
