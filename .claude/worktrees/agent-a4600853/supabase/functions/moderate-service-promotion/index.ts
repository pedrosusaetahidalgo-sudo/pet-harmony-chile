import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const systemPrompt = `Eres un moderador de contenido para una plataforma de servicios para mascotas en Chile.
Evalúa publicaciones de promoción de servicios profesionales.

CRITERIOS:
- APROBADO si: contenido profesional, relevante, lenguaje apropiado, sin contacto externo
- RECHAZADO si: spam, engañoso, ofensivo, contacto externo, no relacionado con mascotas

FORMATO DE RESPUESTA (OBLIGATORIO - solo JSON):
{
  "approved": true o false,
  "score": 0-100,
  "reason": "explicación en español (2-3 oraciones)",
  "flags": ["problemas encontrados"] o []
}`;

    const userPrompt = `Analiza esta promoción de servicio para mascotas:

TÍTULO: "${promotion.title || 'Sin título'}"
DESCRIPCIÓN: "${promotion.description || 'Sin descripción'}"
TIPO DE SERVICIO: "${promotion.service_type || 'No especificado'}"

Evalúa profesionalismo, spam, contacto externo, lenguaje y relevancia.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      })
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

      if (typeof moderationResult.score !== 'number' || moderationResult.score < 0 || moderationResult.score > 100) {
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
        flags: hasContactInfo ? ['contacto_externo_posible'] : ['parse_error']
      };
    }

    console.log('Resultado de moderación:', moderationResult);

    const newStatus = moderationResult.approved && moderationResult.score >= 70
      ? 'approved'
      : 'pending';

    const { error: updateError } = await supabaseClient
      .from('service_promotions')
      .update({
        status: newStatus,
        ai_moderation_score: moderationResult,
        reviewed_at: newStatus === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', promotionId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        moderation: moderationResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in moderate-service-promotion:', error);
    return new Response(
      JSON.stringify({ error: "Error al moderar la promoción. Por favor, intenta de nuevo más tarde." }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
