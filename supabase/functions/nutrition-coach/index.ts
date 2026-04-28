import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { callClaude, parseJSON, logEdgeFunctionCall } from '../_shared/ai-base.ts';

/**
 * nutrition-coach — Personalized nutrition guidance for pets.
 *
 * Input: { pet_id, question? }
 * Output: { plan, forbidden_foods, safe_treats, allergy_warnings, vet_referral_needed, tip, disclaimer }
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

    const quota = await checkAiQuota(userId, { limit: 5, windowSeconds: 86400 });
    if (!quota.allowed) return rateLimitResponse(quota, cors);

    const { pet_id, question } = await req.json();
    if (!pet_id) {
      return new Response(JSON.stringify({ error: 'pet_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

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

    let petAge = 'desconocida';
    let ageYears = 0;
    if (pet.birth_date) {
      ageYears = Math.floor(
        (Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (ageYears >= 0 && ageYears <= 30) petAge = `${ageYears} años`;
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

    // Bloque ESTATICO del system: identico en cada call → cacheable (TTL 5 min,
    // ~90% ahorro en input tokens cuando hay >1 call por usuario en 5 min).
    const systemPrompt = `Eres el coach nutricional de Paw Friend, una app chilena de salud de mascotas.

## ROL
Orientas al dueño sobre alimentacion apropiada. NO recetas medicamentos ni suplementos — solo orientacion alimentaria general.

## AREAS
1. Tipo de alimento recomendado (seco, humedo, mixto)
2. Porciones aproximadas por peso y edad
3. Frecuencia de alimentacion
4. Alimentos PROHIBIDOS para la especie
5. Snacks seguros y opciones caseras
6. Hidratacion

## PROHIBIDOS
Perros: chocolate, uvas/pasas, cebolla, ajo, xilitol, aguacate/palta, nuez macadamia, alcohol
Gatos: cebolla, ajo, chocolate, cafeina, alcohol, uvas/pasas, leche de vaca (lactosa)

## REGLAS
1. Español chileno (tu, tienes)
2. Considerar alergias registradas
3. Si tiene condiciones cronicas (renal, hepatica, diabetes), derivar a vet para dieta terapeutica
4. NO recomendar marcas especificas
5. Porciones son aproximadas — derivar a vet para plan exacto
6. Maximo 200 palabras
7. Usar el nombre de la mascota

## FORMATO (JSON sin markdown)
{"plan":{"food_type":"seco|humedo|mixto","daily_portions":"descripcion","frequency":"veces al dia","hydration":"recomendacion"},"forbidden_foods":["alimento 1"],"safe_treats":["snack 1"],"allergy_warnings":["advertencia"],"vet_referral_needed":false,"vet_referral_reason":null,"tip":"1 tip practico personalizado","disclaimer":"Orientacion nutricional general. Para dietas terapeuticas, consulta a tu veterinario."}`;

    // Bloque DINAMICO: contexto del paciente cambia por call → fuera del cache.
    // Sprint 0 P0 AI-005: antes el contexto vivia dentro de systemPrompt y rompia
    // el cache hit en cada llamada. Ahora pasa por dynamicSystemText → callClaude
    // lo concatena como segundo bloque system sin cache_control.
    const dynamicPetBlock = `## PACIENTE
${ctx}${allergies.length ? `\nAlergias: ${allergies.join(', ')}` : ''}${conditions.length ? `\nCondiciones cronicas: ${conditions.join(', ')}` : ''}
Etapa de vida: ${ageYears <= 1 ? 'cachorro/gatito' : ageYears >= 8 ? 'senior' : 'adulto'}`;

    const userMsg = question
      ? `Pregunta del dueño: "${String(question).slice(0, 300)}"\nGenera orientacion nutricional personalizada.`
      : `Genera un plan nutricional general para ${pet.name}.`;

    const raw = await callClaude({
      systemPrompt,
      dynamicSystemText: dynamicPetBlock,
      userMessage: userMsg,
      maxTokens: 500,
      temperature: 0.3,
      model: 'claude-haiku-4-5-20251001',
    });

    const fallback = {
      plan: {
        food_type: 'mixto',
        daily_portions: 'Consulta a tu veterinario',
        frequency: '2 veces al dia',
        hydration: 'Agua fresca siempre disponible',
      },
      forbidden_foods:
        pet.species === 'gato'
          ? ['cebolla', 'ajo', 'chocolate', 'leche de vaca']
          : ['chocolate', 'uvas', 'cebolla', 'xilitol'],
      safe_treats: ['zanahoria cruda', 'manzana sin semillas'],
      allergy_warnings: [],
      vet_referral_needed: false,
      vet_referral_reason: null,
      tip: `Mantén agua fresca siempre disponible para ${pet.name}.`,
      disclaimer:
        'Orientación nutricional general. Para dietas terapéuticas, consulta a tu veterinario.',
    };

    const parsed = parseJSON(raw, fallback);
    parsed.forbidden_foods = Array.isArray(parsed.forbidden_foods)
      ? parsed.forbidden_foods
      : fallback.forbidden_foods;
    parsed.safe_treats = Array.isArray(parsed.safe_treats)
      ? parsed.safe_treats
      : fallback.safe_treats;
    parsed.allergy_warnings = Array.isArray(parsed.allergy_warnings) ? parsed.allergy_warnings : [];
    parsed.disclaimer = parsed.disclaimer || fallback.disclaimer;

    logEdgeFunctionCall({
      functionName: 'nutrition-coach',
      status: 'success',
      executionTimeMs: Date.now() - startTime,
      userId,
    }).catch(() => {});

    return new Response(
      JSON.stringify({ ...parsed, pet_name: pet.name, remaining: quota.remaining }),
      {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('nutrition-coach error:', error);
    logEdgeFunctionCall({
      functionName: 'nutrition-coach',
      status: 'error',
      executionTimeMs: Date.now() - startTime,
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
    }).catch(() => {});
    return new Response(JSON.stringify({ error: 'Error al generar orientación nutricional.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
