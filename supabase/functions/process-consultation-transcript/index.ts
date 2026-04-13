import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sanitiza la transcripcion para prevenir prompt injection.
 * Permite texto largo (hasta 5000 chars) porque una consulta de 15 min
 * puede generar ~2000-3000 palabras.
 */
function sanitizeTranscript(input: string): string {
  let s = input.trim().slice(0, 5000);
  s = s.replace(
    /(?:ignore|olvida|ignora|forget)\s+(?:previous|anterior|all|todo|las)\s+(?:instructions?|instrucciones?)/gi,
    '[filtrado]'
  );
  s = s.replace(/(?:system|sistema)\s*(?:prompt|mensaje)/gi, '[filtrado]');
  s = s.replace(/(?:you are now|ahora eres|actúa como|act as|pretend)/gi, '[filtrado]');
  s = s.replace(/```[\s\S]*?```/g, '[código removido]');
  return s;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---------- Auth ----------
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

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

    // ---------- Rate limit (15 por hora) ----------
    const quota = await checkAiQuota(userData.user.id, {
      limit: 15,
      windowSeconds: 3600,
    });
    if (!quota.allowed) {
      return rateLimitResponse(quota, corsHeaders);
    }

    // ---------- Validar input ----------
    const { transcript, petName, petSpecies } = await req.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
      return new Response(
        JSON.stringify({
          error: 'Se requiere una transcripción de al menos 20 caracteres.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const cleanTranscript = sanitizeTranscript(transcript);

    // ---------- Claude API ----------
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }

    const petContext = petName
      ? `Paciente: ${String(petName).slice(0, 50)}${petSpecies ? ` (${String(petSpecies).slice(0, 30)})` : ''}.`
      : '';

    const systemPrompt = `Eres un escribano veterinario chileno. Tu trabajo es tomar la transcripcion de una consulta veterinaria y generar un resumen clinico estructurado.

${petContext}

Responde SOLO con un objeto JSON valido (sin markdown, sin texto adicional) con estos campos:

{
  "noteType": "consulta" | "vacuna" | "control" | "cirugia" | "urgencia" | "otro",
  "title": "Titulo breve de la consulta (max 80 chars)",
  "description": "Resumen detallado con bullet points usando guiones. Incluye: motivo de consulta, hallazgos clinicos, diagnostico, tratamiento indicado, medicamentos (nombre, dosis, frecuencia), instrucciones al dueno.",
  "alternativeOffered": true/false (si el vet menciono opciones mas economicas),
  "alternativesDiscussed": "Descripcion de la alternativa (solo si alternativeOffered es true, sino null)",
  "followupRequired": true/false (si se menciono proxima cita o control),
  "followupDate": "YYYY-MM-DD o null (fecha aproximada del proximo control si se menciono)",
  "followupReason": "Razon del seguimiento (solo si followupRequired es true, sino null)"
}

REGLAS:
- Español chileno (tu, tienes)
- Captura TODOS los datos clinicos mencionados: medicamentos, dosis, examenes
- Si se mencionan correos, telefonos o nombres, incluyelos en la descripcion
- Si no queda claro el tipo de consulta, usa "consulta"
- El titulo debe ser conciso y descriptivo (ej: "Control anual + hemograma")
- La descripcion debe ser completa pero sin inventar datos que no esten en la transcripcion`;

    console.log(`Procesando transcripción de consulta (${cleanTranscript.length} chars)...`);

    const abortCtl = new AbortController();
    const fetchTimeout = setTimeout(() => abortCtl.abort(), 25000);
    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: abortCtl.signal,
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          temperature: 0.2,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Transcripción de la consulta:\n\n${cleanTranscript}`,
            },
          ],
        }),
      });
    } finally {
      clearTimeout(fetchTimeout);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Límite de solicitudes IA excedido. Intenta de nuevo más tarde.',
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Error al procesar la transcripción con IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await response.json();
    const rawText = claudeData.content?.[0]?.text ?? '';

    // Intentar parsear JSON (puede venir envuelto en ```json ... ```)
    let parsed;
    try {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleaned = jsonMatch ? jsonMatch[1] : rawText;
      parsed = JSON.parse(cleaned.trim());
    } catch {
      console.error('Failed to parse Claude response as JSON:', rawText);
      // Fallback: devolver respuesta genérica con el texto como descripción
      parsed = {
        noteType: 'consulta',
        title: 'Resumen de consulta',
        description: rawText.slice(0, 2000),
        alternativeOffered: false,
        alternativesDiscussed: null,
        followupRequired: false,
        followupDate: null,
        followupReason: null,
      };
    }

    console.log('Transcripción procesada exitosamente');

    return new Response(
      JSON.stringify({
        summary: {
          noteType: parsed.noteType || 'consulta',
          title: String(parsed.title || 'Resumen de consulta').slice(0, 200),
          description: String(parsed.description || '').slice(0, 5000),
          alternativeOffered: !!parsed.alternativeOffered,
          alternativesDiscussed: parsed.alternativesDiscussed || null,
          followupRequired: !!parsed.followupRequired,
          followupDate: parsed.followupDate || null,
          followupReason: parsed.followupReason || null,
        },
        remaining: quota.remaining,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-consultation-transcript:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al procesar la solicitud. Por favor, intenta de nuevo más tarde.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
