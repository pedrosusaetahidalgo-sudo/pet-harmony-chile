import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShelterData {
  name: string;
  type: string;
  description?: string | null;
  ai_description?: string | null;
  commune: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  animal_types: string[];
  pet_sizes: string[];
  specialties: string[];
  formality_level: string;
  contact_email: string;
  website: string | null;
  social_media: { instagram: string | null; facebook: string | null };
  is_active: boolean;
  is_verified: boolean;
  source: string;
  ai_processed_at?: string | null;
}

// Chilean communes for realistic shelter locations
const chileanCommunes = [
  { name: "Providencia", lat: -33.4289, lng: -70.6108 },
  { name: "Las Condes", lat: -33.4103, lng: -70.5675 },
  { name: "Ñuñoa", lat: -33.4541, lng: -70.5977 },
  { name: "Vitacura", lat: -33.3869, lng: -70.5728 },
  { name: "La Reina", lat: -33.4486, lng: -70.5389 },
  { name: "Peñalolén", lat: -33.4873, lng: -70.5097 },
  { name: "Macul", lat: -33.4891, lng: -70.5996 },
  { name: "San Miguel", lat: -33.4981, lng: -70.6516 },
  { name: "La Florida", lat: -33.5167, lng: -70.5881 },
  { name: "Puente Alto", lat: -33.6122, lng: -70.5758 },
  { name: "Maipú", lat: -33.5092, lng: -70.7628 },
  { name: "Santiago Centro", lat: -33.4489, lng: -70.6693 },
  { name: "Recoleta", lat: -33.4061, lng: -70.6416 },
  { name: "Independencia", lat: -33.4197, lng: -70.6653 },
  { name: "Quilicura", lat: -33.3654, lng: -70.7334 },
];

