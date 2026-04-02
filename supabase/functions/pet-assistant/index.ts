import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Parse input
    const body = await req.json();
    const { question, pet_id } = body;

    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Question is required (min 3 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pet_id || typeof pet_id !== "string") {
      return new Response(JSON.stringify({ error: "pet_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: 20 questions per day
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase
      .from("ai_usage")
      .select("calls_today, last_reset_date")
      .eq("user_id", userId)
      .eq("skill_name", "pet-assistant")
      .maybeSingle();

    let callsToday = 0;
    if (usage) {
      callsToday = usage.last_reset_date === today ? usage.calls_today : 0;
    }

    if (callsToday >= 20) {
      return new Response(JSON.stringify({
        error: "Límite diario alcanzado (20 consultas). Renueva mañana.",
        rate_limited: true,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch pet data
    const { data: pet, error: petError } = await supabase
      .from("pets")
      .select("*")
      .eq("id", pet_id)
      .eq("owner_id", userId)
      .maybeSingle();

    if (petError || !pet) {
      return new Response(JSON.stringify({ error: "Pet not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch medical records (last 10)
    const { data: records } = await supabase
      .from("medical_records")
      .select("record_type, title, description, date, veterinarian_name, clinic_name, notes")
      .eq("pet_id", pet_id)
      .order("date", { ascending: false })
      .limit(10);

    // Fetch reminders
    const { data: reminders } = await supabase
      .from("pet_reminders")
      .select("type, title, due_date, is_completed")
      .eq("pet_id", pet_id)
      .eq("is_completed", false)
      .order("due_date", { ascending: true })
      .limit(5);

    // Build context
    const petAge = pet.birth_date
      ? `${Math.floor((Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años`
      : "edad desconocida";

    const petContext = `
DATOS DE LA MASCOTA:
- Nombre: ${pet.name}
- Especie: ${pet.species}
- Raza: ${pet.breed || "no especificada"}
- Edad: ${petAge}
- Peso: ${pet.weight ? pet.weight + " kg" : "no registrado"}
- Género: ${pet.gender || "no especificado"}
- Esterilizado: ${pet.neutered ? "Sí" : "No"}
- Alergias alimentarias: ${pet.allergies_food || "ninguna conocida"}
- Alergias a medicamentos: ${pet.allergies_medication || "ninguna conocida"}
- Alergias ambientales: ${pet.allergies_environmental || "ninguna conocida"}
- Condiciones crónicas: ${pet.chronic_conditions_detail || "ninguna"}
- Medicamentos actuales: ${pet.current_medications || "ninguno"}
- Tipo de dieta: ${pet.diet_type || "no especificada"}
- Nivel de actividad: ${pet.activity_level || "no especificado"}
- Notas de comportamiento: ${pet.behavior_notes || "ninguna"}
- Microchip: ${pet.microchip_number || "no registrado"}

HISTORIAL MÉDICO RECIENTE (últimos 10 registros):
${records?.length ? records.map(r => `- [${r.date}] ${r.record_type}: ${r.title}${r.description ? ` - ${r.description}` : ""}${r.veterinarian_name ? ` (Dr. ${r.veterinarian_name})` : ""}`).join("\n") : "Sin registros médicos."}

RECORDATORIOS PENDIENTES:
${reminders?.length ? reminders.map(r => `- ${r.type}: ${r.title} (vence ${r.due_date})`).join("\n") : "Sin recordatorios pendientes."}
`.trim();

    const systemPrompt = `Eres un asistente veterinario de Paw Friend, una app chilena de cuidado de mascotas. Tienes acceso a la ficha clínica completa de la mascota del usuario.

${petContext}

REGLAS ESTRICTAS:
1. Responde SIEMPRE basándote en los datos reales de la mascota. Usa su nombre.
2. Si la pregunta es sobre síntomas graves (vómitos con sangre, dificultad respiratoria, convulsiones, intoxicación), responde con URGENCIA y recomienda ir al veterinario inmediatamente.
3. Si hay recordatorios vencidos relevantes a la pregunta, menciónalos.
4. Si hay alergias conocidas y la pregunta es sobre alimentación o medicamentos, adviértelo.
5. NUNCA diagnostiques. Puedes sugerir posibles causas pero siempre indica que un veterinario debe confirmar.
6. Responde en español de Chile, tono cálido y profesional.
7. Sé conciso: 2-4 párrafos máximo.
8. Si no tienes suficiente información para responder bien, dilo honestamente.

FORMATO DE RESPUESTA (OBLIGATORIO - solo JSON):
{
  "respuesta": "tu respuesta completa aquí",
  "nivel_urgencia": "bajo" | "medio" | "alto",
  "requiere_veterinario": true | false,
  "recordatorios_relevantes": ["recordatorio 1", "recordatorio 2"] o [],
  "sugerencias_accion": ["acción 1", "acción 2", "acción 3"]
}`;

    // Call Claude
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let claudeResponse;
    try {
      claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20241022",
          max_tokens: 500,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: "user", content: question.trim() }],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (claudeResponse.status === 429) {
      return new Response(JSON.stringify({ error: "AI service rate limited. Try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!claudeResponse.ok) {
      console.error("Claude API error:", claudeResponse.status);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content?.[0]?.text ?? "";

    // Parse response
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed || !parsed.respuesta) {
      parsed = {
        respuesta: responseText || "No pude procesar tu consulta. Intenta reformular la pregunta.",
        nivel_urgencia: "bajo",
        requiere_veterinario: false,
        recordatorios_relevantes: [],
        sugerencias_accion: [],
      };
    }

    // Update rate limit
    if (usage) {
      await supabase
        .from("ai_usage")
        .update({
          calls_today: callsToday + 1,
          calls_total: (usage.calls_total || 0) + 1,
          last_reset_date: today,
          last_called_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("skill_name", "pet-assistant");
    } else {
      await supabase.from("ai_usage").insert({
        user_id: userId,
        skill_name: "pet-assistant",
        calls_today: 1,
        calls_total: 1,
        last_reset_date: today,
        last_called_at: new Date().toISOString(),
      });
    }

    const remaining = 20 - callsToday - 1;

    return new Response(JSON.stringify({
      ...parsed,
      pet_name: pet.name,
      remaining,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("pet-assistant error:", error);
    return new Response(JSON.stringify({
      error: "An internal error occurred. Please try again later.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
