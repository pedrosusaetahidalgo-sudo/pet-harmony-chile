import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { logEdgeFunctionCall } from '../_shared/ai-base.ts';

/**
 * wound-vision — Visual wound/lesion urgency assessment via Claude Vision.
 *
 * Input: { image_base64, pet_id, description? }
 * Output: { description, urgency, urgency_label, observations, recommended_action, show_directory, image_quality, disclaimer }
 */
serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const startTime = Date.now();
  let userId = '';

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    userId = userData.user.id;

    // Rate limit: 3/day (Vision is expensive)
    const quota = await checkAiQuota(userId, { limit: 3, windowSeconds: 86400 });
    if (!quota.allowed) return rateLimitResponse(quota, cors);

    const { image_base64, pet_id, description: userDescription } = await req.json();

    if (!image_base64 || typeof image_base64 !== 'string') {
      return new Response(JSON.stringify({ error: 'image_base64 required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (!pet_id) {
      return new Response(JSON.stringify({ error: 'pet_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Validate image size
    const estimatedBytes = (image_base64.length * 3) / 4;
    if (estimatedBytes < 1024) {
      return new Response(JSON.stringify({ error: 'Imagen muy pequeña' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (estimatedBytes > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Imagen muy grande (max 10 MB)' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Fetch pet
    const { data: pet } = await supabase
      .from('pets')
      .select('name, species, breed, birth_date, weight, allergies_food, allergies_medication')
      .eq('id', pet_id)
      .eq('owner_id', userId)
      .maybeSingle();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let petAge = '';
    if (pet.birth_date) {
      const years = Math.floor(
        (Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (years >= 0 && years <= 30) petAge = `, ${years} años`;
    }

    const petCtx = `${pet.name} (${pet.species}${pet.breed ? ` ${pet.breed}` : ''}${petAge}${pet.weight ? `, ${pet.weight}kg` : ''})`;

    // Detect media type
    let mediaType = 'image/jpeg';
    if (image_base64.startsWith('/9j/')) mediaType = 'image/jpeg';
    else if (image_base64.startsWith('iVBOR')) mediaType = 'image/png';
    else if (image_base64.startsWith('R0lGO')) mediaType = 'image/gif';
    else if (image_base64.startsWith('UklGR')) mediaType = 'image/webp';

    const systemPrompt = `Eres un sistema de evaluacion visual veterinaria de Paw Friend Chile.

## PACIENTE
${petCtx}

## ROL
Evaluas fotos de heridas, lesiones o condiciones visibles en mascotas para orientar al dueño sobre la urgencia. NO diagnosticas — clasificas la apariencia visual y orientas al siguiente paso.

## SEMAFORO DE URGENCIA
- rojo: Aspecto severo, ir a urgencias (herida profunda, hueso expuesto, sangrado activo, hinchazón severa, quemadura, ojo muy afectado)
- naranja: Aspecto preocupante, consultar vet pronto (herida abierta sin sangrado activo, inflamación notable, lesión cutánea extensa)
- amarillo: Monitorear, agendar consulta si no mejora en 48h (irritación leve, rascado, pequeña lesión superficial)
- verde: Apariencia normal o cosmética, no urgente

## REGLAS
1. NUNCA des un diagnóstico ("parece ser X"). Usa "podría estar relacionado con" o "consulta a tu veterinario"
2. NUNCA sugieras tratamientos caseros para heridas abiertas
3. Si la imagen no muestra claramente una lesión o no es de una mascota, indícalo
4. Si la imagen es borrosa o no permite evaluación, pide una foto más clara
5. Español chileno (tu, tienes). Usa el nombre de la mascota.
6. Incluye SIEMPRE disclaimer

## FORMATO (JSON sin markdown)
{"description":"Lo que observo en la imagen (2-3 oraciones, lenguaje simple)","urgency":"rojo|naranja|amarillo|verde","urgency_label":"Urgencias ahora|Consulta pronto|Monitorear|No urgente","observations":["observacion 1","observacion 2"],"recommended_action":"accion recomendada (1 oración)","show_directory":true,"image_quality":"buena|aceptable|insuficiente","disclaimer":"Evaluación visual orientativa. No reemplaza el examen presencial de un veterinario."}`;

    const userMsg = userDescription
      ? `El dueño describe: "${String(userDescription).slice(0, 300)}". Evalúa la imagen de ${pet.name}.`
      : `Evalúa la imagen de ${pet.name} y clasifica la urgencia.`;

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let claudeResponse;
    try {
      claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          temperature: 0.1,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: image_base64 },
                },
                { type: 'text', text: userMsg },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!claudeResponse.ok) {
      if (claudeResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limited' }), {
          status: 429,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`CLAUDE_ERROR_${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const textBlocks = (claudeData.content ?? []).filter(
      (b: { type: string }) => b.type === 'text'
    );
    const responseText = textBlocks[textBlocks.length - 1]?.text ?? '';

    if (claudeData.usage) {
      console.log(
        JSON.stringify({
          event: 'ai_token_usage',
          model: 'claude-sonnet-4-6',
          function: 'wound-vision',
          input_tokens: claudeData.usage.input_tokens ?? 0,
          output_tokens: claudeData.usage.output_tokens ?? 0,
        })
      );
    }

    const fallback = {
      description: 'No se pudo evaluar la imagen correctamente.',
      urgency: 'amarillo' as const,
      urgency_label: 'Monitorear',
      observations: [],
      recommended_action: 'Consulta a tu veterinario para una evaluación presencial.',
      show_directory: true,
      image_quality: 'insuficiente' as const,
      disclaimer:
        'Evaluación visual orientativa. No reemplaza el examen presencial de un veterinario.',
    };

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : fallback;
    } catch {
      parsed = fallback;
    }

    parsed.observations = Array.isArray(parsed.observations) ? parsed.observations : [];
    parsed.disclaimer = parsed.disclaimer || fallback.disclaimer;
    parsed.show_directory = parsed.show_directory ?? true;

    logEdgeFunctionCall({
      functionName: 'wound-vision',
      status: 'success',
      executionTimeMs: Date.now() - startTime,
      userId,
      metadata: { urgency: parsed.urgency, image_quality: parsed.image_quality },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ ...parsed, pet_name: pet.name, remaining: quota.remaining }),
      {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('wound-vision error:', error);
    logEdgeFunctionCall({
      functionName: 'wound-vision',
      status: 'error',
      executionTimeMs: Date.now() - startTime,
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
    }).catch(() => {});
    return new Response(JSON.stringify({ error: 'Error al evaluar la imagen.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
