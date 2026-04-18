import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * generate-vet-patient-summary
 *
 * Genera un consolidado clínico IA a partir de todas las notas del vet
 * y registros médicos del dueño para una mascota específica.
 *
 * Input: { petId: string }
 * Output: { summary: PatientConsolidatedSummary, cached: boolean, remaining: number }
 */
serve(
  withTelemetry('generate-vet-patient-summary', async (req) => {
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
      if (!authHeader) return errorResponse('Authorization required', 401);

      const authToken = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
      if (userError || !userData.user) return errorResponse('User not authenticated', 401);

      // ---------- Rate limit (10 consolidados por hora) ----------
      const quota = await checkAiQuota(userData.user.id, {
        limit: 10,
        windowSeconds: 3600,
      });
      if (!quota.allowed) return rateLimitResponse(quota, corsHeaders);

      // ---------- Input ----------
      const { petId } = await req.json();
      if (!petId || typeof petId !== 'string') {
        return errorResponse('petId requerido', 400);
      }

      // ---------- Fetch data with admin client ----------
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Verificar que el vet tiene acceso al paciente
      const { data: providerRow } = await supabaseAdmin
        .from('service_providers')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (!providerRow) return errorResponse('No eres un proveedor registrado', 403);

      // Verificar que el vet tiene un pet_vet_link activo con esta mascota
      const { data: vetLink } = await supabaseAdmin
        .from('pet_vet_links')
        .select('id')
        .eq('pet_id', petId)
        .eq('provider_id', providerRow.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!vetLink) {
        return errorResponse(
          'No tienes un vínculo activo con esta mascota. Solicita acceso al dueño.',
          403
        );
      }

      // Check cache (24h TTL)
      const cacheKey = `vet-summary:${providerRow.id}:${petId}`;
      const { data: cached } = await supabaseAdmin
        .from('ai_cache')
        .select('result, expires_at')
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (cached && cached.expires_at && new Date(cached.expires_at) > new Date()) {
        console.log(`Cache hit for ${cacheKey}`);
        return jsonResponse({
          summary: cached.result,
          cached: true,
          remaining: quota.remaining,
        });
      }

      // Fetch pet info
      const { data: pet } = await supabaseAdmin
        .from('pets')
        .select(
          'name, species, breed, birth_date, weight, gender, neutered, allergies_food, allergies_medication, current_medications, chronic_conditions'
        )
        .eq('id', petId)
        .maybeSingle();

      if (!pet) return errorResponse('Mascota no encontrada', 404);

      // Fetch vet clinical notes (all from this provider for this pet)
      const { data: vetNotes } = await supabaseAdmin
        .from('vet_clinical_notes')
        .select(
          'note_type, title, description, consultation_date, created_at, source, raw_transcript, followup_required, followup_date, followup_reason, alternative_offered, alternatives_discussed'
        )
        .eq('pet_id', petId)
        .eq('provider_id', providerRow.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch owner medical records (last 30)
      const { data: medRecords } = await supabaseAdmin
        .from('medical_records')
        .select(
          'record_type, title, description, date, diagnosis, treatment, veterinarian_name, clinic_name, notes'
        )
        .eq('pet_id', petId)
        .order('date', { ascending: false })
        .limit(30);

      // ---------- Build context ----------
      const now = new Date();
      let petAge = 'desconocida';
      if (pet.birth_date) {
        const birth = new Date(pet.birth_date);
        const years = Math.floor(
          (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        const months = Math.floor(
          ((now.getTime() - birth.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) /
            (30.44 * 24 * 60 * 60 * 1000)
        );
        if (years > 0 && years <= 30) petAge = `${years} años ${months} meses`;
        else if (years === 0) petAge = `${months} meses`;
      }

      const petContext = [
        `Nombre: ${pet.name}`,
        `Especie: ${pet.species || 'no especificada'}`,
        pet.breed ? `Raza: ${pet.breed}` : null,
        `Edad: ${petAge}`,
        pet.weight ? `Peso: ${pet.weight} kg` : null,
        pet.gender ? `Sexo: ${pet.gender}` : null,
        pet.neutered !== null ? `Esterilizado: ${pet.neutered ? 'Sí' : 'No'}` : null,
        pet.allergies_food?.length
          ? `Alergias alimentarias: ${pet.allergies_food.join(', ')}`
          : null,
        pet.allergies_medication?.length
          ? `Alergias medicamentosas: ${pet.allergies_medication.join(', ')}`
          : null,
        pet.current_medications?.length
          ? `Medicación actual: ${pet.current_medications.join(', ')}`
          : null,
        pet.chronic_conditions?.length
          ? `Condiciones crónicas: ${pet.chronic_conditions.join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      // Format vet notes
      const vetNotesText = (vetNotes || [])
        .map((n: Record<string, unknown>, i: number) => {
          const date = (n.consultation_date as string) || (n.created_at as string) || 'sin fecha';
          const parts = [
            `--- Sesión ${i + 1} (${date}) ---`,
            `Tipo: ${n.note_type}`,
            `Título: ${n.title}`,
            n.description ? `Descripción: ${n.description}` : null,
            n.source === 'audio_transcription' ? '[Grabada por audio]' : '[Escrita manualmente]',
            n.followup_required ? `Seguimiento: ${n.followup_date} - ${n.followup_reason}` : null,
            n.alternative_offered ? `Alternativas: ${n.alternatives_discussed}` : null,
          ]
            .filter(Boolean)
            .join('\n');
          return parts;
        })
        .join('\n\n');

      // Format owner records
      const ownerRecordsText = (medRecords || [])
        .map((r: Record<string, unknown>, i: number) => {
          const parts = [
            `--- Registro dueño ${i + 1} (${r.date}) ---`,
            `Tipo: ${r.record_type}`,
            `Título: ${r.title}`,
            r.description ? `Descripción: ${r.description}` : null,
            r.diagnosis ? `Diagnóstico: ${r.diagnosis}` : null,
            r.veterinarian_name ? `Veterinario: ${r.veterinarian_name}` : null,
            r.clinic_name ? `Clínica: ${r.clinic_name}` : null,
            r.notes ? `Notas: ${r.notes}` : null,
          ]
            .filter(Boolean)
            .join('\n');
          return parts;
        })
        .join('\n\n');

      const totalSessions = (vetNotes?.length || 0) + (medRecords?.length || 0);

      if (totalSessions === 0) {
        return jsonResponse({
          summary: {
            diagnosticos: [],
            tratamientos: [],
            vacunas: [],
            alertas: [],
            seguimientos: [],
            resumen_general: 'No hay registros clínicos ni notas veterinarias para este paciente.',
            total_sesiones: 0,
            rango_fechas: null,
          },
          cached: false,
          remaining: quota.remaining,
        });
      }

      // ---------- Claude API ----------
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurada');

      // Bloque estatico (cacheable): rol + instrucciones + reglas + formato.
      // Se cachea 5 min. La 2a llamada del mismo vet solo paga el contexto variable.
      const systemPromptStatic = `Eres un asistente clínico veterinario experto. Tu trabajo es generar un CONSOLIDADO CLÍNICO completo a partir de todas las sesiones y registros de un paciente.

## INSTRUCCIONES

Analiza TODAS las sesiones clínicas (del veterinario) y registros médicos (del dueño) y genera un consolidado estructurado. Debes:

1. **Identificar diagnósticos recurrentes** — agrupar por condición, contar apariciones, indicar estado actual (activo/resuelto/en tratamiento)
2. **Listar tratamientos activos** — solo los vigentes, con medicamento, dosis, frecuencia y desde cuándo
3. **Estado de vacunas** — cuáles están al día, cuáles están próximas o vencidas
4. **Alertas clínicas** — alergias, interacciones, tendencias preocupantes (ej: peso subiendo), condiciones crónicas
5. **Seguimientos pendientes** — próximos controles agendados
6. **Resumen general** — 2-3 oraciones del estado actual del paciente

## REGLAS
- NO inventar datos que no estén en los registros
- Si un dato no existe, no lo incluyas en el array
- Priorizar la información más reciente
- Usar español chileno (tú, tienes)
- Ser conciso pero completo

## FORMATO DE SALIDA

Responde SOLO con JSON válido, sin markdown:
{"diagnosticos":[{"condicion":"nombre","apariciones":2,"estado":"activo|resuelto|en_tratamiento","ultima_fecha":"YYYY-MM-DD"}],"tratamientos":[{"medicamento":"nombre","dosis":"cantidad","frecuencia":"cada X horas","desde":"YYYY-MM-DD"}],"vacunas":[{"nombre":"nombre","fecha":"YYYY-MM-DD","estado":"al_dia|proxima|vencida","proxima":"YYYY-MM-DD o null"}],"alertas":[{"tipo":"alergia|interaccion|tendencia|cronico","descripcion":"texto corto","severidad":"alta|media|baja"}],"seguimientos":[{"fecha":"YYYY-MM-DD","razon":"texto"}],"resumen_general":"2-3 oraciones del estado actual del paciente","total_sesiones":numero,"rango_fechas":"fecha_inicio — fecha_fin"}`;

      // Bloque dinamico: datos del paciente. NO se cachea.
      const systemPromptDynamic = `## DATOS DEL PACIENTE
${petContext}

Total de sesiones a analizar: ${totalSessions}`;

      const userMessage = `Genera el consolidado clínico a partir de estos registros:

=== NOTAS CLÍNICAS DEL VETERINARIO (${vetNotes?.length || 0}) ===
${vetNotesText || 'Sin notas clínicas.'}

=== REGISTROS MÉDICOS DEL DUEÑO (${medRecords?.length || 0}) ===
${ownerRecordsText || 'Sin registros del dueño.'}`;

      console.log(
        `Generando consolidado para pet ${petId} (${totalSessions} registros, ${userMessage.length} chars)...`
      );

      const abortCtl = new AbortController();
      const fetchTimeout = setTimeout(() => abortCtl.abort(), 30000);

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
            max_tokens: 1500,
            temperature: 0.15,
            system: [
              { type: 'text', text: systemPromptStatic, cache_control: { type: 'ephemeral' } },
              { type: 'text', text: systemPromptDynamic },
            ],
            messages: [{ role: 'user', content: userMessage }],
          }),
        });
      } finally {
        clearTimeout(fetchTimeout);
      }

      if (!response.ok) {
        if (response.status === 429) {
          return errorResponse('Límite de solicitudes IA excedido. Intenta más tarde.', 429);
        }
        const errText = await response.text();
        console.error('Claude API error:', response.status, errText);
        return errorResponse('Error al generar el consolidado con IA', 500);
      }

      const claudeData = await response.json();
      const rawText = claudeData.content?.[0]?.text ?? '';

      // Log token usage
      if (claudeData.usage) {
        console.log(
          `Tokens: input=${claudeData.usage.input_tokens}, output=${claudeData.usage.output_tokens}`
        );
      }

      // Parse JSON response
      let parsed;
      try {
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const cleaned = jsonMatch ? jsonMatch[1] : rawText;
        parsed = JSON.parse(cleaned.trim());
      } catch {
        console.error('Failed to parse consolidado JSON:', rawText.slice(0, 500));
        // Fallback: return raw text as resumen
        parsed = {
          diagnosticos: [],
          tratamientos: [],
          vacunas: [],
          alertas: [],
          seguimientos: [],
          resumen_general: rawText.slice(0, 2000),
          total_sesiones: totalSessions,
          rango_fechas: null,
        };
      }

      // Ensure structure
      const summary = {
        diagnosticos: Array.isArray(parsed.diagnosticos) ? parsed.diagnosticos : [],
        tratamientos: Array.isArray(parsed.tratamientos) ? parsed.tratamientos : [],
        vacunas: Array.isArray(parsed.vacunas) ? parsed.vacunas : [],
        alertas: Array.isArray(parsed.alertas) ? parsed.alertas : [],
        seguimientos: Array.isArray(parsed.seguimientos) ? parsed.seguimientos : [],
        resumen_general: String(parsed.resumen_general || 'Sin resumen disponible').slice(0, 3000),
        total_sesiones: totalSessions,
        rango_fechas: parsed.rango_fechas || null,
      };

      // Cache for 24 hours
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('ai_cache')
        .upsert(
          {
            cache_key: cacheKey,
            function_name: 'generate-vet-patient-summary',
            result: summary,
            expires_at: expiresAt,
            created_at: now.toISOString(),
          },
          { onConflict: 'cache_key' }
        )
        .then(({ error }) => {
          if (error) console.error('Cache write failed (non-fatal):', error.message);
        });

      console.log('Consolidado generado exitosamente');

      return jsonResponse({
        summary,
        cached: false,
        remaining: quota.remaining,
      });
    } catch (error) {
      console.error('Error in generate-vet-patient-summary:', error);
      return errorResponse('Error al generar el consolidado. Intenta de nuevo más tarde.', 500);
    }
  })
);
