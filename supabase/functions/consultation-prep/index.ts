import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  callClaude,
  parseJSON,
  sanitizeForPrompt,
  logEdgeFunctionCall,
} from '../_shared/ai-base.ts';

/**
 * consultation-prep — Generates a checklist of questions and info
 * to help the pet owner prepare for a vet visit.
 *
 * Input: { pet_id, reason }
 * Output: { questions_for_vet, info_checklist, observations_to_record, tip, disclaimer }
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

    const { pet_id, reason } = await req.json();
    if (!pet_id) {
      return new Response(JSON.stringify({ error: 'pet_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'reason required (min 5 chars)' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { data: pet } = await supabase
      .from('pets')
      .select(
        'name, species, breed, birth_date, weight, gender, neutered, allergies_food, allergies_medication, chronic_conditions, current_medications'
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

    // Fetch upcoming reminders
    const { data: reminders } = await supabase
      .from('pet_reminders')
      .select('type, title, due_date')
      .eq('pet_id', pet_id)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })
      .limit(5);

    // Fetch last 5 medical records
    const { data: records } = await supabase
      .from('medical_records')
      .select('record_type, title, date')
      .eq('pet_id', pet_id)
      .order('date', { ascending: false })
      .limit(5);

    let petAge = 'desconocida';
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
    const meds = Array.isArray(pet.current_medications) ? pet.current_medications : [];

    const reminderCtx = reminders?.length
      ? `\nRecordatorios pendientes: ${reminders.map((r) => `${r.type}: ${r.title} (${r.due_date})`).join('; ')}`
      : '';
    const recordCtx = records?.length
      ? `\nUltimos registros: ${records.map((r) => `[${r.date}] ${r.record_type}: ${r.title}`).join('; ')}`
      : '';

    const systemPrompt = `Eres el preparador de consultas de Paw Friend, una app chilena de salud de mascotas.

## PACIENTE
${ctx}${allergies.length ? `\nAlergias: ${allergies.join(', ')}` : ''}${conditions.length ? `\nCondiciones cronicas: ${conditions.join(', ')}` : ''}${meds.length ? `\nMedicamentos: ${meds.join(', ')}` : ''}${reminderCtx}${recordCtx}

## ROL
Ayudas al dueño a prepararse para una consulta veterinaria generando:
1. Lista de preguntas relevantes para hacerle al vet
2. Checklist de información que el vet necesitará
3. Observaciones a registrar antes de la consulta

## REGLAS
1. Español chileno (tu, tienes)
2. Personaliza segun especie, raza, edad y condiciones del paciente
3. Si tiene medicamentos activos, recordar mencionarlos al vet
4. Si tiene alergias, incluir en el checklist
5. Maximo 8 preguntas sugeridas
6. Ser practico y concreto
7. Usa el nombre de la mascota

## FORMATO (JSON sin markdown)
{"questions_for_vet":["¿Pregunta 1?","¿Pregunta 2?"],"info_checklist":["Llevar carnet de vacunacion","Anotar ultima desparasitacion"],"observations_to_record":["Registrar frecuencia del sintoma","Anotar horarios"],"tip":"consejo practico para la consulta","disclaimer":"Lista sugerida para aprovechar mejor tu consulta veterinaria."}`;

    const raw = await callClaude({
      systemPrompt,
      userMessage: `Motivo de la consulta: "${sanitizeForPrompt(reason)}"\nGenera la preparacion para la consulta de ${pet.name}.`,
      maxTokens: 500,
      temperature: 0.3,
      model: 'claude-haiku-4-5-20251001',
    });

    const fallback = {
      questions_for_vet: [
        `¿Cómo se ve el estado general de ${pet.name}?`,
        '¿Necesita alguna vacuna o desparasitación?',
        '¿Hay algo que deba cambiar en su alimentación?',
      ],
      info_checklist: [
        'Llevar carnet de vacunación',
        'Anotar síntomas observados y cuándo empezaron',
      ],
      observations_to_record: ['Frecuencia del síntoma', 'Cambios en apetito o comportamiento'],
      tip: `Anota tus preguntas antes de la consulta para no olvidar nada sobre ${pet.name}.`,
      disclaimer: 'Lista sugerida para aprovechar mejor tu consulta veterinaria.',
    };

    const parsed = parseJSON(raw, fallback);
    parsed.questions_for_vet = Array.isArray(parsed.questions_for_vet)
      ? parsed.questions_for_vet.slice(0, 8)
      : fallback.questions_for_vet;
    parsed.info_checklist = Array.isArray(parsed.info_checklist)
      ? parsed.info_checklist
      : fallback.info_checklist;
    parsed.observations_to_record = Array.isArray(parsed.observations_to_record)
      ? parsed.observations_to_record
      : fallback.observations_to_record;
    parsed.disclaimer = parsed.disclaimer || fallback.disclaimer;

    logEdgeFunctionCall({
      functionName: 'consultation-prep',
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
    console.error('consultation-prep error:', error);
    logEdgeFunctionCall({
      functionName: 'consultation-prep',
      status: 'error',
      executionTimeMs: Date.now() - startTime,
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
    }).catch(() => {});
    return new Response(JSON.stringify({ error: 'Error al preparar la consulta.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
