import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoFrames } = await req.json();
    
    if (!videoFrames || videoFrames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionaron frames de video' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    console.log(`Analizando ${videoFrames.length} frames del video...`);

    const systemPrompt = `Eres un experto veterinario etólogo especializado en lenguaje corporal canino con más de 15 años de experiencia. 
Tu tarea es analizar imágenes de un perro y proporcionar un análisis detallado, preciso y profesional del comportamiento y lenguaje corporal observado.

CONTEXTO:
- Estás analizando imágenes extraídas de un video de un perro
- Debes ser objetivo y basar tus observaciones únicamente en lo que puedes ver
- Si alguna señal es ambigua o no está clara, indícalo en tu análisis

ANÁLISIS REQUERIDO:
1. Postura corporal: Evalúa si está relajada, tensa, agresiva, temerosa, juguetona, sumisa, o neutral
2. Posición de la cola: Observa altura (alta, media, baja, entre las piernas), movimiento (moviéndose, quieta), y posición relativa al cuerpo
3. Orejas: Identifica posición (erectas, hacia atrás, relajadas, una hacia atrás) y tensión
4. Expresión facial y boca: Observa si está abierta, cerrada, enseñando dientes, lengua visible, y tensión en los músculos faciales
5. Nivel de energía: Evalúa si está activo, calmado, excitado, o letárgico
6. Estado emocional: Identifica emociones primarias (felicidad, miedo, ansiedad, agresión, relajación, curiosidad)
7. Intención comunicativa: Interpreta qué está tratando de comunicar el perro con su lenguaje corporal

FORMATO DE RESPUESTA (OBLIGATORIO):
Debes responder SOLO con un JSON válido, sin texto adicional antes o después. El formato exacto es:
{
  "estado_emocional": "descripción clara y concisa del estado emocional general (2-3 oraciones)",
  "lenguaje_corporal": {
    "postura": "descripción específica de la postura observada",
    "cola": "descripción detallada de la posición y movimiento de la cola",
    "orejas": "descripción de la posición y tensión de las orejas",
    "expresion_facial": "descripción de la expresión facial y boca"
  },
  "interpretacion": "interpretación detallada y profesional de lo que el perro está comunicando (3-4 oraciones)",
  "recomendaciones": ["recomendación práctica 1", "recomendación práctica 2", "recomendación práctica 3"],
  "nivel_alerta": "bajo|medio|alto"
}

IMPORTANTE:
- Si no puedes determinar claramente algún aspecto, usa "no se puede determinar claramente" en lugar de inventar información
- Las recomendaciones deben ser prácticas y accionables
- El nivel_alerta debe ser "alto" solo si hay señales de agresión, miedo extremo, o comportamiento que requiera intervención inmediata
- Responde siempre en español de Chile`;

    const imageContent = videoFrames.map((frame: string) => ({
      type: "image_url",
      image_url: {
        url: frame
      }
    }));

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
            content: [
              {
                type: "text",
                text: "Analiza el comportamiento y lenguaje corporal del perro en estas imágenes extraídas de un video. Proporciona un análisis completo siguiendo el formato JSON especificado."
              },
              ...imageContent
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Fondos insuficientes. Por favor, agrega créditos a tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("Error de Lovable AI:", response.status, errorText);
      throw new Error(`Error al analizar el video: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log("Análisis recibido:", analysisText);

    // Extraer JSON del texto de respuesta
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No se encontró JSON en la respuesta");
      }
      analysis = JSON.parse(jsonMatch[0]);
      
      // Validar estructura mínima requerida
      if (!analysis.estado_emocional || !analysis.lenguaje_corporal || !analysis.interpretacion) {
        throw new Error("Estructura JSON incompleta");
      }
      
      // Asegurar que recomendaciones sea un array
      if (!Array.isArray(analysis.recomendaciones)) {
        analysis.recomendaciones = [];
      }
      
      // Validar nivel_alerta
      if (!['bajo', 'medio', 'alto'].includes(analysis.nivel_alerta)) {
        analysis.nivel_alerta = 'medio';
      }
    } catch (parseError) {
      console.error("Error al parsear respuesta de IA:", parseError);
      console.error("Respuesta recibida:", analysisText);
      
      // Fallback: crear respuesta por defecto
      analysis = {
        estado_emocional: "No se pudo determinar el estado emocional con claridad. Por favor, intenta con un video más claro o desde un ángulo diferente.",
        lenguaje_corporal: {
          postura: "No se puede determinar claramente",
          cola: "No se puede determinar claramente",
          orejas: "No se puede determinar claramente",
          expresion_facial: "No se puede determinar claramente"
        },
        interpretacion: "No se pudo completar el análisis automático. Se recomienda consultar con un veterinario o etólogo profesional para una evaluación más precisa.",
        recomendaciones: [
          "Intenta grabar el video con mejor iluminación",
          "Asegúrate de que el perro esté completamente visible en el frame",
          "Considera consultar con un veterinario para una evaluación profesional"
        ],
        nivel_alerta: "medio"
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error en analyze-dog-behavior:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
