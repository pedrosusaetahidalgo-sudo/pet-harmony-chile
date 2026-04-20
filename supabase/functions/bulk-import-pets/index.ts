/**
 * Edge Function: bulk-import-pets
 *
 * Server-side bulk insert de mascotas desde un refugio. Evita timeouts
 * cliente para lotes grandes (hasta 500 filas).
 *
 * POST body:
 *   {
 *     adoption_center_id: string,
 *     filename?: string,
 *     rows: Array<{ name, species, breed?, sex?, birth_year?, birth_month?,
 *                   size?, description?, temperament?, photo_url?,
 *                   sterilized?, vaccinated?, dewormed?, microchip?,
 *                   health_status?, shelter_notes? }>
 *   }
 *
 * Auth: requiere caller autenticado que sea owner del adoption_center.
 *
 * Proceso:
 *  1. Valida caller es shelter (adoption_centers.user_id = caller).
 *  2. Crea row en adoption_bulk_imports (status='processing').
 *  3. Insert en pets en batches de 50.
 *  4. Actualiza adoption_bulk_imports con success_count + errors.
 *  5. Retorna { success, inserted, errors }.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_ROWS = 500;
const BATCH_SIZE = 50;

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

function toBool(v: unknown): boolean | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (['si', 'sí', 'yes', 'true', '1'].includes(s)) return true;
  if (['no', 'false', '0'].includes(s)) return false;
  return null;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : null;
}

interface RawRow {
  name?: unknown;
  species?: unknown;
  breed?: unknown;
  sex?: unknown;
  birth_year?: unknown;
  birth_month?: unknown;
  size?: unknown;
  description?: unknown;
  temperament?: unknown;
  photo_url?: unknown;
  sterilized?: unknown;
  vaccinated?: unknown;
  dewormed?: unknown;
  microchip?: unknown;
  health_status?: unknown;
  shelter_notes?: unknown;
}

serve(
  withTelemetry('bulk-import-pets', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // Auth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return errorResponse('Authorization required', 401);
      const token = authHeader.replace('Bearer ', '');

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return errorResponse('User not authenticated', 401);
      const callerId = userData.user.id;

      // Body
      const body = await req.json();
      const adoption_center_id = body?.adoption_center_id;
      const filename = body?.filename || null;
      const rows: RawRow[] = Array.isArray(body?.rows) ? body.rows : [];

      if (!adoption_center_id || typeof adoption_center_id !== 'string') {
        return errorResponse('adoption_center_id required', 400);
      }
      if (rows.length === 0) return errorResponse('rows array empty', 400);
      if (rows.length > MAX_ROWS) {
        return errorResponse(`max ${MAX_ROWS} rows per import`, 400);
      }

      // Verificar ownership del shelter
      const { data: shelter, error: shelterError } = await supabase
        .from('adoption_centers')
        .select('id, user_id')
        .eq('id', adoption_center_id)
        .eq('user_id', callerId)
        .maybeSingle();

      if (shelterError || !shelter) {
        return errorResponse('Only shelter owner can bulk import', 403);
      }

      // Rate limit: max 5 bulk imports por shelter por dia
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentImports } = await supabase
        .from('adoption_bulk_imports')
        .select('id', { count: 'exact', head: true })
        .eq('adoption_center_id', adoption_center_id)
        .gte('created_at', oneDayAgo);

      if ((recentImports ?? 0) >= 5) {
        return errorResponse('Limite: 5 bulk imports por dia. Intenta mañana.', 429);
      }

      // Crear audit record
      const { data: audit, error: auditError } = await supabase
        .from('adoption_bulk_imports')
        .insert({
          adoption_center_id,
          uploaded_by: callerId,
          filename,
          total_rows: rows.length,
          status: 'processing',
        })
        .select('id')
        .single();

      if (auditError || !audit) {
        return errorResponse('Failed to create audit record: ' + (auditError?.message || ''), 500);
      }

      // Normalizar filas
      const now = new Date().toISOString();
      const petsPayload = rows.map((r) => ({
        owner_id: null,
        name: String(r.name || '')
          .trim()
          .slice(0, 80),
        species: String(r.species || '')
          .toLowerCase()
          .trim()
          .slice(0, 40),
        breed: r.breed ? String(r.breed).trim().slice(0, 80) : null,
        sex: r.sex ? String(r.sex).toLowerCase().trim() : null,
        birth_year: toInt(r.birth_year),
        birth_month: toInt(r.birth_month),
        size: r.size ? String(r.size).toLowerCase().trim() : null,
        description: r.description ? String(r.description).slice(0, 2000) : null,
        temperament: r.temperament ? String(r.temperament).slice(0, 500) : null,
        photo_url: r.photo_url ? String(r.photo_url).slice(0, 500) : null,
        microchip_number: r.microchip ? String(r.microchip).slice(0, 50) : null,
        sterilized: toBool(r.sterilized),
        vaccinated: toBool(r.vaccinated),
        dewormed: toBool(r.dewormed),
        health_status: r.health_status ? String(r.health_status).slice(0, 1000) : null,
        created_by_shelter_id: adoption_center_id,
        shelter_intake_at: now,
        shelter_notes: r.shelter_notes ? String(r.shelter_notes).slice(0, 2000) : null,
        shelter_source_label: 'bulk_import_server',
      }));

      // Filtrar filas invalidas (sin name o species)
      const validPets = petsPayload.filter((p) => p.name && p.species);
      const invalidCount = petsPayload.length - validPets.length;

      let inserted = 0;
      const errors: Array<{ batchStart: number; message: string }> = [];

      for (let i = 0; i < validPets.length; i += BATCH_SIZE) {
        const batch = validPets.slice(i, i + BATCH_SIZE);
        const { error: insertError, count } = await supabase
          .from('pets')
          .insert(batch, { count: 'exact' });
        if (insertError) {
          errors.push({ batchStart: i, message: insertError.message });
        } else {
          inserted += count ?? batch.length;
        }
      }

      // Actualizar audit
      await supabase
        .from('adoption_bulk_imports')
        .update({
          success_count: inserted,
          error_count: errors.length + invalidCount,
          errors: [
            ...errors,
            ...(invalidCount > 0
              ? [{ batchStart: -1, message: `${invalidCount} filas invalidas sin name/species` }]
              : []),
          ],
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', audit.id);

      return jsonResponse({
        success: true,
        audit_id: audit.id,
        inserted,
        invalid_rows: invalidCount,
        batch_errors: errors.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[bulk-import-pets] error:', message);
      return errorResponse('Internal error: ' + message, 500);
    }
  })
);
