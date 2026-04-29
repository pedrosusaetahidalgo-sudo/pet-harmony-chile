/**
 * paw-shield-archive-cleanup · Edge Function (cron)
 *
 * Cron diario que ejecuta el lifecycle de imagenes archivadas en
 * paw_shield_archive con expires_at <= NOW():
 *   1. Borra el blob del bucket paw-shield-archive.
 *   2. Borra el row de paw_shield_archive.
 *   3. Reporta conteo + errores en respuesta + log a paw_shield_events.
 *
 * Lifecycle:
 *   - consent_for_training=true → expires_at NULL → nunca se borra (se mantiene
 *     para training futuro).
 *   - consent_for_training=false → expires_at = created_at + 30d → cron borra.
 *   - revocacion ARCO Ley 19.628 → user llama RPC revoke_paw_shield_archive_consent
 *     que setea consent=false + expires_at = NOW() + 30d → cron borra.
 *
 * Spec: docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md
 *
 * Cron: configurar en Supabase Dashboard > Scheduled Jobs:
 *   `SELECT net.http_post(
 *      'https://gwailbjlvevkhwcrovfd.functions.supabase.co/paw-shield-archive-cleanup',
 *      headers := jsonb_build_object(
 *        'Authorization',
 *        'Bearer ' || current_setting('app.settings.service_role_key')
 *      )
 *    );`
 * Frecuencia: 1x/dia a las 04:00 AM Chile (07:00 UTC).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BUCKET = 'paw-shield-archive';
const BATCH_SIZE = 200;

interface ExpiredRow {
  id: string;
  storage_path: string;
}

serve(
  withTelemetry('paw-shield-archive-cleanup', async (req) => {
    const authError = requireCronAuth(req);
    if (authError) return authError;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    let totalDeleted = 0;
    let totalErrors = 0;
    const errorSamples: string[] = [];

    // Iteramos en batches hasta agotar.
    for (let pass = 0; pass < 50; pass++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: expired, error: selectErr } = await (supabase as any)
        .from('paw_shield_archive')
        .select('id, storage_path')
        .not('expires_at', 'is', null)
        .lte('expires_at', new Date().toISOString())
        .limit(BATCH_SIZE);

      if (selectErr) {
        console.error('[paw-shield-archive-cleanup] select fallo:', selectErr);
        return new Response(
          JSON.stringify({
            error: 'select failed',
            detail: selectErr.message,
            deleted_so_far: totalDeleted,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const rows = (expired ?? []) as ExpiredRow[];
      if (rows.length === 0) break;

      // 1. Borrar blobs del bucket en bulk.
      const paths = rows.map((r) => r.storage_path);
      const { error: storageErr } = await supabase.storage.from(BUCKET).remove(paths);

      if (storageErr) {
        console.warn(
          '[paw-shield-archive-cleanup] storage.remove fallo (sigo con DB):',
          storageErr.message
        );
        totalErrors++;
        if (errorSamples.length < 3) errorSamples.push(storageErr.message.slice(0, 120));
        // Continuamos: borramos los rows aunque el storage haya fallado, asi
        // no quedan registros zombie. El blob queda como huerfano (tendra que
        // limpiarse manual via UI de Supabase si pasa).
      }

      // 2. Borrar rows de paw_shield_archive.
      const ids = rows.map((r) => r.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteErr } = await (supabase as any)
        .from('paw_shield_archive')
        .delete()
        .in('id', ids);

      if (deleteErr) {
        console.error('[paw-shield-archive-cleanup] delete rows fallo:', deleteErr);
        totalErrors++;
        if (errorSamples.length < 3) errorSamples.push(deleteErr.message.slice(0, 120));
        // Si delete row falla, abortamos (no queremos un bucle infinito de
        // borrado de blobs sin progreso en DB).
        break;
      }

      totalDeleted += rows.length;

      // Si menos del batch size, ya no hay mas.
      if (rows.length < BATCH_SIZE) break;
    }

    // 3. Log evento agregado.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('paw_shield_events').insert({
        pet_id: null,
        owner_id: null,
        event_type: 'archive_cleanup',
        metadata: {
          total_deleted: totalDeleted,
          total_errors: totalErrors,
          error_samples: errorSamples,
        },
      });
    } catch (e) {
      console.warn('[paw-shield-archive-cleanup] log event fallo:', e);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        deleted: totalDeleted,
        errors: totalErrors,
        error_samples: errorSamples,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  })
);
