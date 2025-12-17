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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    console.log(`Generando sugerencias médicas para ${species} raza ${breed}, tipo: ${recordType}`);

    const systemPrompt = `Eres un veterinario experto con más de 10 años de experiencia en Chile, especializado en medicina veterinaria y protocolos de salud animal locales.

CONTEXTO:
- Estás proporcionando sugerencias médicas para un formulario de registro médico de mascotas
- Las opciones deben ser relevantes, realistas, y apropiadas para el contexto chileno
- Debes considerar protocolos veterinarios, vacunas, y tratamientos comunes en Chile

FORMATO DE RESPUESTA (OBLIGATORIO):
Debes responder SOLO con un JSON array válido, sin texto adicional antes o después del JSON.
No incluyas explicaciones, comentarios, o texto fuera del JSON.

Formato exacto requerido:
[
  {
    "value": "identificador-unico-sin-espacios-ni-caracteres-especiales",
    "label": "Nombre legible y profesional de la opción",
    "description": "Descripción breve y clara (máximo 50 palabras, idealmente 20-30 palabras)"
  }
]

REQUISITOS:
- Genera entre 8-12 opciones relevantes y realistas
- El campo "value" debe ser un identificador único, en minúsculas, sin espacios ni caracteres especiales (usa guiones)
- El campo "label" debe ser el nombre que verá el usuario (puede tener mayúsculas y espacios)
- El campo "description" debe ser informativo pero conciso
- Todas las opciones deben ser apropiadas para el tipo de registro solicitado
- Si no conoces opciones específicas para la raza, proporciona opciones generales pero válidas
- Asegúrate de que el JSON sea válido y parseable (sin comas finales, comillas correctas)

IMPORTANTE:
- Si la raza no existe o no la conoces, proporciona opciones generales apropiadas para la especie
- No inventes nombres de vacunas, medicamentos, o procedimientos que no existan
- Usa terminología veterinaria correcta y profesional
- Responde siempre en español de Chile`;

    const typePrompts: Record<string, string> = {
      vacuna: `Genera una lista de vacunas comunes y recomendadas para ${species === 'perro' ? 'perros' : species === 'gato' ? 'gatos' : 'mascotas'} de raza "${breed}" en Chile. 

Incluye:
- Vacunas obligatorias según protocolo chileno (ej: antirrábica, múltiple)
- Vacunas opcionales pero recomendadas según la raza
- Considera la edad y el contexto de vacunación en Chile

IMPORTANTE: Si la raza "${breed}" no existe o no conoces vacunas específicas, proporciona vacunas generales apropiadas para ${species === 'perro' ? 'perros' : 'gatos'} en Chile.`,
      
      consulta: `Genera tipos de consultas veterinarias comunes para ${species === 'perro' ? 'perros' : species === 'gato' ? 'gatos' : 'mascotas'} de raza "${breed}".

Incluye:
- Chequeos preventivos (anuales, semestrales)
- Consultas específicas de la raza
- Consultas por síntomas comunes
- Consultas de seguimiento

IMPORTANTE: Si la raza "${breed}" no existe, proporciona tipos de consultas generales apropiadas para ${species === 'perro' ? 'perros' : 'gatos'}.`,
      
      medicamento: `Genera medicamentos comúnmente recetados para ${species === 'perro' ? 'perros' : species === 'gato' ? 'gatos' : 'mascotas'} de raza "${breed}".

Incluye:
- Preventivos (antipulgas, desparasitantes, suplementos)
- Tratamientos comunes (antibióticos, antiinflamatorios, etc.)
- Medicamentos específicos para problemas comunes de la raza

IMPORTANTE: Solo incluye medicamentos reales y apropiados. Si no conoces medicamentos específicos para la raza, proporciona medicamentos generales comunes para ${species === 'perro' ? 'perros' : 'gatos'}.`,
      
      cirugia: `Genera cirugías comunes en ${species === 'perro' ? 'perros' : species === 'gato' ? 'gatos' : 'mascotas'} de raza "${breed}".

Incluye:
- Cirugías preventivas (esterilización, castración)
- Cirugías más frecuentes según problemas típicos de la raza
- Cirugías correctivas comunes

IMPORTANTE: Si la raza "${breed}" no existe, proporciona cirugías generales comunes para ${species === 'perro' ? 'perros' : 'gatos'}.`,
      
      examen: `Genera exámenes y pruebas diagnósticas recomendadas para ${species === 'perro' ? 'perros' : species === 'gato' ? 'gatos' : 'mascotas'} de raza "${breed}".

Incluye:
- Análisis de rutina (sangre, orina, heces)
- Exámenes específicos según riesgos de la raza
- Pruebas diagnósticas comunes

IMPORTANTE: Si la raza "${breed}" no existe, proporciona exámenes generales recomendados para ${species === 'perro' ? 'perros' : 'gatos'}.`,
      
      emergencia: `Genera emergencias médicas comunes en ${species === 'perro' ? 'perros' : species === 'gato' ? 'gatos' : 'mascotas'} de raza "${breed}".

Incluye:
- Situaciones que requieren atención inmediata
- Emergencias relacionadas con características de la raza
- Signos de alerta comunes

IMPORTANTE: Si la raza "${breed}" no existe, proporciona emergencias generales comunes para ${species === 'perro' ? 'perros' : 'gatos'}.`,
    };

    const userPrompt = typePrompts[recordType] || `Genera opciones médicas generales para ${species === 'perro' ? 'perros' : species === 'gato' ? 'gatos' : 'mascotas'} de raza "${breed}".`;

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
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
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
        JSON.stringify({ error: "Error al obtener sugerencias" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No se recibió contenido de la IA");
    }

    // Extract JSON from response
    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No se encontró JSON array en la respuesta");
      }
      
      suggestions = JSON.parse(jsonMatch[0]);
      
      // Validar que sea un array
      if (!Array.isArray(suggestions)) {
        throw new Error("La respuesta no es un array");
      }
      
      // Validar estructura mínima de cada elemento
      suggestions = suggestions
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
          value: item.value || `opcion-${Math.random().toString(36).substr(2, 9)}`,
          label: item.label || 'Opción sin nombre',
          description: item.description || 'Sin descripción disponible'
        }));
      
      // Si no hay sugerencias válidas, crear fallback
      if (suggestions.length === 0) {
        throw new Error("No se generaron sugerencias válidas");
      }
      
      console.log(`Generadas ${suggestions.length} sugerencias válidas`);
    } catch (parseError) {
      console.error("Error al parsear sugerencias de IA:", parseError);
      console.error("Contenido recibido:", content);
      
      // Fallback: sugerencias genéricas según el tipo
      const fallbackSuggestions: Record<string, any[]> = {
        vacuna: [
          { value: "antirrabica", label: "Vacuna Antirrábica", description: "Vacuna obligatoria contra la rabia" },
          { value: "multiple", label: "Vacuna Múltiple", description: "Vacuna que protege contra varias enfermedades" },
          { value: "refuerzo-anual", label: "Refuerzo Anual", description: "Refuerzo de vacunación anual" }
        ],
        consulta: [
          { value: "consulta-general", label: "Consulta General", description: "Consulta veterinaria de rutina" },
          { value: "chequeo-anual", label: "Chequeo Anual", description: "Revisión médica completa anual" },
          { value: "consulta-seguimiento", label: "Consulta de Seguimiento", description: "Consulta de seguimiento de tratamiento" }
        ],
        medicamento: [
          { value: "antipulgas", label: "Antipulgas", description: "Tratamiento preventivo contra pulgas" },
          { value: "desparasitante", label: "Desparasitante", description: "Medicamento para eliminar parásitos internos" },
          { value: "suplemento-vitaminico", label: "Suplemento Vitamínico", description: "Suplemento nutricional" }
        ],
        cirugia: [
          { value: "esterilizacion", label: "Esterilización", description: "Cirugía de esterilización" },
          { value: "castracion", label: "Castración", description: "Cirugía de castración" },
          { value: "cirugia-correctiva", label: "Cirugía Correctiva", description: "Cirugía para corregir un problema" }
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
      console.log(`Usando ${suggestions.length} sugerencias de fallback`);
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
