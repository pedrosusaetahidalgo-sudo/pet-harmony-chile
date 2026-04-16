import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { getCorsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `Acompañamiento duelo mascotas, Paw Friend Chile.

ROL: Presencia emocional, NO terapeuta. Valida antes de aconsejar.
TONO: Cálido, breve (3-4 frases max), español chileno, nombre de mascota si lo sabes. Sin saludos repetitivos.

PROHIBIDO: diagnosticar salud mental, dar timelines al duelo, suposiciones religiosas, comparar dolores, minimizar ("solo mascota"), sugerir "adoptar otra", respuestas largas.

CRISIS (autolesión/suicidio/desesperanza total):
Responde EXACTO: "Lo que sientes es real y profundo. Contacta Salud Responde: 600 360 7777 (24/7, gratis). Emergencia: 131 (SAMU). ¿Hay alguien de confianza que pueda acompañarte?"

DETECCIÓN DE CRISIS (segunda capa):
Si detectas señales de crisis emocional severa, ideación suicida o autolesión en el mensaje del usuario — incluso si no usa las palabras exactas — responde con el mensaje de CRISIS de arriba y agrega al final de tu respuesta la etiqueta [SAFETY_FLAG].

Estar presente > resolver.`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error('User not authenticated');

    const userId = userData.user.id;
    const { message, pet_id } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required');
    }

    // Rate limit: 30 messages/day
    const { data: quota } = await supabase.rpc('check_and_increment_ai_quota', {
      p_user_id: userId,
      p_limit: 30,
      p_window_seconds: 86400,
    });

    if (quota === false) {
      return new Response(
        JSON.stringify({
          reply:
            'Has alcanzado el límite de mensajes por hoy. Mañana estaré aquí para ti. Si necesitas ayuda ahora, llama a Salud Responde: 600 360 7777.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pet context if available
    let petContext = '';
    if (pet_id) {
      const { data: pet } = await supabase
        .from('pets')
        .select('name, species, birth_date, passed_away_at, memorial_message')
        .eq('id', pet_id)
        .maybeSingle();

      if (pet) {
        const age = pet.birth_date
          ? Math.floor(
              (Date.now() - new Date(pet.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;
        petContext = `\n\nContexto de la mascota: ${pet.name} (${pet.species}${age ? `, vivió ${age} años` : ''}). Falleció el ${pet.passed_away_at ? new Date(pet.passed_away_at).toLocaleDateString('es-CL') : 'fecha no registrada'}.`;
        if (pet.memorial_message) {
          petContext += ` Mensaje del dueño: "${pet.memorial_message}"`;
        }
      }
    }

    // Check for safety flags in the message
    const crisisKeywords = [
      // Español — ideación directa
      'no quiero seguir',
      'no aguanto más',
      'quiero acabar',
      'quiero morirme',
      'me quiero morir',
      'quiero estar con ella',
      'quiero estar con él',
      'no vale la pena vivir',
      'suicid',
      'hacerme daño',
      'no quiero vivir',
      // Español — variaciones y typos comunes
      'no kiero vivir',
      'me kiero morir',
      'no tiene sentido',
      'mejor muerta',
      'mejor muerto',
      'ya no puedo más',
      'quiero desaparecer',
      'ojalá me muriera',
      'no soporto más',
      // Inglés — usuarios bilingües
      'want to die',
      'kill myself',
      'end it all',
      'not worth living',
      'i want to end',
    ];
    const lowerMessage = message.toLowerCase();
    const hasCrisisFlag = crisisKeywords.some((kw) => lowerMessage.includes(kw));

    if (hasCrisisFlag) {
      // Log safety concern
      await supabase.from('bereavement_safety_logs').insert({
        user_id: userId,
        flag_type: 'crisis_keywords',
        detected_phrase: message.substring(0, 200),
        resources_provided: ['Salud Responde 600 360 7777', 'SAMU 131'],
      });
    }

    // Call Claude (with timeout to prevent worker hang)
    const abortCtl = new AbortController();
    const fetchTimeout = setTimeout(() => abortCtl.abort(), 15000);
    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: abortCtl.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 250,
          temperature: 0.7,
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT + petContext,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: message }],
        }),
      });
    } finally {
      clearTimeout(fetchTimeout);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const result = await response.json();
    let reply = result.content?.[0]?.text || 'Estoy aquí contigo. Si necesitas hablar, no dudes.';

    // Dual-layer crisis detection: Claude may add [SAFETY_FLAG] tag
    const claudeDetectedCrisis = reply.includes('[SAFETY_FLAG]');
    reply = reply.replace(/\s*\[SAFETY_FLAG\]\s*/g, '').trim();
    const safetyFlag = hasCrisisFlag || claudeDetectedCrisis;

    // Log Claude-detected crisis if keyword detection missed it
    if (claudeDetectedCrisis && !hasCrisisFlag) {
      await supabase.from('bereavement_safety_logs').insert({
        user_id: userId,
        flag_type: 'ai_detected_crisis',
        detected_phrase: message.substring(0, 200),
        resources_provided: ['Salud Responde 600 360 7777', 'SAMU 131'],
      });
    }

    return new Response(JSON.stringify({ reply, safety_flag: safetyFlag }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('bereavement-assistant error:', err);
    return new Response(
      JSON.stringify({
        error:
          'No pude procesar tu mensaje. Si necesitas ayuda ahora, llama a Salud Responde: 600 360 7777.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
