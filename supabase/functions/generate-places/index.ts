import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city = "Santiago", region = "Metropolitana" } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en servicios para mascotas en Chile con conocimiento detallado de establecimientos, ubicaciones, y prácticas comerciales locales.

CONTEXTO:
- Estás generando lugares realistas (no necesariamente reales) para una plataforma de servicios para mascotas
- Los lugares deben ser creíbles y apropiados para el contexto chileno
- Debes usar nombres, direcciones, y coordenadas que sean realistas para la ciudad especificada

TIPOS DE LUGARES PERMITIDOS:
- "veterinaria": Clínicas y consultorios veterinarios
- "peluqueria": Peluquerías y estéticas caninas/felinas
- "parque": Parques y áreas verdes para mascotas
- "tienda": Tiendas de productos para mascotas
- "hotel": Hoteles y alojamientos para mascotas
- "guarderia": Guarderías y centros de cuidado diario

FORMATO DE RESPUESTA (OBLIGATORIO):
Debes responder SOLO con un JSON array válido, sin texto adicional antes o después del JSON.
No incluyas explicaciones, comentarios, o texto fuera del JSON.

Formato exacto requerido:
[
  {
    "name": "Nombre del lugar (creativo, chileno, auténtico)",
    "place_type": "veterinaria" | "peluqueria" | "parque" | "tienda" | "hotel" | "guarderia",
    "description": "Descripción breve y atractiva (2-3 oraciones, máximo 100 palabras)",
    "address": "Dirección completa y realista en Chile (calle, número, comuna)",
    "latitude": número decimal entre -33.0 y -34.0 para Santiago (ajusta según ciudad),
    "longitude": número decimal entre -70.0 y -71.0 para Santiago (ajusta según ciudad),
    "phone": "+56 2 XXXX XXXX" o "+56 9 XXXX XXXX" (formato chileno válido),
    "website": "https://ejemplo.cl" o null,
    "rating": número decimal entre 3.0 y 5.0,
    "price_range": "$" | "$$" | "$$$",
    "amenities": ["array", "de", "servicios", "o", "amenidades"]
  }
]

REQUISITOS:
- Genera exactamente 15 lugares variados (aproximadamente 2-3 de cada tipo)
- Nombres: Creativos, chilenos, auténticos, apropiados para el tipo de lugar
- Coordenadas: Deben ser realistas para la ciudad especificada (usa coordenadas geográficas válidas)
- Direcciones: Formato chileno realista (Calle/Nombre, número, comuna)
- Teléfonos: Formato chileno válido (+56 2 para fijos, +56 9 para móviles)
- Ratings: Variados pero mayormente positivos (3.5-5.0)
- Price range: Variado según el tipo de lugar
- Amenities: Array de 2-5 servicios/amenidades relevantes para el tipo de lugar
- Descripciones: Breves, atractivas, y específicas al tipo de lugar

IMPORTANTE:
- Si no conoces coordenadas específicas de la ciudad, usa coordenadas aproximadas pero realistas
- Los nombres deben sonar chilenos y auténticos
- Las descripciones deben ser específicas y no genéricas
- Asegúrate de que el JSON sea válido y parseable
- Responde siempre en español de Chile`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Genera exactamente 15 lugares realistas y variados para mascotas en ${city}, región ${region}, Chile.

REQUISITOS ESPECÍFICOS:
- Distribución: Aproximadamente 2-3 lugares de cada tipo (veterinaria, peluqueria, parque, tienda, hotel, guarderia)
- Variedad: Asegúrate de incluir diferentes tipos de lugares
- Calidad: Los lugares deben ser creíbles y apropiados para una plataforma profesional
- Coordenadas: Usa coordenadas geográficas realistas para ${city}, ${region}
- Nombres: Creativos, chilenos, y auténticos

IMPORTANTE:
- Devuelve SOLO el JSON array válido
- No incluyas texto adicional, explicaciones, o comentarios
- Asegúrate de que todos los campos requeridos estén presentes
- Valida que las coordenadas sean apropiadas para ${city}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al generar lugares con Claude" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No se recibió contenido de Claude");
    }

    // Extract JSON from response (in case Claude adds explanation text)
    let places;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No se encontró JSON array en la respuesta");
      }
      
      places = JSON.parse(jsonMatch[0]);
      
      // Validar que sea un array
      if (!Array.isArray(places)) {
        throw new Error("La respuesta no es un array");
      }
      
      // Validar y limpiar cada lugar
      places = places
        .filter((place: any) => place && typeof place === 'object')
        .map((place: any) => ({
          name: place.name || 'Lugar sin nombre',
          place_type: ['veterinaria', 'peluqueria', 'parque', 'tienda', 'hotel', 'guarderia'].includes(place.place_type)
            ? place.place_type
            : 'veterinaria', // Default
          description: place.description || 'Sin descripción disponible',
          address: place.address || `${city}, ${region}`,
          latitude: typeof place.latitude === 'number' ? place.latitude : -33.4489, // Default Santiago
          longitude: typeof place.longitude === 'number' ? place.longitude : -70.6693, // Default Santiago
          phone: place.phone || null,
          website: place.website || null,
          rating: typeof place.rating === 'number' && place.rating >= 0 && place.rating <= 5
            ? place.rating
            : 4.0, // Default
          price_range: ['$', '$$', '$$$'].includes(place.price_range) ? place.price_range : '$$',
          amenities: Array.isArray(place.amenities) ? place.amenities : []
        }));
      
      // Si no hay lugares válidos, lanzar error
      if (places.length === 0) {
        throw new Error("No se generaron lugares válidos");
      }
      
      console.log(`Generados ${places.length} lugares válidos`);
    } catch (parseError) {
      console.error("Error al parsear lugares de IA:", parseError);
      console.error("Contenido recibido:", content);
      throw new Error(`Error al procesar respuesta de IA: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
    }

    // Insert places into database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: insertedPlaces, error: insertError } = await supabase
      .from("places")
      .insert(
        places.map((place: any) => ({
          ...place,
          is_verified: false,
          photos: [],
          opening_hours: {
            monday: "09:00-19:00",
            tuesday: "09:00-19:00",
            wednesday: "09:00-19:00",
            thursday: "09:00-19:00",
            friday: "09:00-19:00",
            saturday: "10:00-14:00",
            sunday: "closed",
          },
        }))
      )
      .select();

    if (insertError) {
      console.error("Error inserting places:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedPlaces?.length || 0,
        places: insertedPlaces,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-places function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
