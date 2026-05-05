/**
 * Edge Function: generate-daily-digest
 *
 * Epica C.1 (auditoria top-tier 2026-04-20). Engagement loop D1-D7.
 *
 * Cada dia a las 8 AM Chile (11 UTC), genera una notificacion in-app
 * por dueno activo con resumen de recordatorios que vencen en las
 * proximas 48 horas. Incentiva volver a la app sin ser invasivo.
 *
 * Input: ninguno (cron dispara via pg_net).
 * Rate limit: 1 digest por user por dia (dedupe en tabla).
 *
 * Schedule (aplicado en mig 20260722000000_daily_digest_cron.sql):
 *   0 11 * * *   -> todos los dias a las 11 UTC (8 AM Chile)
 *
 * Fase 1 (esta version): solo noti in-app.
 * Fase 2 (pendiente): push notification + email a quienes tienen
 * preferencia `daily_digest_push` o `daily_digest_email` en true.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

interface Reminder {
  id: string;
  pet_id: string;
  owner_id: string;
  type: string | null;
  title: string | null;
  due_date: string;
}

function formatReminderLine(r: Reminder, pets: Map<string, string>): string {
  const petName = pets.get(r.pet_id) ?? 'tu mascota';
  const dueDate = new Date(r.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = dueDate.toDateString() === today.toDateString();
  const isTomorrow = !isToday && dueDate.getTime() - today.getTime() <= 48 * 60 * 60 * 1000;
  const when = isToday ? 'hoy' : isTomorrow ? 'mañana' : dueDate.toLocaleDateString('es-CL');
  const title = r.title ?? `${r.type ?? 'Recordatorio'} de ${petName}`;
  return `• ${title} (${when})`;
}

serve(
  withTelemetry('generate-daily-digest', async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // Cron secret check (opcional — si no esta configurado, no falla)
      const cronSecret = Deno.env.get('CRON_SECRET');
      const headerSecret = req.headers.get('x-cron-secret');
      if (cronSecret && headerSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
      );

      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const todayStr = now.toISOString().slice(0, 10);
      const nowIso = now.toISOString();

      // 1. Fetch reminders pending que vencen en las proximas 48 horas
      const { data: reminders, error: remindersErr } = await supabase
        .from('pet_reminders')
        .select('id, pet_id, owner_id, type, title, due_date, is_completed')
        .eq('is_completed', false)
        .gte('due_date', todayStr)
        .lte('due_date', in48h.toISOString().slice(0, 10))
        .order('due_date', { ascending: true });

      if (remindersErr) throw remindersErr;

      const pending = (reminders ?? []) as Reminder[];

      if (pending.length === 0) {
        console.log('[daily-digest] no reminders pending, skipping.');
        return new Response(JSON.stringify({ ok: true, digests_sent: 0 }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. Agrupar por owner
      const byOwner = new Map<string, Reminder[]>();
      for (const r of pending) {
        if (!r.owner_id) continue;
        const arr = byOwner.get(r.owner_id) ?? [];
        arr.push(r);
        byOwner.set(r.owner_id, arr);
      }

      // 3. Fetch nombres de mascotas (cache para evitar N+1)
      const petIds = Array.from(new Set(pending.map((r) => r.pet_id)));
      const { data: petsData } = await supabase.from('pets').select('id, name').in('id', petIds);
      const petNames = new Map<string, string>();
      for (const p of petsData ?? []) petNames.set(p.id as string, (p.name as string) ?? '');

      // 4. Dedupe: no enviar si ya hay una digest_today para ese user
      //    hoy. Usamos la tabla notifications buscando tipo='daily_digest' con
      //    created_at >= today.
      const ownerIds = Array.from(byOwner.keys());
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { data: alreadySent } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('type', 'daily_digest')
        .in('user_id', ownerIds)
        .gte('created_at', todayStart);

      const alreadySentIds = new Set((alreadySent ?? []).map((n) => n.user_id as string));
      const toNotify = ownerIds.filter((id) => !alreadySentIds.has(id));

      console.log(
        `[daily-digest] ${ownerIds.length} owners con reminders, ${toNotify.length} sin digest hoy.`
      );

      // 5. Insert notis en batch
      const notisToInsert = toNotify.map((ownerId) => {
        const owners = byOwner.get(ownerId)!;
        const summary = owners
          .slice(0, 3)
          .map((r) => formatReminderLine(r, petNames))
          .join('\n');
        const extraCount = owners.length - 3;
        const title =
          owners.length === 1
            ? 'Tenes 1 recordatorio proximo'
            : `Tenes ${owners.length} recordatorios proximos`;
        const body = extraCount > 0 ? `${summary}\n• y ${extraCount} mas en la app` : summary;
        return {
          user_id: ownerId,
          type: 'daily_digest',
          title,
          body,
          action_url: '/calendario?tab=recordatorios',
          created_at: nowIso,
        };
      });

      if (notisToInsert.length > 0) {
        const { error: insertErr } = await supabase.from('notifications').insert(notisToInsert);
        if (insertErr) {
          console.error('[daily-digest] insert notifications failed', insertErr);
          return new Response(JSON.stringify({ error: insertErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          total_owners_with_reminders: ownerIds.length,
          digests_sent: notisToInsert.length,
          deduped: alreadySentIds.size,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      console.error('[daily-digest] error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
