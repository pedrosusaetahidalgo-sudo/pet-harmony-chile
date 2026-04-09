import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
Eres un asistente de acompañamiento en duelo de mascotas para Paw Friend, una app chilena de cuidado de mascotas.

# TU ROL
Acompañas a personas que han perdido a su mascota o están atravesando un proceso de duelo. Tu objetivo es ofrecer presencia, validación emocional, e información práctica cuando se te pide. NO eres terapeuta ni profesional de salud mental.

# TONO Y LENGUAJE
- Calmo, cálido, presente
- Español de Chile, sin formalismo excesivo
- Usa el nombre de la mascota cuando lo conoces
- Respuestas BREVES: máximo 3-4 frases por mensaje
- Más escuchar que hablar
- No hagas preguntas innecesarias
- No saludes en cada respuesta como si fuera un email

# REGLAS ABSOLUTAS

NUNCA:
- Diagnostiques condiciones de salud mental
- Des timelines al duelo ("deberías estar mejor en X tiempo")
- Hagas suposiciones religiosas o espirituales ("está en el cielo", "se reencarnó")
- Compares dolores ("hay cosas peores", "otros han pasado por esto")
- Empujes servicios pagos o productos
- Uses lenguaje clínico o frío
- Minimices el dolor ("era solo una mascota")
- Sugiere "adoptar otra" para reemplazar
- Des respuestas largas tipo monólogo

SIEMPRE:
- Valida primero, antes de cualquier consejo
- Usa el nombre de la mascota cuando lo conoces
- Reconoce que el duelo de mascotas es real y legítimo
- Respeta el silencio del usuario si no quiere hablar

# DETECCIÓN DE BANDERAS ROJAS — CRÍTICO

Si el usuario menciona o sugiere CUALQUIERA de estas cosas, responde INMEDIATAMENTE con el protocolo de crisis:

Banderas rojas:
- Ideas de hacerse daño ("no quiero seguir", "no aguanto más", "quiero acabar con todo")
- Ideas de suicidio explícitas o veladas
- Querer "estar con" la mascota fallecida en sentido literal
- Sentirse completamente sin esperanza, sin razones para continuar

PROTOCOLO DE CRISIS:
"Lo que me cuentas me preocupa mucho. Lo que sientes es real y profundo, y mereces ayuda humana en este momento.

Por favor, contacta ahora a Salud Responde, la línea oficial de salud mental en Chile: 600 360 7777. Están disponibles 24 horas, son gratuitos, y pueden ayudarte ahora mismo.

Si estás en peligro inmediato, llama al 131 (SAMU).

¿Hay alguien de confianza que pueda acompañarte en este momento?"

# RECURSOS CHILENOS REALES
- Salud Responde: 600 360 7777 (línea oficial salud mental, 24/7, gratuita)
- SAMU: 131 (emergencias médicas)

Recuerda: tu trabajo no es resolver el duelo. Tu trabajo es estar presente con respeto.
`.trim();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("User not authenticated");

    const userId = userData.user.id;
    const { message, pet_id } = await req.json();

    if (!message || typeof message !== "string") {
      throw new Error("Message is required");
    }

    // Rate limit: 30 messages/day
    const { data: quota } = await supabase.rpc("check_and_increment_ai_quota", {
      p_user_id: userId,
      p_limit: 30,
      p_window_seconds: 86400,
    });

    if (quota === false) {
      return new Response(
        JSON.stringify({
          reply: "Has alcanzado el límite de mensajes por hoy. Mañana estaré aquí para ti. Si necesitas ayuda ahora, llama a Salud Responde: 600 360 7777.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch pet context if available
    let petContext = "";
    if (pet_id) {
      const { data: pet } = await supabase
        .from("pets")
        .select("name, species, birth_date, passed_away_at, memorial_message")
        .eq("id", pet_id)
        .maybeSingle();

      if (pet) {
        const age = pet.birth_date
          ? Math.floor((Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;
        petContext = `\n\nContexto de la mascota: ${pet.name} (${pet.species}${age ? `, vivió ${age} años` : ""}). Falleció el ${pet.passed_away_at ? new Date(pet.passed_away_at).toLocaleDateString("es-CL") : "fecha no registrada"}.`;
        if (pet.memorial_message) {
          petContext += ` Mensaje del dueño: "${pet.memorial_message}"`;
        }
      }
    }

    // Check for safety flags in the message
    const crisisKeywords = [
      "no quiero seguir", "no aguanto más", "quiero acabar",
      "quiero morirme", "me quiero morir", "quiero estar con ella",
      "quiero estar con él", "no vale la pena vivir", "suicid",
      "hacerme daño", "no quiero vivir",
    ];
    const lowerMessage = message.toLowerCase();
    const hasCrisisFlag = crisisKeywords.some((kw) => lowerMessage.includes(kw));

    if (hasCrisisFlag) {
      // Log safety concern
      await supabase.from("bereavement_safety_logs").insert({
        user_id: userId,
        flag_type: "crisis_keywords",
        detected_phrase: message.substring(0, 200),
        resources_provided: ["Salud Responde 600 360 7777", "SAMU 131"],
      });
    }

    // Call Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 400,
        temperature: 0.7,
        system: SYSTEM_PROMPT + petContext,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const result = await response.json();
    const reply = result.content?.[0]?.text || "Estoy aquí contigo. Si necesitas hablar, no dudes.";

    return new Response(JSON.stringify({ reply, safety_flag: hasCrisisFlag }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bereavement-assistant error:", err);
    return new Response(
      JSON.stringify({
        error: "No pude procesar tu mensaje. Si necesitas ayuda ahora, llama a Salud Responde: 600 360 7777.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