// Shelter name templates
const shelterTemplates = [
  { prefix: "Refugio", suffix: ["Patitas Felices", "Huellas de Amor", "Vida Animal", "Segunda Oportunidad", "Amigos Peludos"] },
  { prefix: "Fundación", suffix: ["Rescate Animal", "Adopta Chile", "Protección Animal", "Cuatro Patas", "Amor Animal"] },
  { prefix: "Casa de Acogida", suffix: ["El Refugio", "Los Gatitos", "Perritos Sin Hogar", "Hogar Temporal", "Amor Peludo"] },
  { prefix: "ONG", suffix: ["Salvando Vidas", "Animales Sin Fronteras", "Rescate Urbano", "Protectores", "Guardianes"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, count = 15 } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "generate") {
      // Check existing shelters
      const { data: existing } = await supabase
        .from("adoption_shelters")
        .select("id")
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ message: "Shelters already exist", count: existing.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate shelter data
      const shelters: ShelterData[] = [];
      for (let i = 0; i < count; i++) {
        const commune = chileanCommunes[i % chileanCommunes.length];
        const template = shelterTemplates[Math.floor(Math.random() * shelterTemplates.length)];
        const suffix = template.suffix[Math.floor(Math.random() * template.suffix.length)];
        
        const name = `${template.prefix} ${suffix}`;
        const type = template.prefix === "Fundación" ? "fundacion" 
          : template.prefix === "ONG" ? "ong"
          : template.prefix === "Casa de Acogida" ? "independiente"
          : "refugio";

        const animalTypes = Math.random() > 0.3 
          ? ["perro", "gato"] 
          : Math.random() > 0.5 ? ["perro"] : ["gato"];

        const petSizes = Math.random() > 0.2
          ? ["pequeño", "mediano", "grande"]
          : Math.random() > 0.5 ? ["pequeño", "mediano"] : ["mediano", "grande"];

        const specialtiesOptions = [
          "rescate de calle",
          "gatos senior",
          "perros medianos",
          "cachorros abandonados",
          "mascotas con discapacidad",
          "rehabilitación conductual",
          "gatos ferales",
          "perros grandes",
        ];

        const specialties = [
          specialtiesOptions[Math.floor(Math.random() * specialtiesOptions.length)],
        ];

        shelters.push({
          name,
          type,
          commune: commune.name,
          city: "Santiago",
          latitude: commune.lat + (Math.random() - 0.5) * 0.02,
          longitude: commune.lng + (Math.random() - 0.5) * 0.02,
          address: `Calle ${Math.floor(Math.random() * 1000) + 1}, ${commune.name}`,
          animal_types: animalTypes,
          pet_sizes: petSizes,
          specialties,
          formality_level: type === "ong" || type === "fundacion" ? "establecido" : "semi_formal",
          contact_email: `contacto@${name.toLowerCase().replace(/\s+/g, "").substring(0, 20)}.cl`,
          website: Math.random() > 0.3 ? `https://www.${name.toLowerCase().replace(/\s+/g, "").substring(0, 15)}.cl` : null,
          social_media: {
            instagram: Math.random() > 0.3 ? `@${name.toLowerCase().replace(/\s+/g, "_").substring(0, 20)}` : null,
            facebook: Math.random() > 0.4 ? name.replace(/\s+/g, "") : null,
          },
          is_active: true,
          is_verified: Math.random() > 0.5,
          source: "ai_generated",
        });
      }

      // Use Lovable AI to generate descriptions if available
      if (lovableApiKey) {
        console.log("Using Lovable AI to generate descriptions...");
        
        for (const shelter of shelters) {
          try {
            const organizationType = shelter.type === 'ong' 
              ? 'ONG de rescate animal' 
              : shelter.type === 'fundacion' 
              ? 'fundación de protección animal' 
              : shelter.type === 'independiente' 
              ? 'casa de acogida independiente' 
              : 'refugio de animales';
            
            const prompt = `Genera una descripción breve, amigable y emotiva (exactamente 2 oraciones, máximo 150 palabras en total) para un ${organizationType} llamado "${shelter.name}" ubicado en ${shelter.commune}, Santiago de Chile. 

CONTEXTO:
- Se especializan en: ${shelter.specialties.join(', ')}
- Trabajan principalmente con: ${shelter.animal_types.join(' y ')}
- Tipo de organización: ${organizationType}

REQUISITOS:
- Exactamente 2 oraciones
- Tono cálido, emotivo y motivador
- Debe inspirar a las personas a adoptar
- Menciona brevemente la especialidad o enfoque
- Adaptado al contexto chileno
- Sin información de contacto (solo descripción)`;

            const systemPrompt = `Eres un escritor especializado en crear descripciones breves, emotivas y motivadoras para organizaciones de rescate animal en Chile. 

DIRECTRICES:
- Genera exactamente 2 oraciones, máximo 150 palabras en total
- Tono: Cálido, empático, y motivador
- Objetivo: Inspirar a las personas a considerar la adopción
- Estilo: Profesional pero cercano, sin ser excesivamente dramático
- Contexto: Adaptado a la realidad chilena
- No incluyas: Información de contacto, precios, o detalles técnicos
- Enfócate en: El propósito de la organización, su especialidad, y el impacto positivo

FORMATO:
- Primera oración: Presenta la organización y su propósito
- Segunda oración: Destaca su especialidad o enfoque único

Responde SOLO con las 2 oraciones, sin títulos, sin formato adicional, sin explicaciones.`;

            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: prompt }
                ],
                max_tokens: 200,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              let aiContent = data.choices?.[0]?.message?.content?.trim() || null;
              
              // Limpiar y validar el contenido
              if (aiContent) {
                // Remover títulos o formato adicional si existe
                aiContent = aiContent
                  .replace(/^#{1,3}\s+/gm, '') // Remover markdown headers
                  .replace(/\*\*/g, '') // Remover bold
                  .replace(/\*/g, '') // Remover italic
                  .trim();
                
                // Asegurar que tenga al menos 2 oraciones
                const sentences = aiContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
                if (sentences.length < 2) {
                  // Si solo hay una oración, crear una segunda
                  const orgType = shelter.type === 'ong' ? 'ONG' : shelter.type === 'fundacion' ? 'fundación' : shelter.type === 'independiente' ? 'casa de acogida' : 'refugio';
                  aiContent = `${aiContent} Se especializan en ${shelter.specialties[0]} y buscan hogares amorosos para ${shelter.animal_types.join(' y ')}.`;
                }
              }
              
              shelter.ai_description = aiContent;
              shelter.description = aiContent || undefined;
              shelter.ai_processed_at = new Date().toISOString();
            } else {
              throw new Error(`AI API error: ${response.status}`);
            }
          } catch (aiError) {
            console.error("AI description error:", aiError);
            // Fallback description
            const orgType = shelter.type === 'ong' ? 'ONG' : shelter.type === 'fundacion' ? 'fundación' : shelter.type === 'independiente' ? 'casa de acogida' : 'refugio';
            shelter.description = `${shelter.name} es un ${orgType} dedicado al rescate y cuidado de ${shelter.animal_types.join(" y ")}. Ubicado en ${shelter.commune}, Santiago, buscan hogares amorosos para sus animales y se especializan en ${shelter.specialties[0]}.`;
            shelter.ai_processed_at = new Date().toISOString();
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        // Generate basic descriptions without AI
        for (const shelter of shelters) {
          shelter.description = `${shelter.name} es un ${shelter.type === 'ong' ? 'organización sin fines de lucro' : shelter.type === 'fundacion' ? 'fundación' : shelter.type === 'independiente' ? 'hogar de acogida independiente' : 'refugio'} dedicado al rescate y adopción responsable de ${shelter.animal_types.join(" y ")}. Ubicado en ${shelter.commune}, Santiago, trabaja con animales ${shelter.specialties[0]}.`;
        }
      }

      // Insert shelters
      const { data: inserted, error: insertError } = await supabase
        .from("adoption_shelters")
        .insert(shelters)
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, shelters: inserted, count: inserted?.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list") {
      const { data: shelters, error } = await supabase
        .from("adoption_shelters")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ shelters }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
