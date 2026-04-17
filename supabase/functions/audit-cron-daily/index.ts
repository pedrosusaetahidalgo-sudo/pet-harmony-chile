/**
 * Edge Function: audit-cron-daily
 *
 * Orquestador diario del monitoreo auto-pilotado de Paw Friend.
 * Pensado para correr 1x/dia (8am Chile = 11 UTC) via Supabase Cron Jobs.
 *
 * REGLA DE ORO (Pedro 2026-04-17):
 *   Esta funcion NUNCA altera datos de usuarios reales ni su UX.
 *   Los auto-fixers aplicados son estrictamente seguros (testing junk,
 *   logs benignos, slugs faltantes). Cualquier item que pueda afectar
 *   a un usuario real cae en `needs_human_attention` para que Pedro
 *   decida — nunca se auto-resuelve.
 *
 * Flujo:
 *  1. Ejecuta auto-fixers seguros (RPC run_daily_auto_fixers).
 *  2. Calcula metricas de salud (mismos counts que auditExport).
 *  3. Detecta items que requieren atencion humana (unfixable, UX-impacting).
 *  4. Guarda snapshot en tabla audit_snapshots.
 *  5. Retorna JSON con health_score + deltas + auto-fixes + alerts.
 *
 * Auth: cron interno via Supabase. verify_jwt=false en config.toml.
 *
 * Schedule sugerido (Supabase Dashboard > Database > Cron Jobs):
 *   0 11 * * *   -> 1x/dia a las 11 UTC (8am Chile)
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;

interface HealthMetrics {
  total_users: number;
  premium_users: number;
  active_pets: number;
  orphan_pets: number;
  verified_providers: number;
  providers_without_slug: number;
  total_bookings: number;
  error_logs_24h: number;
  error_logs_total: number;
  unique_error_patterns: number;
}

interface HumanAttentionItem {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  suggested_action: string;
  count?: number;
}

async function computeMetrics(sb: Sb): Promise<HealthMetrics> {
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    profilesRes,
    premiumRes,
    petsRes,
    orphanPetsRes,
    providersRes,
    providersNoSlugRes,
    bookingsRes,
    errors24hRes,
    errorsTotalRes,
    errorPatternsRes,
  ] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
    sb.from('pets').select('id', { count: 'exact', head: true }).eq('lifecycle_status', 'active'),
    sb
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .is('owner_id', null)
      .is('pending_owner_email', null),
    sb
      .from('service_providers')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', true),
    sb
      .from('service_providers')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', true)
      .is('slug', null),
    sb.from('bookings').select('id', { count: 'exact', head: true }),
    sb.from('error_logs').select('id', { count: 'exact', head: true }).gte('created_at', day),
    sb.from('error_logs').select('id', { count: 'exact', head: true }),
    sb.from('error_logs').select('message').limit(500),
  ]);

  const uniquePatterns = new Set(
    ((errorPatternsRes.data ?? []) as Array<{ message: string }>).map((r) => r.message)
  );

  return {
    total_users: profilesRes.count ?? 0,
    premium_users: premiumRes.count ?? 0,
    active_pets: petsRes.count ?? 0,
    orphan_pets: orphanPetsRes.count ?? 0,
    verified_providers: providersRes.count ?? 0,
    providers_without_slug: providersNoSlugRes.count ?? 0,
    total_bookings: bookingsRes.count ?? 0,
    error_logs_24h: errors24hRes.count ?? 0,
    error_logs_total: errorsTotalRes.count ?? 0,
    unique_error_patterns: uniquePatterns.size,
  };
}

function computeHealthScore(m: HealthMetrics): number {
  let score = 100;
  if (m.providers_without_slug > 0) score -= 5;
  if (m.orphan_pets > 10) score -= 5;
  if (m.error_logs_24h > 50) score -= 15;
  else if (m.error_logs_24h > 20) score -= 8;
  else if (m.error_logs_24h > 5) score -= 3;
  if (m.unique_error_patterns > 10) score -= 10;
  else if (m.unique_error_patterns > 3) score -= 5;
  return Math.max(0, score);
}

async function detectNeedsHumanAttention(
  sb: Sb,
  metrics: HealthMetrics
): Promise<HumanAttentionItem[]> {
  const items: HumanAttentionItem[] = [];

  // 1. Verification requests legitimas pendientes (no basura — las basura se auto-rechazan).
  const { data: legitPending, count: legitCount } = await sb
    .from('verification_requests')
    .select('id, requested_role, notes, created_at', { count: 'exact' })
    .eq('status', 'pendiente')
    .lt('created_at', new Date(Date.now() - 3 * 86400 * 1000).toISOString())
    .gte('length(trim(notes))', 5);

  if ((legitCount ?? 0) > 0) {
    items.push({
      category: 'verification',
      severity: 'warning',
      title: `${legitCount} solicitudes de rol esperando revision`,
      description: `Usuarios reales esperan respuesta hace >3 dias. Revisa en Admin > Verificaciones.`,
      suggested_action: 'Ir a /admin → Usuarios → Verificaciones y aprobar/rechazar cada una.',
      count: legitCount ?? 0,
    });
  }

  // 2. Subscriptions pending >7 dias (intento de pago que no completo).
  const { count: stalePendingCount } = await sb
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString());

  if ((stalePendingCount ?? 0) > 0) {
    items.push({
      category: 'payments',
      severity: 'info',
      title: `${stalePendingCount} subscriptions pending de hace >7 dias`,
      description: 'Son intentos de pago que no completaron en Flow. No cuentan como revenue.',
      suggested_action:
        "Revisar si son recuperables o cancelar con: UPDATE subscriptions SET status='cancelled' WHERE status='pending' AND created_at < now() - interval '7 days'.",
      count: stalePendingCount ?? 0,
    });
  }

  // 3. Spike de errores nuevos (>5 en 24h vs baseline cero).
  if (metrics.error_logs_24h > 10) {
    items.push({
      category: 'errors',
      severity: metrics.error_logs_24h > 50 ? 'critical' : 'warning',
      title: `Spike: ${metrics.error_logs_24h} errores en las ultimas 24h`,
      description:
        'Normalmente la app deberia tener <5 errores/dia con el filtro actual. Investigar en Admin > Sistema > Errores.',
      suggested_action:
        'Revisar Admin > Sistema > Errores, agrupar por mensaje, priorizar los con mayor impacto.',
      count: metrics.error_logs_24h,
    });
  }

  // 4. Mascotas huerfanas legitimas (creadas por vet pero sin invitacion).
  if (metrics.orphan_pets > 0) {
    const { count: orphanOldCount } = await sb
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .is('owner_id', null)
      .is('pending_owner_email', null)
      .lt('created_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString());

    if ((orphanOldCount ?? 0) > 0) {
      items.push({
        category: 'orphans',
        severity: 'warning',
        title: `${orphanOldCount} mascotas sin dueno ni email pendiente`,
        description:
          'Mascotas creadas por vet que nunca fueron vinculadas a un dueno. >7 dias sin accion.',
        suggested_action:
          'Revisar Admin > Usuarios > Mascotas pendientes para contactar al vet o archivar.',
        count: orphanOldCount ?? 0,
      });
    }
  }

  return items;
}

serve(
  withTelemetry('audit-cron-daily', async (req) => {
    try {
      const sb = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
      );

      // 1. Ejecutar auto-fixers primero (limpian ruido que distorsiona metricas).
      const { data: autoFixes, error: fixerError } = await sb.rpc('run_daily_auto_fixers');
      if (fixerError) {
        console.error('[audit-cron] auto-fixers failed:', fixerError);
      }

      // 2. Calcular metricas post-fix.
      const metrics = await computeMetrics(sb);
      const healthScore = computeHealthScore(metrics);
      const needsHumanAttention = await detectNeedsHumanAttention(sb, metrics);

      // 3. Guardar snapshot (upsert por dia para re-corridas idempotentes).
      const today = new Date().toISOString().slice(0, 10);
      const { error: insertError } = await sb.from('audit_snapshots').upsert(
        {
          snapshot_date: today,
          health_score: healthScore,
          ...metrics,
          auto_fixes_applied: autoFixes ?? [],
          needs_human_attention: needsHumanAttention,
          raw_metrics: { source: 'audit-cron-daily', ts: new Date().toISOString() },
        },
        { onConflict: 'snapshot_date' }
      );

      if (insertError) {
        console.error('[audit-cron] snapshot insert failed:', insertError);
      }

      // 4. Calcular delta vs el snapshot del dia previo (si existe).
      const yesterday = new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10);
      const { data: prevSnap } = await sb
        .from('audit_snapshots')
        .select(
          'health_score, total_users, premium_users, active_pets, verified_providers, error_logs_total'
        )
        .eq('snapshot_date', yesterday)
        .maybeSingle();

      const delta = prevSnap
        ? {
            health_score: healthScore - prevSnap.health_score,
            total_users: metrics.total_users - prevSnap.total_users,
            premium_users: metrics.premium_users - prevSnap.premium_users,
            active_pets: metrics.active_pets - prevSnap.active_pets,
            verified_providers: metrics.verified_providers - prevSnap.verified_providers,
            error_logs_total: metrics.error_logs_total - prevSnap.error_logs_total,
          }
        : null;

      const payload = {
        ok: true,
        snapshot_date: today,
        health_score: healthScore,
        metrics,
        delta,
        auto_fixes_applied: autoFixes ?? [],
        needs_human_attention: needsHumanAttention,
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[audit-cron] fatal error:', msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  })
);
