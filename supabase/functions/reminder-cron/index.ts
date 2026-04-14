/**
 * Edge Function: reminder-cron
 *
 * Corre 1x/día vía Supabase scheduled function (8 AM Chile = 11 UTC).
 * Escanea pet_reminders y appointments cuya due_date esté entre
 * "ahora + 23h" y "ahora + 25h" (ventana de 1 día antes), y dispara:
 *   1. send-whatsapp-reminder (si el user opto in)
 *   2. (futuro) push notification nativa
 *   3. (futuro) email
 *
 * Optimizaciones implementadas:
 *   - Pre-filtro opt-in: solo trae reminders de usuarios con whatsapp_opted_in=true y phone
 *   - Batch idempotencia: 1 query para todos los reminder IDs (no N+1)
 *   - Frecuencia: de 24x/dia a 1x/dia (cambiar en Dashboard: 0 11 * * *)
 *
 * Auth: ninguna (cron interno). verify_jwt=false en config.toml.
 *
 * Schedule (Supabase Dashboard > Database > Cron Jobs):
 *   0 11 * * *   ->  1x/día a las 11 UTC (8 AM Chile CLT / 7 AM CLST)
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const startISO = windowStart.toISOString().slice(0, 10);
    const endISO = windowEnd.toISOString().slice(0, 10);

    // 1. pet_reminders — pre-filtrado por opt-in y teléfono
    const { data: reminders, error: remErr } = await supabase
      .from('pet_reminders')
      .select('id, owner_id, pet_id, type, title, due_date, pets(name)')
      .gte('due_date', startISO)
      .lte('due_date', endISO)
      .eq('is_completed', false);

    if (remErr) throw remErr;

    // Filtrar por opt-in: traer perfiles con whatsapp activo en 1 query
    const reminderOwnerIds = [...new Set((reminders ?? []).map((r) => r.owner_id))];
    let optedInOwners = new Set<string>();

    if (reminderOwnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('id', reminderOwnerIds)
        .eq('whatsapp_opted_in', true)
        .not('whatsapp_number', 'is', null);

      optedInOwners = new Set((profiles ?? []).map((p) => p.id));
    }

    // Filtrar reminders a solo los de usuarios con opt-in
    const eligibleReminders = (reminders ?? []).filter((r) => optedInOwners.has(r.owner_id));

    // Batch idempotencia: 1 query para todos los IDs
    let alreadySentReminderIds = new Set<string>();
    if (eligibleReminders.length > 0) {
      const ids = eligibleReminders.map((r) => r.id);
      const { data: sentLogs } = await supabase
        .from('whatsapp_message_log')
        .select('related_reminder_id')
        .in('related_reminder_id', ids)
        .eq('status', 'sent')
        .gte('created_at', twentyHoursAgo);

      alreadySentReminderIds = new Set(
        (sentLogs ?? []).map((s) => s.related_reminder_id).filter(Boolean)
      );
    }

    let sent = 0;
    let skipped = alreadySentReminderIds.size;
    let skippedOptIn = (reminders ?? []).length - eligibleReminders.length;
    let failed = 0;

    const fnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-reminder`;
    const authHeader = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;

    for (const r of eligibleReminders) {
      if (alreadySentReminderIds.has(r.id)) continue;

      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          user_id: r.owner_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pet_name: (r as any).pets?.name ?? 'tu mascota',
          reminder_type: r.title || r.type,
          due_date: r.due_date,
          reminder_id: r.id,
        }),
      });

      if (resp.ok) sent++;
      else {
        failed++;
        console.warn(`[reminder-cron] failed reminder ${r.id}: ${resp.status}`);
      }
    }

    // 2. appointments próximos (mismo flujo optimizado)
    const { data: appts, error: apptErr } = await supabase
      .from('appointments')
      .select('id, pet_id, title, scheduled_date, pets(name, owner_id)')
      .gte('scheduled_date', windowStart.toISOString())
      .lte('scheduled_date', windowEnd.toISOString())
      .neq('status', 'cancelada');

    if (apptErr) throw apptErr;

    const apptOwnerIds = [
      ...new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (appts ?? []).map((a) => (a as any).pets?.owner_id).filter(Boolean)
      ),
    ];

    // Reusar opt-in check para appointments
    let optedInApptOwners = new Set<string>();
    if (apptOwnerIds.length > 0) {
      const newIds = apptOwnerIds.filter(
        (id) => !optedInOwners.has(id) && !reminderOwnerIds.includes(id)
      );
      // Start with already-known opt-in owners
      optedInApptOwners = new Set([...optedInOwners].filter((id) => apptOwnerIds.includes(id)));

      if (newIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .in('id', newIds)
          .eq('whatsapp_opted_in', true)
          .not('whatsapp_number', 'is', null);

        for (const p of profiles ?? []) optedInApptOwners.add(p.id);
      }
    }

    const eligibleAppts = (appts ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a) => optedInApptOwners.has((a as any).pets?.owner_id)
    );

    // Batch idempotencia para appointments
    let alreadySentApptIds = new Set<string>();
    if (eligibleAppts.length > 0) {
      const ids = eligibleAppts.map((a) => a.id);
      const { data: sentLogs } = await supabase
        .from('whatsapp_message_log')
        .select('related_appointment_id')
        .in('related_appointment_id', ids)
        .eq('status', 'sent')
        .gte('created_at', twentyHoursAgo);

      alreadySentApptIds = new Set(
        (sentLogs ?? []).map((s) => s.related_appointment_id).filter(Boolean)
      );
    }

    skipped += alreadySentApptIds.size;
    skippedOptIn += (appts ?? []).length - eligibleAppts.length;

    for (const a of eligibleAppts) {
      if (alreadySentApptIds.has(a.id)) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ownerId = (a as any).pets?.owner_id;
      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          user_id: ownerId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pet_name: (a as any).pets?.name ?? 'tu mascota',
          reminder_type: a.title || 'cita veterinaria',
          due_date: a.scheduled_date,
          appointment_id: a.id,
        }),
      });

      if (resp.ok) sent++;
      else failed++;
    }

    return new Response(
      JSON.stringify({
        window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
        reminders_found: reminders?.length ?? 0,
        reminders_eligible: eligibleReminders.length,
        appointments_found: appts?.length ?? 0,
        appointments_eligible: eligibleAppts.length,
        sent,
        skipped,
        skipped_no_optin: skippedOptIn,
        failed,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[reminder-cron] error', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
