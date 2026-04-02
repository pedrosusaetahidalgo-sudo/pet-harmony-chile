import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { breed, species } = await req.json();

    if (!breed || typeof breed !== "string" || !species || typeof species !== "string") {
      return new Response(
        JSON.stringify({ error: "Se requiere raza y especie (ambos deben ser strings)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY no está configurada");
    }

    console.log(`Generando consejos para ${species} raza ${breed}...`);

    const systemPrompt = `Eres un experto veterinario y especialista en comportamiento animal con más de 10 años de experiencia trabajando en Chile.
Tu especialidad es proporcionar consejos prácticos, cálidos, útiles y basados en evidencia sobre razas de mascotas, adaptados al contexto chileno.

CONTEXTO:
- Estás proporcionando consejos para dueños de mascotas en Chile
- Debes considerar el clima, disponibilidad de productos, y prácticas veterinarias locales
- Los consejos deben ser accionables y realistas

FORMATO DE RESPUESTA (OBLIGATORIO):
Estructura tu respuesta en secciones claramente separadas con doble salto de línea (\\n\\n) entre cada sección.
Cada sección debe seguir este formato exacto:
- Primera línea: Título con emoji (ejemplo: "🏥 Cuidados Específicos")
- Líneas siguientes: Contenido con bullet points usando "- " o "• "

SECCIONES REQUERIDAS (en este orden):
1. 🏥 Cuidados Específicos
2. 🏃 Ejercicio y Actividad
3. 🍖 Alimentación Recomendada
4. 🐕 Temperamento y Comportamiento
5. ❤️ Salud y Prevención
6. 🐾 Socialización
7. 🌡️ Adaptación al Clima de Chile

DIRECTRICES:
- Tono: Amigable, profesional, y empático
- Longitud: 3-4 puntos por sección, cada punto en 1-2 oraciones
- Precisión: Solo incluye información correcta para la raza
- Responde siempre en español de Chile`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Proporciona consejos útiles y prácticos sobre la raza "${breed}" de ${species === 'perro' ? 'perro' : species === 'gato' ? 'gato' : 'mascota'}.

IMPORTANTE:
- Si la raza "${breed}" no existe o no la conoces, indica claramente "No tengo información específica sobre esta raza" y proporciona consejos generales para ${species === 'perro' ? 'perros' : 'gatos'}
- Incluye todas las secciones requeridas en el formato especificado
- Adapta los consejos al contexto de Chile
- Sé específico sobre la raza cuando sea posible

Responde en español de Chile siguiendo exactamente el formato de secciones especificado.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al obtener consejos de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let tips = data.content?.[0]?.text;

    if (!tips || tips.trim().length === 0) {
      tips = `🏥 Cuidados Específicos
- Proporciona atención básica diaria según las necesidades de tu ${species}
- Mantén un ambiente limpio y seguro
- Establece una rutina de cuidado consistente

🏃 Ejercicio y Actividad
- Asegura actividad física adecuada según la edad y tamaño
- Proporciona estimulación mental con juguetes y actividades

🍖 Alimentación Recomendada
- Consulta con un veterinario sobre la dieta apropiada
- Proporciona alimento de calidad apropiado para la edad

🐕 Temperamento y Comportamiento
- Cada ${species} tiene su personalidad única
- Proporciona entrenamiento positivo y consistente

❤️ Salud y Prevención
- Mantén un calendario de vacunación actualizado
- Realiza chequeos veterinarios regulares

🐾 Socialización
- Socializa gradualmente desde temprana edad
- Supervisa las interacciones con otros animales

🌡️ Adaptación al Clima de Chile
- Considera las variaciones estacionales del clima
- Proporciona protección adecuada en verano e invierno`;
      console.log("Usando consejos de fallback");
    } else {
      console.log("Consejos generados exitosamente con Claude");
    }

    return new Response(
      JSON.stringify({ tips }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in breed-tips function:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar la solicitud. Por favor, intenta de nuevo más tarde." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
