import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authToken = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quota = await checkAiQuota(userData.user.id);
    if (!quota.allowed) {
      return rateLimitResponse(quota, corsHeaders);
    }

    const { breed, species } = await req.json();

    if (!breed || typeof breed !== 'string' || !species || typeof species !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Se requiere raza y especie (ambos deben ser strings)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }

    console.log(`Generando consejos para ${species} raza ${breed}...`);

    const systemPrompt = `Veterinario chileno. Tips de raza, BREVES.

4 secciones, max 2 puntos c/u, 1 oración c/u, total <120 palabras:

🏥 Salud
🍖 Alimentación
🏃 Ejercicio
⚠️ Ojo con...

Español chileno (tu/tienes). Solo datos correctos. Si hay web_search, busca alertas recientes de la raza.`;

    const abortCtl = new AbortController();
    const fetchTimeout = setTimeout(() => abortCtl.abort(), 15000);
    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: abortCtl.signal,
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-3-5',
          max_tokens: 300,
          temperature: 0.3,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages: [
            {
              role: 'user',
              content: `Tips: ${species === 'perro' ? 'perro' : species === 'gato' ? 'gato' : 'mascota'} ${breed.slice(0, 100)}`,
            },
          ],
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
        }),
      });
    } finally {
      clearTimeout(fetchTimeout);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde.',
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Error al obtener consejos de IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    // web_search produces multiple content blocks; grab the last text block
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (data.content ?? []).filter((b: any) => b.type === 'text');
    let tips = textBlocks[textBlocks.length - 1]?.text;

    if (!tips || tips.trim().length === 0) {
      tips = `🏥 Salud clave
- Mantén vacunas y desparasitaciones al día según calendario
- Chequeo veterinario al menos 1 vez al año

🍖 Alimentacion
- Alimento de calidad apropiado para la edad y tamaño
- Agua fresca siempre disponible

🏃 Ejercicio
- Actividad física diaria adaptada a su energía
- Estimulación mental con juguetes interactivos

⚠️ Ojo con...
- Cambios en apetito, energía o comportamiento pueden indicar problemas
- Protege del calor extremo en verano chileno`;
      console.log('Usando consejos de fallback');
    } else {
      console.log('Consejos generados exitosamente con Claude');
    }

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in breed-tips function:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al procesar la solicitud. Por favor, intenta de nuevo más tarde.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
