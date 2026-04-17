import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Helper: JSON error response */
function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(
  withTelemetry('ocr-vaccination-card', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // ── Auth ─────────────────────────────────────────────────────────────
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return errorResponse('Authorization required', 401);
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);

      if (userError || !userData.user) {
        return errorResponse('User not authenticated', 401);
      }

      const userId = userData.user.id;

      // ── Rate limit: pivot médico → todos usan límite premium (3/day) ─────
      // Reactivar check de is_premium cuando USER_PREMIUM=true.
      const today = new Date().toISOString().split('T')[0];
      const DAILY_LIMIT = 3;
      const SKILL_NAME = 'ocr-vaccination-card';

      const { data: usage } = await supabase
        .from('ai_usage')
        .select('calls_today, calls_total, last_reset_date')
        .eq('user_id', userId)
        .eq('skill_name', SKILL_NAME)
        .maybeSingle();

      let callsToday = 0;
      if (usage) {
        callsToday = usage.last_reset_date === today ? usage.calls_today : 0;
      }

      if (callsToday >= DAILY_LIMIT) {
        return errorResponse(
          `Límite diario alcanzado (${DAILY_LIMIT} escaneos). Intenta de nuevo mañana.`,
          429,
          { rate_limited: true }
        );
      }

      // ── Parse & validate input ───────────────────────────────────────────
      const body = await req.json();
      const { image_base64, pet_id } = body;

      if (!image_base64 || typeof image_base64 !== 'string') {
        return errorResponse('image_base64 is required', 400);
      }

      if (!pet_id || typeof pet_id !== 'string') {
        return errorResponse('pet_id is required', 400);
      }

      // Sanity check: base64 should look reasonable (at least 1 KB, max ~10 MB)
      const estimatedBytes = (image_base64.length * 3) / 4;
      if (estimatedBytes < 1024) {
        return errorResponse(
          'Image too small — provide a clear photo of the vaccination card',
          400
        );
      }
      if (estimatedBytes > 10 * 1024 * 1024) {
        return errorResponse('Image too large (max 10 MB)', 400);
      }

      // ── Verify pet ownership ─────────────────────────────────────────────
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('id, name')
        .eq('id', pet_id)
        .eq('owner_id', userId)
        .maybeSingle();

      if (petError || !pet) {
        return errorResponse('Pet not found or access denied', 404);
      }

      // ── Call Claude Vision API ───────────────────────────────────────────
      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) {
        return errorResponse('AI service not configured', 503);
      }

      // Detect media type from base64 header or default to jpeg
      let mediaType = 'image/jpeg';
      if (image_base64.startsWith('/9j/')) {
        mediaType = 'image/jpeg';
      } else if (image_base64.startsWith('iVBOR')) {
        mediaType = 'image/png';
      } else if (image_base64.startsWith('R0lGO')) {
        mediaType = 'image/gif';
      } else if (image_base64.startsWith('UklGR')) {
        mediaType = 'image/webp';
      }

      const systemPrompt = `Eres un sistema OCR especializado en carnets de vacunación veterinarios de Chile.

## TAREA
Analiza la imagen del carnet de vacunación de "${pet.name}" y extrae toda la información visible.

## REGLAS
1. Solo extrae lo que puedes leer con confianza en la imagen.
2. Si una fecha es ilegible, usa null (NUNCA inventes fechas).
3. Si no es un carnet de vacunación, responde con arrays vacíos y una nota explicativa.
4. Fechas en formato ISO: YYYY-MM-DD.
5. Diferencia entre vacunas y desparasitaciones (antiparasitarios).

## VACUNAS COMUNES EN CHILE (para validar nombres)
Perros: Séxtuple/Óctuple, Antirrábica, KC (Kennel Cough), Leptospirosis
Gatos: Triple felina, Antirrábica, Leucemia felina (FeLV)
Desparasitantes: Drontal, Milbemax, Endogard, Nexgard, Bravecto, Simparica

## FORMATO DE SALIDA (JSON sin markdown)
{"vaccines":[{"name":"","date":"YYYY-MM-DD|null","batch":"lote o null","vet_name":"nombre vet o null"}],"deworming":[{"product":"","date":"YYYY-MM-DD|null"}],"notes":"observaciones sobre legibilidad"}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s for vision

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
            max_tokens: 600,
            temperature: 0,
            system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: mediaType,
                      data: image_base64,
                    },
                  },
                  {
                    type: 'text',
                    text: `Extrae la información del carnet de vacunación de mi mascota "${pet.name}". Devuelve solo el JSON estructurado.`,
                  },
                ],
              },
            ],
            // web_search eliminado: calendario vacunal se valida client-side
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (claudeResponse.status === 429) {
        return errorResponse('AI service rate limited. Try again in a moment.', 429);
      }

      if (!claudeResponse.ok) {
        console.error('Claude API error:', claudeResponse.status);
        return errorResponse('AI service temporarily unavailable', 502);
      }

      const claudeData = await claudeResponse.json();
      // web_search produces multiple content blocks; grab the last text block
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textBlocks = (claudeData.content ?? []).filter((b: any) => b.type === 'text');
      const responseText: string = textBlocks[textBlocks.length - 1]?.text ?? '';

      // ── Parse Claude response ────────────────────────────────────────────
      const stripFences = (s: string) =>
        s
          .replace(/```(?:json)?\s*/gi, '')
          .replace(/```/g, '')
          .trim();

      type OcrResult = {
        vaccines: Array<{
          name: string;
          date: string | null;
          batch: string | null;
          vet_name: string | null;
        }>;
        deworming: Array<{
          product: string;
          date: string | null;
        }>;
        notes: string;
        alertas?: string[];
      };

      let parsed: OcrResult | null = null;

      try {
        const cleaned = stripFences(responseText);
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        parsed = null;
      }

      // Validate structure
      if (!parsed || !Array.isArray(parsed.vaccines) || !Array.isArray(parsed.deworming)) {
        return errorResponse(
          'No se pudo extraer información del carnet. Asegúrate de que la foto sea clara y muestre el carnet completo.',
          422
        );
      }

      // Sanitize: ensure notes is a string
      parsed.notes = typeof parsed.notes === 'string' ? parsed.notes : '';
      parsed.alertas = Array.isArray(parsed.alertas) ? parsed.alertas : [];

      // ── Update rate limit counter ────────────────────────────────────────
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
          .eq('skill_name', SKILL_NAME);
      } else {
        await supabase.from('ai_usage').insert({
          user_id: userId,
          skill_name: SKILL_NAME,
          calls_today: 1,
          calls_total: 1,
          last_reset_date: today,
          last_called_at: new Date().toISOString(),
        });
      }

      const remaining = DAILY_LIMIT - callsToday - 1;

      // ── Return parsed result ─────────────────────────────────────────────
      return new Response(
        JSON.stringify({
          ...parsed,
          pet_id,
          pet_name: pet.name,
          remaining_today: remaining,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error: unknown) {
      console.error('ocr-vaccination-card error:', error);
      return new Response(
        JSON.stringify({
          error: 'An internal error occurred. Please try again later.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  })
);
