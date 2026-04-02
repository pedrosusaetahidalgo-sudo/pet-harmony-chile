import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { videoFrames } = await req.json();

    if (!videoFrames || !Array.isArray(videoFrames) || videoFrames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionaron frames de video' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that all frames are strings
    if (!videoFrames.every((f: any) => typeof f === "string")) {
      return new Response(
        JSON.stringify({ error: 'Todos los frames deben ser strings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY no está configurada");
    }

    console.log(`Analizando ${videoFrames.length} frames del video...`);

    const systemPrompt = `Eres un experto veterinario etólogo especializado en lenguaje corporal canino con más de 15 años de experiencia.
Tu tarea es analizar imágenes de un perro y proporcionar un análisis detallado, preciso y profesional del comportamiento y lenguaje corporal observado.

FORMATO DE RESPUESTA (OBLIGATORIO):
Debes responder SOLO con un JSON válido, sin texto adicional antes o después:
{
  "estado_emocional": "descripción clara del estado emocional general (2-3 oraciones)",
  "lenguaje_corporal": {
    "postura": "descripción de la postura observada",
    "cola": "descripción de la posición y movimiento de la cola",
    "orejas": "descripción de la posición de las orejas",
    "expresion_facial": "descripción de la expresión facial y boca"
  },
  "interpretacion": "interpretación profesional de lo que el perro comunica (3-4 oraciones)",
  "recomendaciones": ["recomendación 1", "recomendación 2", "recomendación 3"],
  "nivel_alerta": "bajo|medio|alto"
}

IMPORTANTE:
- Si no puedes determinar algo, usa "no se puede determinar claramente"
- nivel_alerta "alto" solo si hay señales de agresión o miedo extremo
- Responde siempre en español de Chile`;

    // Convert base64 data URLs to Claude's image format
    const imageContent = videoFrames.map((frame: string) => {
      // Extract base64 data and media type from data URL
      const match = frame.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: match[1],
            data: match[2],
          }
        };
      }
      // If it's a URL, use URL source type
      return {
        type: "image",
        source: {
          type: "url",
          url: frame,
        }
      };
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      throw new Error(`Error al analizar el video: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.content?.[0]?.text;

    console.log("Análisis recibido de Claude");

    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No se encontró JSON en la respuesta");
      }
      analysis = JSON.parse(jsonMatch[0]);

      if (!analysis.estado_emocional || !analysis.lenguaje_corporal || !analysis.interpretacion) {
        throw new Error("Estructura JSON incompleta");
      }

      if (!Array.isArray(analysis.recomendaciones)) {
        analysis.recomendaciones = [];
      }

      if (!['bajo', 'medio', 'alto'].includes(analysis.nivel_alerta)) {
        analysis.nivel_alerta = 'medio';
      }
    } catch (parseError) {
      console.error("Error al parsear respuesta de IA:", parseError);
      analysis = {
        estado_emocional: "No se pudo determinar el estado emocional con claridad. Por favor, intenta con un video más claro.",
        lenguaje_corporal: {
          postura: "No se puede determinar claramente",
          cola: "No se puede determinar claramente",
          orejas: "No se puede determinar claramente",
          expresion_facial: "No se puede determinar claramente"
        },
        interpretacion: "No se pudo completar el análisis automático. Se recomienda consultar con un veterinario o etólogo profesional.",
        recomendaciones: [
          "Intenta grabar el video con mejor iluminación",
          "Asegúrate de que el perro esté completamente visible",
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
    return new Response(
      JSON.stringify({ error: "Error al analizar el comportamiento. Por favor, intenta de nuevo más tarde." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
