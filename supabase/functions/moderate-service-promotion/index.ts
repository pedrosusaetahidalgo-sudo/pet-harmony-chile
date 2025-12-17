import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    const { promotionId } = await req.json();

    if (!promotionId) {
      throw new Error('promotionId is required');
    }

    // Fetch the promotion post
    const { data: promotion, error: fetchError } = await supabaseClient
      .from('service_promotions')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (fetchError || !promotion) {
      throw new Error('Promotion not found');
    }

    console.log(`Moderando promoción: ${promotionId}`);

    // Use Lovable AI for content moderation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurada');
    }

    const systemPrompt = `Eres un moderador de contenido experto para una plataforma de servicios para mascotas en Chile.
Tu trabajo es evaluar publicaciones de promoción de servicios profesionales y determinar si son apropiadas, profesionales, y cumplen con las políticas de la plataforma.

CONTEXTO:
- Esta es una plataforma que conecta dueños de mascotas con proveedores de servicios profesionales
- Los proveedores pueden promocionar servicios como veterinarias, paseadores, entrenadores, peluquerías, etc.
- El contenido debe ser profesional, veraz, y apropiado para el contexto chileno

CRITERIOS DE EVALUACIÓN:

APROBADO (approved: true) si:
- El contenido es profesional y relevante para el tipo de servicio
- No contiene spam, contenido engañoso, o información falsa
- El lenguaje es apropiado y respetuoso
- No incluye información de contacto externa que viole las reglas (teléfonos, emails, redes sociales fuera de la plataforma)
- El servicio es legítimo y apropiado para una plataforma de mascotas
- El título y descripción son claros y descriptivos

RECHAZADO (approved: false) si:
- Contiene spam o contenido repetitivo
- Es engañoso o contiene información falsa
- Tiene lenguaje ofensivo, discriminatorio, o inapropiado
- Incluye información de contacto externa que viola las reglas de la plataforma
- Promociona servicios no relacionados con mascotas
- Contiene enlaces externos sospechosos o no permitidos
- Es una copia de otra publicación

SCORING (score: 0-100):
- 90-100: Excelente, contenido profesional y completo
- 70-89: Bueno, aprobado pero puede mejorarse
- 50-69: Regular, requiere revisión manual
- 0-49: Malo, probablemente rechazado

FORMATO DE RESPUESTA (OBLIGATORIO):
Debes responder SOLO con un JSON válido, sin texto adicional antes o después:
{
  "approved": true o false,
  "score": número entero del 0 al 100,
  "reason": "explicación clara y concisa en español (2-3 oraciones máximo)",
  "flags": ["array de strings con problemas específicos encontrados, o array vacío [] si no hay problemas"]
}

IMPORTANTE:
- Si el contenido es ambiguo o no estás seguro, usa approved: false y score < 70 para que requiera revisión manual
- Sé específico en los flags: lista problemas concretos como ["spam", "contacto_externo"] o ["lenguaje_inapropiado"]
- El reason debe explicar brevemente por qué se aprobó o rechazó
- Responde siempre en español de Chile`;

    const userPrompt = `Analiza la siguiente promoción de servicio para mascotas en la plataforma:

TÍTULO: "${promotion.title || 'Sin título'}"
DESCRIPCIÓN: "${promotion.description || 'Sin descripción'}"
TIPO DE SERVICIO: "${promotion.service_type || 'No especificado'}"

EVALÚA ESPECÍFICAMENTE:
1. Profesionalismo: ¿El contenido es profesional y apropiado para una plataforma de servicios?
2. Spam/Engaño: ¿Hay contenido repetitivo, engañoso, o información falsa?
3. Contacto Externo: ¿Incluye teléfonos, emails, o enlaces a redes sociales que violen las reglas?
4. Lenguaje: ¿El lenguaje es apropiado, respetuoso, y sin contenido ofensivo?
5. Relevancia: ¿El contenido es relevante y apropiado para el tipo de servicio "${promotion.service_type}"?
6. Legitimidad: ¿El servicio parece legítimo y apropiado para una plataforma de mascotas?

IMPORTANTE:
- Si el título o descripción están vacíos o son muy cortos (< 10 caracteres), considera esto en tu evaluación
- Si el tipo de servicio no coincide con el contenido, esto es una señal de alerta
- Si encuentras información de contacto externa (teléfonos, emails, @usuario, enlaces), esto debe resultar en approved: false

Proporciona tu evaluación en el formato JSON especificado.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Límite de solicitudes excedido');
      }
      if (response.status === 402) {
        throw new Error('Fondos insuficientes');
      }
      throw new Error('Error al obtener respuesta de moderación de IA');
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;
    
    // Parse AI response
    let moderationResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      moderationResult = JSON.parse(jsonMatch[0]);
      
      // Validar estructura mínima
      if (typeof moderationResult.approved !== 'boolean') {
        throw new Error('approved field missing or invalid');
      }
      
      if (typeof moderationResult.score !== 'number' || moderationResult.score < 0 || moderationResult.score > 100) {
        moderationResult.score = moderationResult.approved ? 75 : 40; // Default score
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
      // Fallback if AI doesn't return valid JSON
      console.error('Failed to parse AI response:', parseError);
      console.error('AI response content:', aiContent);
      
      // Análisis básico del contenido como fallback
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

    // Update promotion with AI moderation results
    const newStatus = moderationResult.approved && moderationResult.score >= 70 
      ? 'approved' 
      : 'pending'; // Keep as pending for manual review if score is low

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});