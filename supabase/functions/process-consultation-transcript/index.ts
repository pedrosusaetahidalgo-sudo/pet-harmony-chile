import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { withTelemetry } from '../_shared/telemetry.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

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

serve(
  withTelemetry('process-consultation-transcript', async (req) => {
    const corsHeaders = getCorsHeaders(req);
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

      // ---------- Validar input (lee callerKind antes del gate) ----------
      const { transcript, petName, petSpecies, callerKind = 'vet' } = await req.json();
      const isOwnerCall = callerKind === 'owner';

      // ---------- Gate B2B SOLO para vets. Owners (refactor maestro §2.6.2) skip ----
      if (!isOwnerCall) {
        const { data: providerRow } = await supabaseClient
          .from('service_providers')
          .select('provider_plan')
          .eq('user_id', userData.user.id)
          .maybeSingle();
        const callerPlan = providerRow?.provider_plan ?? 'provider_free';
        const PLANS_WITH_AUDIO = new Set([
          'provider_premium',
          'provider_clinic_starter',
          'provider_pro_max',
        ]);
        if (!PLANS_WITH_AUDIO.has(callerPlan)) {
          return new Response(
            JSON.stringify({
              error:
                'La transcripcion de audio esta disponible desde el plan Premium. Actualiza tu plan en /provider/upgrade.',
              code: 'plan_feature_locked',
              upgrade_required: 'provider_premium',
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // ---------- Rate limit ----------
      // Vet: 15 por hora (consultas largas). Owner: 5 por hora (observaciones).
      const quota = await checkAiQuota(userData.user.id, {
        limit: isOwnerCall ? 5 : 15,
        windowSeconds: 3600,
      });
      if (!quota.allowed) {
        return rateLimitResponse(quota, corsHeaders);
      }

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
        ? `${isOwnerCall ? 'Mascota' : 'Paciente'}: ${String(petName).slice(0, 50)}${petSpecies ? ` (${String(petSpecies).slice(0, 30)})` : ''}.`
        : '';

      // Prompt vet (clínico, multi-tema). Refactor §2.6.2 agrega prompt owner abajo.
      const vetSystemPrompt = `Eres un escribano veterinario clínico chileno. Tu trabajo es convertir transcripciones de audio de consultas veterinarias en resúmenes clínicos estructurados.

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

      // Prompt owner: el dueño graba observaciones de la mascota (no consulta vet).
      // Output más liviano: categoría timeline + severidad + sugerencia de acción.
      const ownerSystemPrompt = `Eres asistente de Paw Friend que ayuda al dueño de una mascota a estructurar observaciones grabadas en audio. NO eres veterinario, NO diagnostiques: tu rol es organizar lo que el dueño dijo en un evento del timeline de la mascota.

${petContext}

## REGLAS DE FILTRADO

La transcripción viene de un micrófono abierto. El dueño está describiendo algo que vio o pasó con su mascota. DEBES:

1. **Filtrar ruido**: muletillas ("eh", "mmm"), repeticiones, onomatopeyas, conversaciones con otra persona.
2. **Extraer la observación**: qué notó (síntoma, comportamiento, evento), cuándo, qué hizo.
3. **NO diagnosticar**. NO recetar. NO interpretar como vet.
4. **Categorizar el evento del timeline** en una de estas 10 categorías canónicas: health, weight, nutrition, hygiene, activity, social, purchases, home, milestone, legal.
5. **Estimar severidad** según contexto:
   - "info": observación rutinaria sin urgencia (ej: "comió bien hoy", "le corté las uñas")
   - "concern": algo que vale tener registrado y monitorear (ej: "comió menos que de costumbre", "rascado más de lo normal")
   - "urgent": síntoma que sugiere consultar al vet pronto (ej: "vomitó 3 veces", "no quiere caminar", "respira raro")
6. **Sugerir acción** según severidad:
   - "log_only": solo dejar registrado
   - "consult_vet_soon": agendar visita en próximos días
   - "consult_vet_urgent": consultar al vet hoy o mañana
7. **NO inventar** detalles que no estén en la transcripción.

## FORMATO DE SALIDA

Responde SOLO con JSON válido, sin markdown:
{"category":"health|weight|nutrition|hygiene|activity|social|purchases|home|milestone|legal","title":"<60 chars descripción corta","description":"texto limpio con la observación, en bullets si hay varios puntos","severity":"info|concern|urgent","suggested_action":"log_only|consult_vet_soon|consult_vet_urgent","reason":"breve por qué la severidad/acción"}

Usa español chileno (tú, tienes). Si el audio no tiene contenido útil, devuelve description: "Audio sin contenido relevante" y severity: "info".`;

      const systemPrompt = isOwnerCall ? ownerSystemPrompt : vetSystemPrompt;

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
        return new Response(
          JSON.stringify({ error: 'Error al procesar la transcripción con IA' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
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
        // Fallback distinto según caller
        parsed = isOwnerCall
          ? {
              category: 'health',
              title: 'Observación del tutor',
              description: rawText.slice(0, 1500),
              severity: 'info',
              suggested_action: 'log_only',
              reason: null,
            }
          : {
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

      console.log(`Transcripción procesada exitosamente (caller=${callerKind})`);

      // Schema distinto según caller. El cliente vet sigue consumiendo `summary`.
      // El cliente owner consume `observation`.
      if (isOwnerCall) {
        const VALID_CATEGORIES = new Set([
          'health',
          'weight',
          'nutrition',
          'hygiene',
          'activity',
          'social',
          'purchases',
          'home',
          'milestone',
          'legal',
        ]);
        const VALID_SEVERITY = new Set(['info', 'concern', 'urgent']);
        const VALID_ACTION = new Set(['log_only', 'consult_vet_soon', 'consult_vet_urgent']);

        const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'health';
        const severity = VALID_SEVERITY.has(parsed.severity) ? parsed.severity : 'info';
        const suggestedAction = VALID_ACTION.has(parsed.suggested_action)
          ? parsed.suggested_action
          : 'log_only';

        return new Response(
          JSON.stringify({
            observation: {
              category,
              title: String(parsed.title || 'Observación').slice(0, 120),
              description: String(parsed.description || '').slice(0, 2000),
              severity,
              suggested_action: suggestedAction,
              reason: parsed.reason ? String(parsed.reason).slice(0, 300) : null,
            },
            remaining: quota.remaining,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vet (legacy) — formato sin cambios
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
  })
);
