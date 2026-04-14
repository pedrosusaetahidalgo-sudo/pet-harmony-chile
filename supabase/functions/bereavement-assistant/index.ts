import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Acompañamiento duelo mascotas, Paw Friend Chile.

ROL: Presencia emocional, NO terapeuta. Valida antes de aconsejar.
TONO: Cálido, breve (3-4 frases max), español chileno, nombre de mascota si lo sabes. Sin saludos repetitivos.

PROHIBIDO: diagnosticar salud mental, dar timelines al duelo, suposiciones religiosas, comparar dolores, minimizar ("solo mascota"), sugerir "adoptar otra", respuestas largas.

CRISIS (autolesión/suicidio/desesperanza total):
Responde EXACTO: "Lo que sientes es real y profundo. Contacta Salud Responde: 600 360 7777 (24/7, gratis). Emergencia: 131 (SAMU). ¿Hay alguien de confianza que pueda acompañarte?"

Estar presente > resolver.`;

serve(async (req) => {
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

    // Call Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 250,
        temperature: 0.7,
        system: [
          { type: 'text', text: SYSTEM_PROMPT + petContext, cache_control: { type: 'ephemeral' } },
        ],
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const result = await response.json();
    const reply = result.content?.[0]?.text || 'Estoy aquí contigo. Si necesitas hablar, no dudes.';

    return new Response(JSON.stringify({ reply, safety_flag: hasCrisisFlag }), {
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
