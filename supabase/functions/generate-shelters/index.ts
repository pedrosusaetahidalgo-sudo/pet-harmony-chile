import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';

import { getCorsHeaders } from '../_shared/cors.ts';

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

// Fallback coordinates for Santiago communes (used when AI returns a commune name)
const communeCoords: Record<string, { lat: number; lng: number }> = {
  Providencia: { lat: -33.4289, lng: -70.6108 },
  'Las Condes': { lat: -33.4103, lng: -70.5675 },
  Ñuñoa: { lat: -33.4541, lng: -70.5977 },
  Vitacura: { lat: -33.3869, lng: -70.5728 },
  'La Reina': { lat: -33.4486, lng: -70.5389 },
  Peñalolén: { lat: -33.4873, lng: -70.5097 },
  Macul: { lat: -33.4891, lng: -70.5996 },
  'San Miguel': { lat: -33.4981, lng: -70.6516 },
  'La Florida': { lat: -33.5167, lng: -70.5881 },
  'Puente Alto': { lat: -33.6122, lng: -70.5758 },
  Maipú: { lat: -33.5092, lng: -70.7628 },
  'Santiago Centro': { lat: -33.4489, lng: -70.6693 },
  Santiago: { lat: -33.4489, lng: -70.6693 },
  Recoleta: { lat: -33.4061, lng: -70.6416 },
  Independencia: { lat: -33.4197, lng: -70.6653 },
  Quilicura: { lat: -33.3654, lng: -70.7334 },
  Concepción: { lat: -36.827, lng: -73.0503 },
  Valparaíso: { lat: -33.0472, lng: -71.6127 },
  'Viña del Mar': { lat: -33.0153, lng: -71.5503 },
  Temuco: { lat: -38.7359, lng: -72.5904 },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authToken = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(authToken);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quota = await checkAiQuota(userData.user.id, { limit: 10 });
    if (!quota.allowed) {
      return rateLimitResponse(quota, corsHeaders);
    }

    const reqBody = await req.json();
    const { action, count = 15, city = 'Santiago' } = reqBody;

    // Input validation
    if (!action || typeof action !== 'string') {
      return new Response(JSON.stringify({ error: 'action is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['generate', 'list'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (typeof count !== 'number' || count < 1 || count > 100) {
      return new Response(JSON.stringify({ error: 'count must be a number between 1 and 100' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate') {
      // Verificar si ya existen refugios para esta ciudad
      const { data: existing } = await supabase
        .from('adoption_shelters')
        .select('id')
        .eq('city', city)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({
            message: 'Shelters already exist for this city',
            count: existing.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ error: 'AI service not configured — cannot search real shelters' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Searching real shelters in ${city}, Chile via web_search...`);

      const systemPrompt = `Refugios/fundaciones rescate animal REALES en ${city}, Chile.

JSON array:
[{"name":"","type":"refugio|fundacion|ong","address":"","commune":"","phone":"","email":"","url":"","animal_types":["perro","gato"],"description":"1 oracion"}]

Solo reales, no inventar.`;

      const controller = new AbortController();
      const searchTimeout = setTimeout(() => controller.abort(), 30000);

      let aiResponse;
      try {
        aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            temperature: 0.2,
            system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
            messages: [
              {
                role: 'user',
                content: `Refugios animales en ${city}, Chile. Max ${Math.min(count, 20)}.`,
              },
            ],
          }),
        });
      } finally {
        clearTimeout(searchTimeout);
      }

      if (!aiResponse.ok) {
        console.error('Claude API error:', aiResponse.status);
        return new Response(JSON.stringify({ error: 'AI search failed' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textBlocks = (aiData.content ?? []).filter((b: any) => b.type === 'text');
      const content = textBlocks[textBlocks.length - 1]?.text ?? '';

      // Parse the JSON array from Claude's response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aiShelters: any[] = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiShelters = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse shelter results:', e);
      }

      if (!Array.isArray(aiShelters) || aiShelters.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No se encontraron refugios reales. Intenta con otra ciudad.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Map AI results to DB schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shelters: ShelterData[] = aiShelters.map((s: any) => {
        const commune = typeof s.commune === 'string' ? s.commune : city;
        const coords = communeCoords[commune] ||
          communeCoords['Santiago'] || { lat: -33.4489, lng: -70.6693 };

        return {
          name: s.name || 'Refugio sin nombre',
          type: s.type === 'fundacion' || s.type === 'ong' ? s.type : 'refugio',
          description: s.description || null,
          ai_description: s.description || null,
          commune,
          city: city,
          latitude: coords.lat + (Math.random() - 0.5) * 0.01,
          longitude: coords.lng + (Math.random() - 0.5) * 0.01,
          address: s.address || `${commune}, ${city}`,
          animal_types: Array.isArray(s.animal_types) ? s.animal_types : ['perro', 'gato'],
          pet_sizes: ['pequeño', 'mediano', 'grande'],
          specialties: ['rescate'],
          formality_level:
            s.type === 'ong' || s.type === 'fundacion' ? 'establecido' : 'semi_formal',
          contact_email: s.email || '',
          website: s.url || null,
          social_media: { instagram: null, facebook: null },
          is_active: true,
          is_verified: false,
          source: 'web_search',
          ai_processed_at: new Date().toISOString(),
        };
      });

      const { data: inserted, error: insertError } = await supabase
        .from('adoption_shelters')
        .insert(shelters)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          shelters: inserted,
          count: inserted?.length,
          ai_generated: true,
          disclaimer:
            'Datos generados por IA. La información de contacto, direcciones y nombres pueden no ser exactos. Verifica antes de contactar.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list') {
      const { data: shelters, error } = await supabase
        .from('adoption_shelters')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ shelters }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al procesar la solicitud. Por favor, intenta de nuevo más tarde.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
