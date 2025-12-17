import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { breed, species } = await req.json();
    
    if (!breed || !species) {
      return new Response(
        JSON.stringify({ error: "Se requiere raza y especie" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
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
   - 3-4 puntos sobre cuidados diarios, aseo, y necesidades básicas específicas de la raza
2. 🏃 Ejercicio y Actividad
   - 3-4 puntos sobre necesidades de ejercicio, actividad física, y estimulación mental
3. 🍖 Alimentación Recomendada
   - 3-4 puntos sobre tipo de alimento, frecuencia, cantidad, y consideraciones especiales
4. 🐕 Temperamento y Comportamiento
   - 3-4 puntos sobre personalidad típica, comportamiento esperado, y características de la raza
5. ❤️ Salud y Prevención
   - 3-4 puntos sobre problemas de salud comunes, vacunación, y prevención de enfermedades
6. 🐾 Socialización
   - 3-4 puntos sobre cómo socializar, interacción con otros animales y personas
7. 🌡️ Adaptación al Clima de Chile
   - 3-4 puntos sobre cómo la raza se adapta al clima chileno, consideraciones estacionales

DIRECTRICES:
- Tono: Amigable, profesional, y empático
- Longitud: 3-4 puntos por sección, cada punto en 1-2 oraciones
- Precisión: Solo incluye información que estés seguro es correcta para la raza
- Si no conoces información específica sobre algún aspecto, omite ese punto en lugar de inventar
- Usa emojis moderadamente (solo en títulos de sección)
- Responde siempre en español de Chile`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Proporciona consejos útiles y prácticos sobre la raza "${breed}" de ${species === 'perro' ? 'perro' : species === 'gato' ? 'gato' : 'mascota'}. 

IMPORTANTE:
- Si la raza "${breed}" no existe o no la conoces, indica claramente "No tengo información específica sobre esta raza" y proporciona consejos generales para ${species === 'perro' ? 'perros' : 'gatos'}
- Incluye todas las secciones requeridas en el formato especificado
- Adapta los consejos al contexto de Chile (clima, productos disponibles, prácticas locales)
- Sé específico sobre la raza cuando sea posible, pero no inventes información

Responde en español de Chile siguiendo exactamente el formato de secciones especificado.` 
          }
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Fondos insuficientes. Por favor, agrega créditos a tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al obtener consejos de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let tips = data.choices?.[0]?.message?.content;

    if (!tips || tips.trim().length === 0) {
      // Fallback: consejos generales
      tips = `🏥 Cuidados Específicos
- Proporciona atención básica diaria según las necesidades de tu ${species}
- Mantén un ambiente limpio y seguro
- Establece una rutina de cuidado consistente

🏃 Ejercicio y Actividad
- Asegura actividad física adecuada según la edad y tamaño
- Proporciona estimulación mental con juguetes y actividades
- Considera las necesidades específicas de la raza

🍖 Alimentación Recomendada
- Consulta con un veterinario sobre la dieta apropiada
- Proporciona alimento de calidad apropiado para la edad
- Establece horarios regulares de alimentación

🐕 Temperamento y Comportamiento
- Cada ${species} tiene su personalidad única
- Observa y respeta las señales de tu mascota
- Proporciona entrenamiento positivo y consistente

❤️ Salud y Prevención
- Mantén un calendario de vacunación actualizado
- Realiza chequeos veterinarios regulares
- Presta atención a cambios en comportamiento o apetito

🐾 Socialización
- Socializa gradualmente desde temprana edad
- Expone a diferentes entornos y situaciones de forma positiva
- Supervisa las interacciones con otros animales

🌡️ Adaptación al Clima de Chile
- Considera las variaciones estacionales del clima
- Proporciona protección adecuada en verano e invierno
- Adapta la rutina según las condiciones climáticas`;
      console.log("Usando consejos de fallback");
    } else {
      console.log("Consejos generados exitosamente");
    }

    return new Response(
      JSON.stringify({ tips }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in breed-tips function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
