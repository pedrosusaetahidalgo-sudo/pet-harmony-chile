import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';

import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    const { breed, species, recordType } = await req.json();

    // Input validation
    if (!breed || typeof breed !== 'string') {
      return new Response(JSON.stringify({ error: 'breed is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!species || typeof species !== 'string') {
      return new Response(JSON.stringify({ error: 'species is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!recordType || typeof recordType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'recordType is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Cache: buscar resultado previo ──
    const cacheKey = `medical-suggestions:${recordType.toLowerCase()}:${species.toLowerCase()}:${breed.toLowerCase().slice(0, 100)}`;
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: cached } = await supabaseAdmin
      .from('ai_cache')
      .select('result, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      console.log(`Cache hit: ${cacheKey}`);
      return new Response(JSON.stringify({ suggestions: cached.result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }

    console.log(
      `Generando sugerencias médicas para ${species} raza ${breed}, tipo: ${recordType} (cache miss)`
    );

    const systemPrompt = `Vet chileno. Sugerencias registro médico, Chile.

JSON array 6-10 items, sin texto:
[{"value":"id-guiones","label":"Nombre","description":"<15 palabras"}]

Solo tratamientos/vacunas reales en Chile. Chileno.`;

    const speciesLabel = species === 'perro' ? 'perro' : species === 'gato' ? 'gato' : species;
    const userPrompt = `${recordType} para ${speciesLabel} ${breed}, Chile. 6-10 opciones.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 350,
        temperature: 0.2,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

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
      return new Response(JSON.stringify({ error: 'Error al obtener sugerencias' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (data.content ?? []).filter((b: any) => b.type === 'text');
    const content = textBlocks[textBlocks.length - 1]?.text;

    if (!content) {
      throw new Error('No se recibió contenido de la IA');
    }

    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON array en la respuesta');
      }

      suggestions = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(suggestions)) {
        throw new Error('La respuesta no es un array');
      }

      suggestions = suggestions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((item: any) => item && typeof item === 'object')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ({
          value: item.value || `opcion-${Math.random().toString(36).substr(2, 9)}`,
          label: item.label || 'Opción sin nombre',
          description: item.description || 'Sin descripción disponible',
        }));

      if (suggestions.length === 0) {
        throw new Error('No se generaron sugerencias válidas');
      }

      console.log(`Generadas ${suggestions.length} sugerencias con Claude`);
    } catch (parseError) {
      console.error('Error al parsear sugerencias:', parseError);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackSuggestions: Record<string, any[]> = {
        vacuna: [
          {
            value: 'antirrabica',
            label: 'Vacuna Antirrábica',
            description: 'Vacuna obligatoria contra la rabia',
          },
          {
            value: 'multiple',
            label: 'Vacuna Múltiple',
            description: 'Protege contra varias enfermedades',
          },
          {
            value: 'refuerzo-anual',
            label: 'Refuerzo Anual',
            description: 'Refuerzo de vacunación anual',
          },
        ],
        consulta: [
          {
            value: 'consulta-general',
            label: 'Consulta General',
            description: 'Consulta veterinaria de rutina',
          },
          {
            value: 'chequeo-anual',
            label: 'Chequeo Anual',
            description: 'Revisión médica completa anual',
          },
          {
            value: 'consulta-seguimiento',
            label: 'Consulta de Seguimiento',
            description: 'Seguimiento de tratamiento',
          },
        ],
        medicamento: [
          {
            value: 'antipulgas',
            label: 'Antipulgas',
            description: 'Tratamiento preventivo contra pulgas',
          },
          {
            value: 'desparasitante',
            label: 'Desparasitante',
            description: 'Elimina parásitos internos',
          },
          {
            value: 'suplemento-vitaminico',
            label: 'Suplemento Vitamínico',
            description: 'Suplemento nutricional',
          },
        ],
        cirugia: [
          {
            value: 'esterilizacion',
            label: 'Esterilización',
            description: 'Cirugía de esterilización',
          },
          { value: 'castracion', label: 'Castración', description: 'Cirugía de castración' },
          {
            value: 'cirugia-correctiva',
            label: 'Cirugía Correctiva',
            description: 'Corregir un problema',
          },
        ],
        examen: [
          {
            value: 'analisis-sangre',
            label: 'Análisis de Sangre',
            description: 'Examen de sangre completo',
          },
          { value: 'analisis-orina', label: 'Análisis de Orina', description: 'Examen de orina' },
          {
            value: 'radiografia',
            label: 'Radiografía',
            description: 'Estudio de imagen por rayos X',
          },
        ],
        emergencia: [
          {
            value: 'accidente',
            label: 'Accidente',
            description: 'Emergencia por accidente o trauma',
          },
          {
            value: 'intoxicacion',
            label: 'Intoxicación',
            description: 'Emergencia por intoxicación',
          },
          {
            value: 'dificultad-respiratoria',
            label: 'Dificultad Respiratoria',
            description: 'Emergencia respiratoria',
          },
        ],
      };

      suggestions = fallbackSuggestions[recordType] || fallbackSuggestions.consulta;
    }

    // ── Guardar en cache (TTL 30 días) ──
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('ai_cache')
      .upsert(
        {
          cache_key: cacheKey,
          function_name: 'medical-suggestions',
          result: suggestions,
          expires_at: expiresAt,
          hit_count: 0,
        },
        { onConflict: 'cache_key' }
      )
      .catch((err: unknown) => console.warn('Cache write failed:', err));

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in medical-suggestions function:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al procesar la solicitud. Por favor, intenta de nuevo más tarde.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
