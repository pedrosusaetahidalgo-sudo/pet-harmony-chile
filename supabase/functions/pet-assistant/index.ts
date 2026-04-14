import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';

const allowedOrigins = ['https://pawfriend.cl', 'http://localhost:8080', 'http://localhost:5173'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;

    const quota = await checkAiQuota(userId, { limit: 5 });
    if (!quota.allowed) {
      return rateLimitResponse(quota, getCorsHeaders(req));
    }

    // Parse input
    const body = await req.json();
    const { question, pet_id } = body;

    // Sanitizar input del usuario contra prompt injection
    const sanitize = (s: string) => {
      let t = s.trim().slice(0, 500);
      t = t.replace(
        /(?:ignore|olvida|ignora|forget)\s+(?:previous|anterior|all|todo|las)\s+(?:instructions?|instrucciones?)/gi,
        '[filtrado]'
      );
      t = t.replace(/(?:system|sistema)\s*(?:prompt|mensaje)/gi, '[filtrado]');
      t = t.replace(/(?:you are now|ahora eres|actúa como|act as|pretend)/gi, '[filtrado]');
      return t;
    };

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Question is required (min 3 characters)' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    if (!pet_id || typeof pet_id !== 'string') {
      return new Response(JSON.stringify({ error: 'pet_id is required' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Fetch user plan to differentiate limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle();
    const isPremium = profile?.is_premium === true;
    const dailyLimit = isPremium ? 5 : 1;

    // Rate limiting: free = 1/day, premium = 5/day
    const today = new Date().toISOString().split('T')[0];
    const { data: usage, error: usageError } = await supabase
      .from('ai_usage')
      .select('calls_today, last_reset_date')
      .eq('user_id', userId)
      .eq('skill_name', 'pet-assistant')
      .maybeSingle();

    let callsToday = 0;
    if (usage) {
      callsToday = usage.last_reset_date === today ? usage.calls_today : 0;
    }

    if (callsToday >= dailyLimit) {
      const msg = !isPremium
        ? 'Llegaste al límite de 1 consulta diaria del plan gratuito. Mejora a Premium para consultas ilimitadas.'
        : `Límite diario alcanzado (${dailyLimit} consultas). Renueva mañana.`;
      return new Response(
        JSON.stringify({
          error: msg,
          rate_limited: true,
          is_premium: isPremium,
        }),
        {
          status: 429,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch pet data
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', pet_id)
      .eq('owner_id', userId)
      .maybeSingle();

    if (petError || !pet) {
      return new Response(JSON.stringify({ error: 'Pet not found or access denied' }), {
        status: 404,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Fetch medical records (last 10)
    const { data: records } = await supabase
      .from('medical_records')
      .select('record_type, title, description, date, veterinarian_name, clinic_name, notes')
      .eq('pet_id', pet_id)
      .order('date', { ascending: false })
      .limit(10);

    // Fetch reminders
    const { data: reminders } = await supabase
      .from('pet_reminders')
      .select('type, title, due_date, is_completed')
      .eq('pet_id', pet_id)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })
      .limit(5);

    // Build context — clamp defensivo: si la edad sale absurda (>30 años) la
    // marcamos como desconocida para no envenenar el prompt del LLM con datos
    // corruptos que llevarían a recomendaciones peligrosas.
    let petAge = 'edad desconocida';
    if (pet.birth_date) {
      const ageYears = Math.floor(
        (Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (ageYears >= 0 && ageYears <= 30) {
        petAge = `${ageYears} años`;
      }
    }

    // Contexto compacto — solo campos con valor (reduce tokens ~40%)
    const ctx: string[] = [
      `${pet.name}, ${pet.species}${pet.breed ? ` ${pet.breed}` : ''}, ${petAge}`,
    ];
    if (pet.weight) ctx.push(`${pet.weight}kg`);
    if (pet.gender) ctx.push(pet.gender);
    if (pet.neutered) ctx.push('esterilizado');
    const allergies = [
      pet.allergies_food,
      pet.allergies_medication,
      pet.allergies_environmental,
    ].filter(Boolean);
    if (allergies.length) ctx.push(`Alergias: ${allergies.join(', ')}`);
    if (pet.chronic_conditions_detail)
      ctx.push(`Crónicas: ${JSON.stringify(pet.chronic_conditions_detail)}`);
    if (pet.current_medications) ctx.push(`Meds: ${JSON.stringify(pet.current_medications)}`);

    const historial = records?.length
      ? records.map((r) => `[${r.date}] ${r.record_type}: ${r.title}`).join('; ')
      : 'sin historial';
    const recordatorios = reminders?.length
      ? reminders.map((r) => `${r.type}: ${r.title} (${r.due_date})`).join('; ')
      : '';

    const systemPrompt = `Vet Paw Friend Chile. Mascota: ${ctx.join(' | ')}${historial !== 'sin historial' ? `\nHist: ${historial}` : ''}${recordatorios ? `\nRec: ${recordatorios}` : ''}

Nombre real. Grave→urgencia+vet. Alergias→advertir. NO diagnosticar. 2-3 oraciones. Chileno.
JSON: {"respuesta":"","nivel_urgencia":"bajo|medio|alto","requiere_veterinario":false,"sugerencias_accion":[]}`;

    // Call Claude
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
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
          temperature: 0.3,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: sanitize(question) }],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (claudeResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: 'AI service rate limited. Try again in a moment.' }),
        {
          status: 429,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    if (!claudeResponse.ok) {
      const errorBody = await claudeResponse.text();
      console.error('[pet-assistant] Claude API error:', claudeResponse.status, errorBody);
      const hint = claudeResponse.status === 401 ? ' (API key inválida)'
        : claudeResponse.status === 400 ? ' (request inválido)'
        : claudeResponse.status === 403 ? ' (sin acceso al modelo)'
        : '';
      return new Response(
        JSON.stringify({
          error: `Servicio de IA temporalmente no disponible${hint}. Intenta de nuevo.`,
        }),
        {
          status: 502,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    const claudeData = await claudeResponse.json();
    // web_search produces multiple content blocks; grab the last text block
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (claudeData.content ?? []).filter((b: any) => b.type === 'text');
    const responseText: string = textBlocks[textBlocks.length - 1]?.text ?? '';

    // Parse response — Claude a veces envuelve el JSON en ```json ... ```
    // markdown fences, así que los limpiamos antes de parsear.
    const stripFences = (s: string) =>
      s
        .replace(/```(?:json)?\s*/gi, '')
        .replace(/```/g, '')
        .trim();

    let parsed: {
      respuesta: string;
      nivel_urgencia: 'bajo' | 'medio' | 'alto';
      requiere_veterinario: boolean;
      sugerencias_accion: string[];
    } | null = null;

    try {
      const cleaned = stripFences(responseText);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed = null;
    }

    if (!parsed || typeof parsed.respuesta !== 'string') {
      // Fallback: si el JSON vino mal o truncado, mostramos el texto pero sin
      // los artefactos de markdown/JSON para no exponer ```json al usuario.
      let cleanText = stripFences(responseText);
      // Si quedó algo tipo `{ "respuesta": "..."` truncado, intentamos extraer
      // solo el valor de respuesta con un regex tolerante.
      const respuestaMatch = cleanText.match(/"respuesta"\s*:\s*"([^"]*)/);
      if (respuestaMatch) {
        cleanText = respuestaMatch[1];
      }
      parsed = {
        respuesta: cleanText || 'No pude procesar tu consulta. Intenta reformular la pregunta.',
        nivel_urgencia: 'bajo',
        requiere_veterinario: false,
        sugerencias_accion: [],
      };
    }

    // Asegurar arrays presentes
    parsed.sugerencias_accion = Array.isArray(parsed.sugerencias_accion)
      ? parsed.sugerencias_accion
      : [];

    // Update rate limit
    if (usage) {
      await supabase
        .from('ai_usage')
        .update({
          calls_today: callsToday + 1,
          calls_total: (usage.calls_total || 0) + 1,
          last_reset_date: today,
          last_called_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('skill_name', 'pet-assistant');
    } else {
      await supabase.from('ai_usage').insert({
        user_id: userId,
        skill_name: 'pet-assistant',
        calls_today: 1,
        calls_total: 1,
        last_reset_date: today,
        last_called_at: new Date().toISOString(),
      });
    }

    const remaining = 5 - callsToday - 1;

    return new Response(
      JSON.stringify({
        ...parsed,
        recordatorios_relevantes: [],
        pet_name: pet.name,
        remaining,
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('pet-assistant error:', error);
    return new Response(
      JSON.stringify({
        error: 'An internal error occurred. Please try again later.',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
