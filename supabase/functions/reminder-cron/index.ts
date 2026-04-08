/**
 * Edge Function: reminder-cron
 *
 * Corre cada hora vía Supabase scheduled function.
 * Escanea pet_reminders y appointments cuya due_date esté entre
 * "ahora + 23h" y "ahora + 25h" (ventana de 1 día antes), y dispara:
 *   1. send-whatsapp-reminder (si el user opto in)
 *   2. (futuro) push notification nativa
 *   3. (futuro) email
 *
 * Idempotencia: usa whatsapp_message_log para no mandar 2 veces el mismo
 * recordatorio en menos de 20h.
 *
 * Auth: ninguna (cron interno). Pero verify_jwt=false en config.toml.
 *
 * Schedule sugerido (Supabase Dashboard > Database > Cron Jobs):
 *   0 * * * *   ->  cada hora en punto
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const startISO = windowStart.toISOString().slice(0, 10); // pet_reminders.due_date es DATE
    const endISO = windowEnd.toISOString().slice(0, 10);

    // 1. pet_reminders próximos
    const { data: reminders, error: remErr } = await supabase
      .from("pet_reminders")
      .select("id, owner_id, pet_id, type, title, due_date, pets(name)")
      .gte("due_date", startISO)
      .lte("due_date", endISO)
      .eq("is_completed", false);

    if (remErr) throw remErr;

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const r of reminders ?? []) {
      // Check idempotencia: si ya se mando hace <20h, skip
      const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
      const { data: alreadySent } = await supabase
        .from("whatsapp_message_log")
        .select("id")
        .eq("related_reminder_id", r.id)
        .eq("status", "sent")
        .gte("created_at", twentyHoursAgo)
        .limit(1)
        .maybeSingle();

      if (alreadySent) {
        skipped++;
        continue;
      }

      // Llamar al sender
      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-reminder`;
      const resp = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          user_id: r.owner_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pet_name: (r as any).pets?.name ?? "tu mascota",
          reminder_type: r.title || r.type,
          due_date: r.due_date,
          reminder_id: r.id,
        }),
      });

      if (resp.ok) {
        sent++;
      } else {
        failed++;
        console.warn(`[reminder-cron] failed reminder ${r.id}: ${resp.status}`);
      }
    }

    // 2. appointments próximos (mismo flujo, ventana en TIMESTAMPTZ)
    const { data: appts, error: apptErr } = await supabase
      .from("appointments")
      .select("id, pet_id, title, scheduled_date, pets(name, owner_id)")
      .gte("scheduled_date", windowStart.toISOString())
      .lte("scheduled_date", windowEnd.toISOString())
      .neq("status", "cancelada");

    if (apptErr) throw apptErr;

    for (const a of appts ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ownerId = (a as any).pets?.owner_id;
      if (!ownerId) continue;

      const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
      const { data: alreadySent } = await supabase
        .from("whatsapp_message_log")
        .select("id")
        .eq("related_appointment_id", a.id)
        .eq("status", "sent")
        .gte("created_at", twentyHoursAgo)
        .limit(1)
        .maybeSingle();

      if (alreadySent) {
        skipped++;
        continue;
      }

      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-reminder`;
      const resp = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          user_id: ownerId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pet_name: (a as any).pets?.name ?? "tu mascota",
          reminder_type: a.title || "cita veterinaria",
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
        appointments_found: appts?.length ?? 0,
        sent,
        skipped,
        failed,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[reminder-cron] error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
