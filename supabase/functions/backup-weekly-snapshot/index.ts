/**
 * Edge Function: backup-weekly-snapshot
 *
 * Genera un snapshot JSON comprimido semanal con métricas agregadas + raw
 * de tablas clave, y lo sube a Supabase Storage bucket `backups/`.
 *
 * Objetivo:
 *   - Tener backup ante incidente (DROP accidental, corrupción).
 *   - Timeline de métricas para pitch angels (6 meses de datos cronológicos).
 *   - Evidencia operacional para CORFO DD.
 *
 * Alcance (NO reemplaza pg_dump):
 *   - Metadata agregada (counts por tabla, últimas 1000 filas críticas).
 *   - Metrics snapshot: NSM, MRR, donaciones, paw members.
 *   - Sin datos PII sensibles (emails, phones).
 *
 * Schedule: domingo 04:00 UTC (después del cleanup device_tokens).
 *
 * Origen: Plan 90d — preparación data room + seguridad operacional.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countTable(admin: any, table: string): Promise<number> {
  const { count } = await admin.from(table).select('*', { count: 'exact', head: true });
  return count ?? 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sampleRecent(admin: any, table: string, columns: string, limit = 1000) {
  const { data } = await admin
    .from(table)
    .select(columns)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireCronAuth(req);
  if (authError) return authError;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const BACKUP_BUCKET = Deno.env.get('BACKUP_BUCKET') || 'backups';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server misconfigured', 500);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const weekKey = `${now.getUTCFullYear()}-W${String(
    Math.ceil(((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7)
  ).padStart(2, '0')}`;

  try {
    // ─────────────────────────────────────────────────────────
    // 1. Counts agregados
    // ─────────────────────────────────────────────────────────
    const tablesToCount = [
      'profiles',
      'pets',
      'medical_records',
      'medical_share_tokens',
      'pet_reminders',
      'service_providers',
      'vet_bookings',
      'donations',
      'adoption_centers',
      'pitch_applications',
      'device_tokens',
      'pending_reviews',
      'service_reviews',
    ];

    const counts: Record<string, number> = {};
    for (const t of tablesToCount) {
      try {
        counts[t] = await countTable(admin, t);
      } catch {
        counts[t] = -1; // tabla no existe o sin permiso
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. Metrics snapshot (llamamos RPCs admin)
    // ─────────────────────────────────────────────────────────
    const metrics: Record<string, unknown> = {};

    const rpcs = [
      'rpc_nsm_30d',
      'rpc_mau_owners_30d',
      'rpc_mrr_b2b_clp',
      'rpc_donations_30d_clp',
      'rpc_paw_members_count',
    ];

    for (const rpc of rpcs) {
      try {
        const { data } = await admin.rpc(rpc);
        metrics[rpc] = data;
      } catch {
        metrics[rpc] = null;
      }
    }

    // ─────────────────────────────────────────────────────────
    // 3. Sample raw (últimas N por tabla — sin PII)
    // ─────────────────────────────────────────────────────────
    const samples: Record<string, unknown[]> = {};

    try {
      samples.pets_recent = await sampleRecent(
        admin,
        'pets',
        'id, species, breed, birth_date, gender, created_at',
        500
      );
    } catch {
      /* ignore */
    }

    try {
      samples.service_providers = await sampleRecent(
        admin,
        'service_providers',
        'id, provider_type, provider_plan, status, commune, rating, total_reviews, is_verified, created_at',
        500
      );
    } catch {
      /* ignore */
    }

    try {
      samples.donations = await sampleRecent(
        admin,
        'donations',
        'id, amount_clp, status, frequency, source, created_at, paid_at',
        500
      );
    } catch {
      /* ignore */
    }

    try {
      samples.pitch_applications = await sampleRecent(
        admin,
        'pitch_applications',
        'id, kind, organization_name, created_at, status',
        200
      );
    } catch {
      /* ignore */
    }

    // ─────────────────────────────────────────────────────────
    // 4. Construir snapshot completo
    // ─────────────────────────────────────────────────────────
    const snapshot = {
      captured_at: now.toISOString(),
      week_key: weekKey,
      date_key: dateKey,
      schema_version: 1,
      counts,
      metrics,
      samples,
    };

    const snapshotJson = JSON.stringify(snapshot, null, 2);
    const filename = `snapshot-${dateKey}-${weekKey}.json`;

    // ─────────────────────────────────────────────────────────
    // 5. Subir a Storage. Crear bucket si no existe.
    // ─────────────────────────────────────────────────────────
    // Intentar crear bucket (si existe, upsertBucket retorna error benigno que ignoramos).
    try {
      await admin.storage.createBucket(BACKUP_BUCKET, { public: false });
    } catch {
      /* bucket ya existe */
    }

    const { error: uploadError } = await admin.storage
      .from(BACKUP_BUCKET)
      .upload(`weekly/${filename}`, snapshotJson, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      return errorResponse(`Storage upload failed: ${uploadError.message}`, 500);
    }

    return jsonResponse({
      ok: true,
      filename,
      size_bytes: snapshotJson.length,
      week_key: weekKey,
      bucket: BACKUP_BUCKET,
      storage_path: `weekly/${filename}`,
      counts_summary: counts,
    });
  } catch (err) {
    return errorResponse(`Snapshot failed: ${(err as Error).message}`, 500);
  }
}

serve(withTelemetry('backup-weekly-snapshot', handle));
