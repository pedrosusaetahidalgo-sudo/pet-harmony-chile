import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errResp(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(
  withTelemetry('verify-vet-document', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // ── Auth: solo admins pueden invocar ─────────────────────────────────
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return errResp('Authorization required', 401);

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return errResp('Not authenticated', 401);

      // Check admin access
      const { data: adminAccess } = await supabase
        .from('admin_access')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!adminAccess) return errResp('Admin access required', 403);

      // ── Parse input ─────────────────────────────────────────────────────
      const body = await req.json();
      const { provider_id, image_base64 } = body;

      if (!provider_id) return errResp('provider_id is required', 400);
      if (!image_base64) return errResp('image_base64 is required', 400);

      // Validate image size (1KB to 10MB)
      const estimatedBytes = (image_base64.length * 3) / 4;
      if (estimatedBytes < 1024) return errResp('Imagen muy pequeña', 400);
      if (estimatedBytes > 10 * 1024 * 1024) return errResp('Imagen muy grande (max 10MB)', 400);

      // ── Fetch provider data ─────────────────────────────────────────────
      const { data: provider, error: provError } = await supabase
        .from('service_providers')
        .select('id, display_name, license_number, user_id')
        .eq('id', provider_id)
        .maybeSingle();

      if (provError || !provider) return errResp('Proveedor no encontrado', 404);

      // ── Detect media type ───────────────────────────────────────────────
      let mediaType = 'image/jpeg';
      if (image_base64.startsWith('/9j/')) mediaType = 'image/jpeg';
      else if (image_base64.startsWith('iVBOR')) mediaType = 'image/png';
      else if (image_base64.startsWith('R0lGO')) mediaType = 'image/gif';
      else if (image_base64.startsWith('UklGR')) mediaType = 'image/webp';

      // ── Call Claude Vision for document analysis ────────────────────────
      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) return errResp('AI no configurada', 503);

      const systemPrompt = `Eres un verificador de documentos veterinarios para Chile.

Analiza la imagen del documento (título profesional, carnet Colmevet, certificado, cédula) y extrae:
1. Nombre completo que aparece en el documento
2. Número de registro/colegiado si aparece
3. Tipo de documento (titulo_profesional, carnet_colmevet, certificado_especialidad, cedula_identidad, otro)
4. Calidad del documento (high, medium, low, unreadable)

Luego compara con los datos del proveedor:
- Nombre registrado: "${provider.display_name}"
- N° Colmevet registrado: "${provider.license_number || 'no proporcionado'}"

Calcula un score de confianza 0-100 basado en:
- Match de nombre (fuzzy, considerar nombres parciales, tildes, mayúsculas): 0-50 puntos
- Match de número de licencia: 0-30 puntos
- Calidad del documento: 0-20 puntos

Responde SOLO con JSON sin markdown:
{
  "extracted_name": "nombre del documento o null si ilegible",
  "extracted_license": "número extraído o null",
  "document_type": "tipo",
  "document_quality": "high|medium|low|unreadable",
  "name_match_score": 0.0-1.0,
  "license_match": true|false,
  "confidence_score": 0-100,
  "reasoning": "explicación breve de la evaluación"
}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

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
            temperature: 0,
            system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: { type: 'base64', media_type: mediaType, data: image_base64 },
                  },
                  {
                    type: 'text',
                    text: 'Analiza este documento veterinario y compara con los datos registrados.',
                  },
                ],
              },
            ],
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (claudeResponse.status === 429)
        return errResp('IA sobrecargada, intenta en un momento', 429);
      if (!claudeResponse.ok) {
        console.error('Claude API error:', claudeResponse.status);
        return errResp('Servicio de IA no disponible', 502);
      }

      const claudeData = await claudeResponse.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textBlocks = (claudeData.content ?? []).filter((b: any) => b.type === 'text');
      const responseText: string = textBlocks[textBlocks.length - 1]?.text ?? '';

      // ── Parse response ──────────────────────────────────────────────────
      type VerifResult = {
        extracted_name: string | null;
        extracted_license: string | null;
        document_type: string;
        document_quality: string;
        name_match_score: number;
        license_match: boolean;
        confidence_score: number;
        reasoning: string;
      };

      let parsed: VerifResult | null = null;
      try {
        const cleaned = responseText
          .replace(/```(?:json)?\s*/gi, '')
          .replace(/```/g, '')
          .trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {
        parsed = null;
      }

      if (!parsed || typeof parsed.confidence_score !== 'number') {
        return errResp('No se pudo analizar el documento. Intenta con una foto más clara.', 422);
      }

      // Clamp score
      parsed.confidence_score = Math.max(0, Math.min(100, Math.round(parsed.confidence_score)));

      const autoApproved = parsed.confidence_score >= 80;

      // ── Save to vet_verification_results ─────────────────────────────────
      await supabase.from('vet_verification_results').upsert(
        {
          provider_id,
          confidence_score: parsed.confidence_score,
          extracted_name: parsed.extracted_name,
          extracted_license: parsed.extracted_license,
          name_match_score: parsed.name_match_score,
          document_quality: parsed.document_quality,
          auto_approved: autoApproved,
          reviewed_at: autoApproved ? new Date().toISOString() : null,
          reviewed_by: autoApproved ? 'ai-verification' : null,
        },
        { onConflict: 'provider_id' }
      );

      // ── Auto-approve if score >= 80 ──────────────────────────────────────
      if (autoApproved) {
        await supabase
          .from('service_providers')
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
            verified_by: 'ai-verification',
          })
          .eq('id', provider_id);
      }

      // ── Log to system_health_log ────────────────────────────────────────
      const startTime = Date.now();
      await supabase.from('system_health_log').insert({
        function_name: 'verify-vet-document',
        status: 'success',
        execution_time_ms: Date.now() - startTime,
        metadata: {
          provider_id,
          confidence_score: parsed.confidence_score,
          auto_approved: autoApproved,
        },
      });

      // ── Audit log ───────────────────────────────────────────────────────
      await supabase.from('admin_audit_log').insert({
        admin_user_id: userData.user.id,
        action: autoApproved ? 'provider.verify' : 'provider.verify_review',
        target_type: 'provider',
        target_id: provider_id,
        details: {
          confidence_score: parsed.confidence_score,
          auto_approved: autoApproved,
          extracted_name: parsed.extracted_name,
        },
      });

      return jsonResp({
        ...parsed,
        auto_approved: autoApproved,
        provider_id,
        provider_name: provider.display_name,
      });
    } catch (error: unknown) {
      console.error('verify-vet-document error:', error);
      return errResp('Error interno. Intenta de nuevo.', 500);
    }
  })
);
