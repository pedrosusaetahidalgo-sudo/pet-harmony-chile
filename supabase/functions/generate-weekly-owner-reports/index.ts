/**
 * Edge Function: generate-weekly-owner-reports
 *
 * Genera reportes semanales para dueños de mascotas.
 * Para cada usuario no-demo con al menos 1 mascota:
 *   - Recordatorios completados vs totales (últimos 7 días)
 *   - Peso actual por mascota
 *   - Recordatorios próximos (próximos 7 días)
 *   - Registros médicos agregados esta semana
 *   - Insight de la semana generado con Claude (español chileno)
 *
 * Auth: cron interno. Protegido por shared secret header (X-Cron-Secret).
 *
 * Schedule sugerido (Supabase Dashboard > Database > Cron Jobs):
 *   0 8 * * 1   ->  cada lunes a las 8:00 AM
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar shared secret para cron
    const cronSecret = Deno.env.get("CRON_SECRET");
    const headerSecret = req.headers.get("x-cron-secret");
    if (cronSecret && headerSecret !== cronSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const periodStart = weekAgo.toISOString().slice(0, 10);
    const periodEnd = now.toISOString().slice(0, 10);
    const weekAheadDate = weekAhead.toISOString().slice(0, 10);

    // Obtener usuarios no-demo con al menos 1 mascota
    const { data: owners, error: ownersErr } = await supabase
      .from("pets")
      .select("owner_id")
      .not("owner_id", "is", null);

    if (ownersErr) throw ownersErr;

    // Deduplicate owner IDs
    const uniqueOwnerIds = [...new Set((owners ?? []).map((p) => p.owner_id))];

    // Filtrar usuarios demo
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, full_name, is_demo")
      .in("id", uniqueOwnerIds);

    if (profilesErr) throw profilesErr;

    const validOwners = (profiles ?? []).filter((p) => !p.is_demo);

    let generated = 0;
    let errors = 0;

    for (const owner of validOwners) {
      try {
        const userId = owner.id;

        // 1. Mascotas del usuario con peso actual
        const { data: pets } = await supabase
          .from("pets")
          .select("id, name, species, breed, weight")
          .eq("owner_id", userId);

        if (!pets || pets.length === 0) continue;

        const petIds = pets.map((p) => p.id);

        // 2. Recordatorios últimos 7 días (completados vs total)
        const { data: remindersLastWeek } = await supabase
          .from("pet_reminders")
          .select("id, is_completed, pet_id, title, type")
          .in("pet_id", petIds)
          .gte("due_date", periodStart)
          .lte("due_date", periodEnd);

        const totalReminders = remindersLastWeek?.length ?? 0;
        const completedReminders =
          remindersLastWeek?.filter((r) => r.is_completed).length ?? 0;

        // 3. Recordatorios próximos 7 días
        const { data: upcomingReminders } = await supabase
          .from("pet_reminders")
          .select("id, title, type, due_date, pet_id, pets(name)")
          .in("pet_id", petIds)
          .gt("due_date", periodEnd)
          .lte("due_date", weekAheadDate)
          .eq("is_completed", false)
          .order("due_date", { ascending: true })
          .limit(20);

        // 4. Registros médicos agregados esta semana
        const { data: medicalRecords } = await supabase
          .from("medical_records")
          .select("id, title, record_type, pet_id, date")
          .in("pet_id", petIds)
          .gte("created_at", weekAgo.toISOString())
          .lte("created_at", now.toISOString());

        const medicalRecordsCount = medicalRecords?.length ?? 0;

        // Armar contenido del reporte
        const reportContent = {
          user_id: userId,
          user_name: owner.full_name || "Usuario",
          period: { start: periodStart, end: periodEnd },
          pets: pets.map((p) => ({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
            weight_kg: p.weight,
          })),
          reminders: {
            total_last_week: totalReminders,
            completed_last_week: completedReminders,
            completion_rate:
              totalReminders > 0
                ? Math.round((completedReminders / totalReminders) * 100)
                : null,
          },
          upcoming_reminders: (upcomingReminders ?? []).map((r) => ({
            title: r.title,
            type: r.type,
            due_date: r.due_date,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pet_name: (r as any).pets?.name ?? "mascota",
          })),
          medical_records_added: medicalRecordsCount,
          medical_records_detail: (medicalRecords ?? []).map((m) => ({
            title: m.title,
            type: m.record_type,
            date: m.date,
          })),
          insight: null as string | null,
        };

        // 5. Generar insight con Claude
        const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
        if (apiKey) {
          try {
            const insightPrompt = buildInsightPrompt(reportContent);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);

            try {
              const claudeResp = await fetch(
                "https://api.anthropic.com/v1/messages",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                  },
                  body: JSON.stringify({
                    model: "claude-sonnet-4-5",
                    max_tokens: 200,
                    temperature: 0.5,
                    system:
                      "Eres un asistente veterinario de Paw Friend, app chilena de mascotas. " +
                      "Responde en español de Chile con tuteo (tu, tienes, puedes). " +
                      "Sé cálido y conciso.",
                    messages: [{ role: "user", content: insightPrompt }],
                  }),
                  signal: controller.signal,
                }
              );

              if (claudeResp.ok) {
                const claudeData = await claudeResp.json();
                const text = claudeData.content?.[0]?.text ?? "";
                reportContent.insight = text.trim() || null;
              }
            } finally {
              clearTimeout(timeout);
            }
          } catch (aiErr) {
            // AI failure no bloquea el reporte
            console.warn(
              `[weekly-owner-reports] AI insight failed for user ${userId}:`,
              aiErr
            );
          }
        }

        // 6. Insertar en periodic_reports
        const { error: insertErr } = await supabase
          .from("periodic_reports")
          .insert({
            user_id: userId,
            report_type: "owner_weekly",
            period_start: periodStart,
            period_end: periodEnd,
            content_jsonb: reportContent,
          });

        if (insertErr) {
          console.error(
            `[weekly-owner-reports] insert failed for user ${userId}:`,
            insertErr
          );
          errors++;
        } else {
          generated++;
        }
      } catch (userErr) {
        console.error(
          `[weekly-owner-reports] error for user ${owner.id}:`,
          userErr
        );
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ generated, errors, total_users: validOwners.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[weekly-owner-reports] fatal error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildInsightPrompt(report: {
  user_name: string;
  pets: { name: string; species: string; weight_kg: number | null }[];
  reminders: {
    total_last_week: number;
    completed_last_week: number;
    completion_rate: number | null;
  };
  upcoming_reminders: { title: string; type: string; due_date: string; pet_name: string }[];
  medical_records_added: number;
}): string {
  const petNames = report.pets.map((p) => p.name).join(", ");
  const completionInfo =
    report.reminders.total_last_week > 0
      ? `completó ${report.reminders.completed_last_week} de ${report.reminders.total_last_week} recordatorios (${report.reminders.completion_rate}%)`
      : "no tenía recordatorios esta semana";
  const upcomingCount = report.upcoming_reminders.length;
  const medicalInfo =
    report.medical_records_added > 0
      ? `Agregó ${report.medical_records_added} registro(s) médico(s).`
      : "No agregó registros médicos esta semana.";

  return (
    `Genera exactamente 2 oraciones como "insight de la semana" para ${report.user_name}, ` +
    `dueño/a de: ${petNames}. ` +
    `Esta semana: ${completionInfo}. ` +
    `Tiene ${upcomingCount} recordatorio(s) próximo(s). ` +
    `${medicalInfo} ` +
    `Responde SOLO las 2 oraciones, sin encabezados ni formato especial. ` +
    `Sé motivador y menciona a las mascotas por nombre si es posible.`
  );
}
