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

    const systemPrompt = `Eres un escribano veterinario clínico chileno. Tu trabajo es convertir transcripciones de audio de consultas veterinarias en resúmenes clínicos estructurados.

${petContext}

## REGLAS DE FILTRADO DE AUDIO

La transcripción viene de un micrófono abierto durante la consulta. DEBES:

1. **IGNORAR ruido ambiental** transcrito como texto sin sentido: palabras sueltas, repeticiones sin contexto, onomatopeyas del animal, sonidos ("mmm", "eh", "ah"), frases cortadas incomprensibles.
2. **IGNORAR conversación social** no clínica: saludos, despedidas, comentarios sobre el clima, preguntas sobre estacionamiento, conversaciones con recepcionista, comentarios personales ("qué lindo tu perrito"), risas.
3. **IGNORAR instrucciones al personal** no relevantes al paciente: "pásame el termómetro", "anota en el sistema", "el siguiente paciente".
4. **EXTRAER SOLO información clínicamente relevante**:
   - Motivo de consulta
   - Síntomas reportados por el dueño (cuándo empezaron, frecuencia, severidad)
   - Hallazgos del examen físico (temperatura, peso, auscultación, palpación)
   - Diagnóstico o sospecha diagnóstica
   - Tratamiento prescrito (medicamento, dosis, frecuencia, duración)
   - Indicaciones al dueño (dieta, restricciones, cuidados)
   - Exámenes solicitados
   - Alternativas ofrecidas
   - Fecha y razón de control/seguimiento
5. **Si la transcripción es mayormente ruido** con poca o nula información clínica, indicar en description: "Transcripción con contenido clínico insuficiente - revisar manualmente"
6. **NO inventar** datos que no estén en la transcripción. Si algo no se menciona, no lo incluyas.

## FORMATO DE SALIDA

Responde SOLO con JSON válido, sin markdown ni texto adicional:
{"noteType":"consulta|vacuna|control|cirugia|urgencia|otro","title":"<80 chars resumen conciso","description":"bullets con guiones: - motivo\\n- hallazgos\\n- diagnóstico\\n- tratamiento (nombre+dosis+frecuencia)\\n- indicaciones","alternativeOffered":false,"alternativesDiscussed":"texto o null","followupRequired":false,"followupDate":"YYYY-MM-DD o null","followupReason":"texto o null"}

Usa español chileno (tú, tienes). Default noteType: "consulta".`;

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
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 700,
          temperature: 0.2,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
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
