// ==========================================================================
// run-all-cascades — pipeline unificado §2.8.3
//
// Ejecuta las 5 RPCs de cascadas en serie + dispara notify-health-alerts.
// Pedro programa UN cron en vez de 7 (vaccine + antiparasitic + inactivity
// + birthday + memorial_anniversary + notify_emails + reset).
//
// Cron unico:
//   SELECT cron.schedule(
//     'run-all-cascades-daily',
//     '0 13 * * *',  -- 9am Chile
//     $$ SELECT net.http_post(
//       url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/run-all-cascades',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
//         'Content-Type', 'application/json'
//       )
//     ); $$
//   );
//
// Devuelve resumen JSON con counts por tipo. Si alguna RPC falla, sigue
// con las siguientes (best-effort) y reporta error en el resumen.
//
// El weight_loss_30d NO esta aqui porque es trigger sync (BEFORE UPDATE
// pets.weight). No requiere cron.
// ==========================================================================
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

interface CascadeResult {
  cascade: string;
  alerts_created?: number;
  pets_scanned?: number;
  error?: string;
  ms: number;
}

serve(
  withTelemetry('run-all-cascades', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Sprint 1 P1 SEC-007: bloquea invocaciones publicas. Solo acepta el
    // service_role token (que pg_cron envia) o el PAWFRIEND_CRON_SECRET.
    const authError = requireCronAuth(req);
    if (authError) return authError;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: CascadeResult[] = [];

    // 5 RPCs de cascadas en serie. Cada una con su propio try/catch — si
    // una falla, las siguientes igual corren.
    const cascades = [
      { name: 'vaccine_overdue', rpc: 'detect_vaccine_overdue_alerts' },
      { name: 'antiparasitic_overdue', rpc: 'detect_antiparasitic_overdue_alerts' },
      { name: 'no_activity_7d', rpc: 'detect_inactive_user_alerts' },
      { name: 'birthday_window', rpc: 'detect_birthday_window_alerts' },
      { name: 'memorial_anniversary', rpc: 'detect_memorial_anniversary_alerts' },
    ];

    for (const c of cascades) {
      const t0 = Date.now();
      try {
        const { data, error } = await supabase.rpc(c.rpc);
        const ms = Date.now() - t0;
        if (error) {
          results.push({ cascade: c.name, error: error.message, ms });
        } else {
          const row = (data as Array<{ alerts_created: number; pets_scanned: number }>)?.[0];
          results.push({
            cascade: c.name,
            alerts_created: row?.alerts_created ?? 0,
            pets_scanned: row?.pets_scanned ?? 0,
            ms,
          });
        }
      } catch (err) {
        results.push({
          cascade: c.name,
          error: err instanceof Error ? err.message : String(err),
          ms: Date.now() - t0,
        });
      }
    }

    // Disparar notify-health-alerts via HTTP (no via RPC porque es edge fn,
    // no SQL). Best effort — si falla, no rompe el batch.
    const t0 = Date.now();
    let notifyResult: CascadeResult;
    try {
      const notifyResp = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-health-alerts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const ms = Date.now() - t0;
      if (notifyResp.ok) {
        const body = await notifyResp.json().catch(() => ({}));
        notifyResult = {
          cascade: 'notify-health-alerts',
          alerts_created: body.sent ?? 0,
          pets_scanned: body.processed ?? 0,
          ms,
        };
      } else {
        notifyResult = {
          cascade: 'notify-health-alerts',
          error: `HTTP ${notifyResp.status}`,
          ms,
        };
      }
    } catch (err) {
      notifyResult = {
        cascade: 'notify-health-alerts',
        error: err instanceof Error ? err.message : String(err),
        ms: Date.now() - t0,
      };
    }
    results.push(notifyResult);

    // Resumen
    const totalAlertsCreated = results.reduce((s, r) => s + (r.alerts_created ?? 0), 0);
    const errors = results.filter((r) => r.error).length;

    return jsonResponse({
      success: errors === 0,
      total_alerts_created: totalAlertsCreated,
      cascades_run: results.length,
      errors,
      results,
    });
  })
);
