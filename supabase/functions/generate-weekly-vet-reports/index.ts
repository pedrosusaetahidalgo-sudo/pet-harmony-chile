/**
 * Edge Function: generate-weekly-vet-reports
 *
 * Genera reportes semanales para veterinarios y proveedores de servicio.
 * Para cada service_provider activo no-demo:
 *   - Nuevas reservas de la semana
 *   - Reservas completadas
 *   - Reservas canceladas / no-shows
 *   - Nuevas reseñas y rating promedio
 *   - Revenue (de vet_bookings.total_price donde status='completado')
 *   - Insight de la semana generado con Claude (español chileno)
 *
 * Auth: cron interno. Protegido por shared secret header (X-Cron-Secret).
 *
 * Schedule sugerido (Supabase Dashboard > Database > Cron Jobs):
 *   0 8 * * 1   ->  cada lunes a las 8:00 AM
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar shared secret para cron
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
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const periodStart = weekAgo.toISOString().slice(0, 10);
    const periodEnd = now.toISOString().slice(0, 10);

    // Obtener proveedores activos no-demo
    const { data: providers, error: provErr } = await supabase
      .from('service_providers')
      .select('id, user_id, business_name, is_demo')
      .eq('status', 'active');

    if (provErr) throw provErr;

    const validProviders = (providers ?? []).filter((p) => !p.is_demo);

    let generated = 0;
    let errors = 0;

    for (const provider of validProviders) {
      try {
        const providerId = provider.id;
        const userId = provider.user_id;

        // 1. Reservas de la semana (todas)
        const { data: bookings } = await supabase
          .from('vet_bookings')
          .select('id, status, total_price, created_at')
          .eq('provider_id', providerId)
          .gte('created_at', weekAgo.toISOString())
          .lte('created_at', now.toISOString());

        const allBookings = bookings ?? [];
        const newBookings = allBookings.length;
        const completedBookings = allBookings.filter((b) => b.status === 'completado').length;
        const cancelledBookings = allBookings.filter((b) => b.status === 'cancelado').length;
        const noShowBookings = allBookings.filter((b) => b.status === 'no_show').length;

        // 2. Revenue de la semana (solo completados)
        const revenue = allBookings
          .filter((b) => b.status === 'completado')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);

        // 3. Reseñas de la semana
        const { data: reviews } = await supabase
          .from('vet_reviews')
          .select('id, rating, comment, created_at')
          .eq('provider_id', providerId)
          .gte('created_at', weekAgo.toISOString())
          .lte('created_at', now.toISOString());

        const newReviews = reviews?.length ?? 0;
        const avgRating =
          newReviews > 0
            ? Math.round(
                ((reviews ?? []).reduce((sum, r) => sum + (r.rating || 0), 0) / newReviews) * 10
              ) / 10
            : null;

        // Armar contenido del reporte
        const reportContent = {
          provider_id: providerId,
          user_id: userId,
          business_name: provider.business_name || 'Proveedor',
          period: { start: periodStart, end: periodEnd },
          bookings: {
            new: newBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
            no_show: noShowBookings,
          },
          reviews: {
            new_count: newReviews,
            average_rating: avgRating,
            recent: (reviews ?? []).slice(0, 5).map((r) => ({
              rating: r.rating,
              comment: r.comment,
            })),
          },
          revenue_clp: revenue,
          insight: null as string | null,
        };

        // 4. Generar insight con Claude
        const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
        if (apiKey) {
          try {
            const insightPrompt = buildVetInsightPrompt(reportContent);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);

            try {
              const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                  model: 'claude-3-haiku-20240307',
                  max_tokens: 200,
                  temperature: 0.3,
                  system: [
                    {
                      type: 'text',
                      text: 'Analista negocio vet, Paw Friend Chile. Chileno (tu/tienes). Profesional, conciso, accionable.',
                      cache_control: { type: 'ephemeral' },
                    },
                  ],
                  messages: [{ role: 'user', content: insightPrompt }],
                }),
                signal: controller.signal,
              });

              if (claudeResp.ok) {
                const claudeData = await claudeResp.json();
                const text = claudeData.content?.[0]?.text ?? '';
                reportContent.insight = text.trim() || null;
              }
            } finally {
              clearTimeout(timeout);
            }
          } catch (aiErr) {
            console.warn(
              `[weekly-vet-reports] AI insight failed for provider ${providerId}:`,
              aiErr
            );
          }
        }

        // 5. Insertar en periodic_reports
        const { error: insertErr } = await supabase.from('periodic_reports').insert({
          user_id: userId,
          report_type: 'vet_weekly',
          period_start: periodStart,
          period_end: periodEnd,
          content_jsonb: reportContent,
        });

        if (insertErr) {
          console.error(
            `[weekly-vet-reports] insert failed for provider ${providerId}:`,
            insertErr
          );
          errors++;
        } else {
          generated++;
        }
      } catch (providerErr) {
        console.error(`[weekly-vet-reports] error for provider ${provider.id}:`, providerErr);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        generated,
        errors,
        total_providers: validProviders.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[weekly-vet-reports] fatal error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildVetInsightPrompt(report: {
  business_name: string;
  bookings: {
    new: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
  reviews: { new_count: number; average_rating: number | null };
  revenue_clp: number;
}): string {
  const { bookings, reviews, revenue_clp } = report;
  const revenueFormatted = revenue_clp.toLocaleString('es-CL');
  const ratingInfo =
    reviews.new_count > 0
      ? `Recibió ${reviews.new_count} reseña(s) nueva(s) con promedio de ${reviews.average_rating}/5.`
      : 'No recibió reseñas nuevas esta semana.';

  return (
    `2 oraciones insight semanal para ${report.business_name}. ` +
    `Semana: ${bookings.new} nuevas, ${bookings.completed} completadas, ` +
    `${bookings.cancelled} canceladas, ${bookings.no_show} no-show. ` +
    `Revenue: $${revenueFormatted}. ${ratingInfo} Solo 2 oraciones con sugerencia práctica.`
  );
}
