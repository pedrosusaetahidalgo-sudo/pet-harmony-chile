import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { parseJSON, sanitizeForPrompt, logEdgeFunctionCall } from '../_shared/ai-base.ts';

/**
 * symptom-triage — Guided symptom evaluation for pet owners.
 *
 * Walks the user through a structured triage flow:
 *   1. Classify main symptom category
 *   2. Ask 2-3 follow-up questions
 *   3. Classify urgency (emergencia / urgente / pronto / rutina)
 *
 * Input: { message, pet_id, conversation_history? }
 * Output: { step, message, urgency, category, questions, action, show_directory, disclaimer }
 */
serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const startTime = Date.now();
  let userId = '';

  try {
    // Auth
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
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    userId = userData.user.id;

    // Rate limit: 10/day
    const quota = await checkAiQuota(userId, { limit: 10, windowSeconds: 86400 });
    if (!quota.allowed) return rateLimitResponse(quota, cors);

    const body = await req.json();
    const { message, pet_id, conversation_history } = body;

    if (!message || typeof message !== 'string' || message.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'message is required (min 3 chars)' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (!pet_id || typeof pet_id !== 'string') {
      return new Response(JSON.stringify({ error: 'pet_id is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Fetch pet data
    const { data: pet } = await supabase
      .from('pets')
      .select(
        'name, species, breed, birth_date, weight, gender, neutered, allergies_food, allergies_medication, chronic_conditions'
      )
      .eq('id', pet_id)
      .eq('owner_id', userId)
      .maybeSingle();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Build pet context
    let petAge = 'edad desconocida';
    if (pet.birth_date) {
      const years = Math.floor(
        (Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (years >= 0 && years <= 30) petAge = `${years} años`;
    }

    const ctx = [
      `${pet.name}, ${pet.species}${pet.breed ? ` ${pet.breed}` : ''}, ${petAge}`,
      pet.weight ? `${pet.weight}kg` : null,
      pet.gender,
      pet.neutered ? 'esterilizado' : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const allergies = [pet.allergies_food, pet.allergies_medication].filter(Boolean);
    const conditions = Array.isArray(pet.chronic_conditions) ? pet.chronic_conditions : [];

    const systemPrompt = `Eres el sistema de triage veterinario de Paw Friend, una app chilena de salud de mascotas.

## PACIENTE
${ctx}${allergies.length ? `\nAlergias: ${allergies.join(', ')}` : ''}${conditions.length ? `\nCondiciones cronicas: ${conditions.join(', ')}` : ''}

## ROL
Guias al dueño a traves de una evaluacion estructurada de sintomas para determinar la urgencia. NO diagnosticas — clasificas urgencia y orientas al siguiente paso.

## PROTOCOLO DE TRIAGE

### Paso 1: Clasificar sintoma principal
Pregunta al dueño que observa. Clasifica en categoria:
digestivo, respiratorio, dermatologico, musculoesqueletico, neurologico, urinario, ocular_auditivo, comportamental, otro

### Paso 2: Preguntas de seguimiento (2-3 max)
- ¿Cuando empezo?
- ¿Ha empeorado, mejorado o se mantiene?
- ¿Come y bebe con normalidad?
- ¿Esta activo o letargico?

### Paso 3: Clasificar urgencia
- emergencia (rojo): Ir a urgencias AHORA
- urgente (naranja): Consultar veterinario hoy
- pronto (amarillo): Agendar consulta esta semana
- rutina (verde): Monitorear, agendar si persiste >3 dias

## EMERGENCIAS AUTOMATICAS (sin preguntas)
Convulsiones activas, dificultad respiratoria severa, sangrado abundante, sospecha envenenamiento, trauma severo, distension abdominal subita, perdida de consciencia, no orina >24h
→ urgency="emergencia", action="ir_urgencias", message empieza con "URGENTE:"

## REGLAS
1. Maximo 2-3 preguntas por turno
2. Español chileno (tu, tienes)
3. Empatico pero directo
4. NUNCA des un diagnostico
5. NUNCA sugieras medicamentos
6. Usa el nombre de la mascota
7. Al final del triage, sugiere agendar con un vet del directorio Paw Friend

## FORMATO (JSON sin markdown)
{"step":"clasificacion|preguntas|resultado","message":"texto para el usuario","urgency":"emergencia|urgente|pronto|rutina|null","category":"digestivo|respiratorio|dermatologico|musculoesqueletico|neurologico|urinario|ocular_auditivo|comportamental|otro|null","questions":["pregunta 1","pregunta 2"],"action":"ir_urgencias|agendar_hoy|agendar_semana|monitorear|null","show_directory":false,"disclaimer":"Triage orientativo. No reemplaza la consulta veterinaria."}`;

    // Build messages with conversation history
    const messages = [
      ...(Array.isArray(conversation_history)
        ? conversation_history.slice(-8).map((m: { role: string; content: string }) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.role === 'user' ? sanitizeForPrompt(m.content) : m.content.slice(0, 600),
          }))
        : []),
      { role: 'user', content: sanitizeForPrompt(message) },
    ];

    // Multi-turn requires manual API call (callClaude only supports single-turn)
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

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
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          temperature: 0.25,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages,
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

    // Token logging
    if (claudeData.usage) {
      console.log(
        JSON.stringify({
          event: 'ai_token_usage',
          model: 'claude-haiku-4-5-20251001',
          function: 'symptom-triage',
          input_tokens: claudeData.usage.input_tokens ?? 0,
          output_tokens: claudeData.usage.output_tokens ?? 0,
        })
      );
    }

    const fallback = {
      step: 'clasificacion',
      message: responseText || 'Cuéntame qué le pasa a tu mascota.',
      urgency: null,
      category: null,
      questions: [],
      action: null,
      show_directory: false,
      disclaimer: 'Triage orientativo. No reemplaza la consulta veterinaria.',
    };

    const parsed = parseJSON(responseText, fallback);

    // Ensure structure
    parsed.questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    parsed.disclaimer = parsed.disclaimer || fallback.disclaimer;
    parsed.show_directory =
      parsed.show_directory ??
      (parsed.action === 'agendar_hoy' || parsed.action === 'agendar_semana');

    logEdgeFunctionCall({
      functionName: 'symptom-triage',
      status: 'success',
      executionTimeMs: Date.now() - startTime,
      userId,
      metadata: { step: parsed.step, urgency: parsed.urgency },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ ...parsed, remaining: quota.remaining, pet_name: pet.name }),
      {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('symptom-triage error:', error);
    logEdgeFunctionCall({
      functionName: 'symptom-triage',
      status: 'error',
      executionTimeMs: Date.now() - startTime,
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
    }).catch(() => {});
    return new Response(JSON.stringify({ error: 'Error al procesar el triage.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
