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
    const { breed, species, recordType } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY no está configurada");
    }

    console.log(`Generando sugerencias médicas para ${species} raza ${breed}, tipo: ${recordType}`);

    const systemPrompt = `Eres un veterinario experto con más de 10 años de experiencia en Chile.

FORMATO DE RESPUESTA (OBLIGATORIO):
Debes responder SOLO con un JSON array válido, sin texto adicional:
[
  {
    "value": "identificador-unico-sin-espacios",
    "label": "Nombre legible de la opción",
    "description": "Descripción breve (máximo 30 palabras)"
  }
]

REQUISITOS:
- Genera entre 8-12 opciones relevantes y realistas
- El campo "value" en minúsculas con guiones
- Todas apropiadas para el contexto chileno
- No inventes nombres de vacunas o medicamentos que no existan
- Responde siempre en español de Chile`;

    const typePrompts: Record<string, string> = {
      vacuna: `Genera vacunas comunes para ${species === 'perro' ? 'perros' : 'gatos'} de raza "${breed}" en Chile. Incluye obligatorias (antirrábica, múltiple) y opcionales.`,
      consulta: `Genera tipos de consultas veterinarias comunes para ${species === 'perro' ? 'perros' : 'gatos'} de raza "${breed}". Incluye preventivas, seguimiento, y específicas de raza.`,
      medicamento: `Genera medicamentos comúnmente recetados para ${species === 'perro' ? 'perros' : 'gatos'} de raza "${breed}". Incluye preventivos y tratamientos comunes.`,
      cirugia: `Genera cirugías comunes en ${species === 'perro' ? 'perros' : 'gatos'} de raza "${breed}". Incluye preventivas y correctivas.`,
      examen: `Genera exámenes diagnósticos recomendados para ${species === 'perro' ? 'perros' : 'gatos'} de raza "${breed}". Incluye rutina y específicos de raza.`,
      emergencia: `Genera emergencias médicas comunes en ${species === 'perro' ? 'perros' : 'gatos'} de raza "${breed}". Incluye situaciones de atención inmediata.`,
    };

    const userPrompt = typePrompts[recordType] || `Genera opciones médicas generales para ${species === 'perro' ? 'perros' : 'gatos'} de raza "${breed}".`;

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
          { role: "user", content: userPrompt }
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
        JSON.stringify({ error: "Error al obtener sugerencias" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No se recibió contenido de la IA");
    }

    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No se encontró JSON array en la respuesta");
      }

      suggestions = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(suggestions)) {
        throw new Error("La respuesta no es un array");
      }

      suggestions = suggestions
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
          value: item.value || `opcion-${Math.random().toString(36).substr(2, 9)}`,
          label: item.label || 'Opción sin nombre',
          description: item.description || 'Sin descripción disponible'
        }));

      if (suggestions.length === 0) {
        throw new Error("No se generaron sugerencias válidas");
      }

      console.log(`Generadas ${suggestions.length} sugerencias con Claude`);
    } catch (parseError) {
      console.error("Error al parsear sugerencias:", parseError);

      const fallbackSuggestions: Record<string, any[]> = {
        vacuna: [
          { value: "antirrabica", label: "Vacuna Antirrábica", description: "Vacuna obligatoria contra la rabia" },
          { value: "multiple", label: "Vacuna Múltiple", description: "Protege contra varias enfermedades" },
          { value: "refuerzo-anual", label: "Refuerzo Anual", description: "Refuerzo de vacunación anual" }
        ],
        consulta: [
          { value: "consulta-general", label: "Consulta General", description: "Consulta veterinaria de rutina" },
          { value: "chequeo-anual", label: "Chequeo Anual", description: "Revisión médica completa anual" },
          { value: "consulta-seguimiento", label: "Consulta de Seguimiento", description: "Seguimiento de tratamiento" }
        ],
        medicamento: [
          { value: "antipulgas", label: "Antipulgas", description: "Tratamiento preventivo contra pulgas" },
          { value: "desparasitante", label: "Desparasitante", description: "Elimina parásitos internos" },
          { value: "suplemento-vitaminico", label: "Suplemento Vitamínico", description: "Suplemento nutricional" }
        ],
        cirugia: [
          { value: "esterilizacion", label: "Esterilización", description: "Cirugía de esterilización" },
          { value: "castracion", label: "Castración", description: "Cirugía de castración" },
          { value: "cirugia-correctiva", label: "Cirugía Correctiva", description: "Corregir un problema" }
        ],
        examen: [
          { value: "analisis-sangre", label: "Análisis de Sangre", description: "Examen de sangre completo" },
          { value: "analisis-orina", label: "Análisis de Orina", description: "Examen de orina" },
          { value: "radiografia", label: "Radiografía", description: "Estudio de imagen por rayos X" }
        ],
        emergencia: [
          { value: "accidente", label: "Accidente", description: "Emergencia por accidente o trauma" },
          { value: "intoxicacion", label: "Intoxicación", description: "Emergencia por intoxicación" },
          { value: "dificultad-respiratoria", label: "Dificultad Respiratoria", description: "Emergencia respiratoria" }
        ]
      };

      suggestions = fallbackSuggestions[recordType] || fallbackSuggestions.consulta;
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in medical-suggestions function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
