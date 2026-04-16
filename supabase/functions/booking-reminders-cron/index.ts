// booking-reminders-cron
// Runs every 30 minutes. Sends reminder notifications for confirmed bookings:
//  - 24h before: push/email/in-app
//  - 2h before: push/in-app
// Schedule: every 30 min
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (_req: Request) => {
  const sb = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const stats = { reminders_24h: 0, reminders_2h: 0, errors: 0 };

  try {
    // ── 24h reminders ──────────────────────────────────────
    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: bookings24h } = await sb
      .from('vet_bookings')
      .select('id, owner_id, service_provider_id, pet_id, scheduled_date, start_time, service_type')
      .in('status', ['pendiente', 'confirmado'])
      .eq('reminder_24h_sent', false)
      .gte('scheduled_date', window24hStart.toISOString())
      .lte('scheduled_date', window24hEnd.toISOString());

    for (const booking of bookings24h ?? []) {
      try {
        // Create in-app notification for owner
        await sb.from('notifications').insert({
          user_id: booking.owner_id,
          type: 'booking_reminder_24h',
          title: 'Recordatorio: tienes una reserva manana',
          body: `Tu reserva es manana${booking.start_time ? ' a las ' + booking.start_time.substring(0, 5) : ''}. No olvides asistir.`,
          action_url: '/mis-reservas',
          reference_id: booking.id,
        });

        // Create notification for provider too
        if (booking.service_provider_id) {
          const { data: sp } = await sb
            .from('service_providers')
            .select('user_id')
            .eq('id', booking.service_provider_id)
            .single();

          if (sp?.user_id) {
            await sb.from('notifications').insert({
              user_id: sp.user_id,
              type: 'booking_reminder_24h',
              title: 'Recordatorio: tienes una cita manana',
              body: `Tienes una cita programada para manana${booking.start_time ? ' a las ' + booking.start_time.substring(0, 5) : ''}.`,
              action_url: '/provider/dashboard',
              reference_id: booking.id,
            });
          }
        }

        // Mark as sent
        await sb.from('vet_bookings').update({ reminder_24h_sent: true }).eq('id', booking.id);

        // Log booking event
        await sb.from('booking_events').insert({
          booking_type: 'vet',
          booking_id: booking.id,
          event_type: 'reminder_sent',
          actor_role: 'system',
          metadata: { type: '24h' },
        });

        stats.reminders_24h++;
      } catch (err) {
        console.warn(`Error sending 24h reminder for booking ${booking.id}:`, err);
        stats.errors++;
      }
    }

    // ── 2h reminders ───────────────────────────────────────
    const window2hStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
    const window2hEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const { data: bookings2h } = await sb
      .from('vet_bookings')
      .select('id, owner_id, service_provider_id, pet_id, scheduled_date, start_time')
      .in('status', ['confirmado'])
      .eq('reminder_2h_sent', false)
      .gte('scheduled_date', window2hStart.toISOString())
      .lte('scheduled_date', window2hEnd.toISOString());

    for (const booking of bookings2h ?? []) {
      try {
        await sb.from('notifications').insert({
          user_id: booking.owner_id,
          type: 'booking_reminder_2h',
          title: 'Tu cita es en 2 horas',
          body: `Recuerda asistir a tu cita${booking.start_time ? ' a las ' + booking.start_time.substring(0, 5) : ''}.`,
          action_url: '/mis-reservas',
          reference_id: booking.id,
        });

        await sb.from('vet_bookings').update({ reminder_2h_sent: true }).eq('id', booking.id);

        await sb.from('booking_events').insert({
          booking_type: 'vet',
          booking_id: booking.id,
          event_type: 'reminder_sent',
          actor_role: 'system',
          metadata: { type: '2h' },
        });

        stats.reminders_2h++;
      } catch (err) {
        console.warn(`Error sending 2h reminder for booking ${booking.id}:`, err);
        stats.errors++;
      }
    }
  } catch (err) {
    console.error('booking-reminders-cron fatal error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  console.log('booking-reminders-cron results:', stats);

  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json' },
  });
});
