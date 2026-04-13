import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
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

    const { promotionId } = await req.json();

    if (!promotionId || typeof promotionId !== 'string') {
      throw new Error('promotionId is required and must be a string');
    }

    const { data: promotion, error: fetchError } = await supabaseClient
      .from('service_promotions')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (fetchError || !promotion) {
      throw new Error('Promotion not found');
    }

    console.log(`Moderando promoción: ${promotionId}`);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }

    // Pre-filtro regex: rechazar automáticamente si contiene contacto externo
    const contentToCheck = `${promotion.title || ''} ${promotion.description || ''}`;
    const hasExternalContact =
      /(\+56[\d\s]{8,}|@[\w.-]+\.\w{2,}|\b\d{8,9}\b|https?:\/\/|www\.|\.com\b|\.cl\b)/i.test(
        contentToCheck
      );

    if (hasExternalContact) {
      const autoResult = {
        approved: false,
        score: 20,
        reason:
          'La promoción contiene información de contacto externo (teléfono, email o URL), lo cual no está permitido.',
        flags: ['contacto_externo_detectado'],
      };

      console.log('Rechazado por pre-filtro regex (contacto externo)');

      const { error: updateError } = await supabaseClient
        .from('service_promotions')
        .update({
          status: 'pending',
          ai_moderation_score: autoResult,
        })
        .eq('id', promotionId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, status: 'pending', moderation: autoResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Moderador contenido mascotas Chile.
APROBADO: profesional, relevante, sin contacto externo.
RECHAZADO: spam, engañoso, ofensivo, contacto externo, off-topic.

JSON: {"approved":true/false,"score":0-100,"reason":"2 oraciones","flags":[]}`;

    const userPrompt = `TÍTULO: "${promotion.title || 'Sin título'}"
DESCRIPCIÓN: "${promotion.description || 'Sin descripción'}"
SERVICIO: "${promotion.service_type || 'No especificado'}"`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-3-5',
        max_tokens: 200,
        temperature: 0.1,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Límite de solicitudes excedido');
      }
      throw new Error('Error al obtener respuesta de moderación de IA');
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.content?.[0]?.text;

    let moderationResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      moderationResult = JSON.parse(jsonMatch[0]);

      if (typeof moderationResult.approved !== 'boolean') {
        throw new Error('approved field missing or invalid');
      }

      if (
        typeof moderationResult.score !== 'number' ||
        moderationResult.score < 0 ||
        moderationResult.score > 100
      ) {
        moderationResult.score = moderationResult.approved ? 75 : 40;
      }

      if (!moderationResult.reason || typeof moderationResult.reason !== 'string') {
        moderationResult.reason = moderationResult.approved
          ? 'Contenido aprobado automáticamente'
          : 'Requiere revisión manual';
      }

      if (!Array.isArray(moderationResult.flags)) {
        moderationResult.flags = [];
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);

      const hasTitle = promotion.title && promotion.title.trim().length > 0;
      const hasDescription = promotion.description && promotion.description.trim().length > 10;
      const hasContactInfo = /(\+56|@|\b\d{8,9}\b|http|www\.|\.com|\.cl)/i.test(
        `${promotion.title} ${promotion.description}`
      );

      moderationResult = {
        approved: hasTitle && hasDescription && !hasContactInfo,
        score: hasTitle && hasDescription && !hasContactInfo ? 60 : 40,
        reason: 'Requiere revisión manual - no se pudo procesar la respuesta automática de IA',
        flags: hasContactInfo ? ['contacto_externo_posible'] : ['parse_error'],
      };
    }

    console.log('Resultado de moderación:', moderationResult);

    const newStatus =
      moderationResult.approved && moderationResult.score >= 70 ? 'approved' : 'pending';

    const { error: updateError } = await supabaseClient
      .from('service_promotions')
      .update({
        status: newStatus,
        ai_moderation_score: moderationResult,
        reviewed_at: newStatus === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', promotionId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        moderation: moderationResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in moderate-service-promotion:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al moderar la promoción. Por favor, intenta de nuevo más tarde.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
