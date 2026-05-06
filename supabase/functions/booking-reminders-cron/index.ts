// booking-reminders-cron
// Runs every 30 minutes. Sends reminder notifications for confirmed bookings:
//  - 24h before: in-app + WhatsApp (si owner opted-in)
//  - 2h before: in-app
// Registra cada intento en notification_attempts para observabilidad y idempotencia.
// Schedule: every 30 min
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type ReminderType = '24h' | '2h';
type Channel = 'in_app' | 'whatsapp' | 'push' | 'email';

async function logAttempt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  params: {
    booking_type: 'vet';
    booking_id: string;
    reminder_type: ReminderType;
    channel: Channel;
    recipient_id: string;
    recipient_contact?: string | null;
    status: 'sent' | 'failed' | 'skipped';
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    // Ignora error si la tabla no existe todavia (antes de aplicar la migracion)
    await sb.from('notification_attempts').insert({
      ...params,
      attempted_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('notification_attempts insert skipped (table may not exist yet):', err);
  }
}

Deno.serve(
  withTelemetry('booking-reminders-cron', async (req: Request) => {
    const authError = requireCronAuth(req);
    if (authError) return authError;

    const sb = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const stats = {
      reminders_24h: 0,
      reminders_2h: 0,
      whatsapp_sent: 0,
      errors: 0,
    };

    try {
      // ── 24h reminders ──────────────────────────────────────
      const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const { data: bookings24h } = await sb
        .from('vet_bookings')
        .select(
          'id, owner_id, service_provider_id, pet_id, scheduled_date, start_time, service_type'
        )
        .in('status', ['pendiente', 'confirmado'])
        .eq('reminder_24h_sent', false)
        .gte('scheduled_date', window24hStart.toISOString())
        .lte('scheduled_date', window24hEnd.toISOString());

      for (const booking of bookings24h ?? []) {
        try {
          const timeStr = booking.start_time ? booking.start_time.substring(0, 5) : '';

          // ── Canal 1: in-app notification para owner ──
          await sb.from('notifications').insert({
            user_id: booking.owner_id,
            type: 'booking_reminder_24h',
            title: 'Recordatorio: tienes una reserva manana',
            body: `Tu reserva es manana${timeStr ? ' a las ' + timeStr : ''}. No olvides asistir.`,
            action_url: '/mis-reservas',
            reference_id: booking.id,
          });
          await logAttempt(sb, {
            booking_type: 'vet',
            booking_id: booking.id,
            reminder_type: '24h',
            channel: 'in_app',
            recipient_id: booking.owner_id,
            status: 'sent',
          });

          // ── Canal 2: in-app para provider ──
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
                body: `Tienes una cita programada para manana${timeStr ? ' a las ' + timeStr : ''}.`,
                action_url: '/provider/dashboard',
                reference_id: booking.id,
              });
              await logAttempt(sb, {
                booking_type: 'vet',
                booking_id: booking.id,
                reminder_type: '24h',
                channel: 'in_app',
                recipient_id: sp.user_id,
                status: 'sent',
                metadata: { role: 'provider' },
              });
            }
          }

          // ── Canal 3: WhatsApp para owner (si opted-in) ──
          const { data: profile } = await sb
            .from('profiles')
            .select('whatsapp_number, whatsapp_opted_in')
            .eq('id', booking.owner_id)
            .maybeSingle();

          if (profile?.whatsapp_opted_in && profile?.whatsapp_number) {
            try {
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-reminder`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                  phone: profile.whatsapp_number,
                  template: 'booking_24h',
                  body: `Recordatorio: tienes una reserva manana${timeStr ? ' a las ' + timeStr : ''} en Paw Friend. No olvides asistir.`,
                  booking_id: booking.id,
                }),
              });

              const ok = resp.ok;
              await logAttempt(sb, {
                booking_type: 'vet',
                booking_id: booking.id,
                reminder_type: '24h',
                channel: 'whatsapp',
                recipient_id: booking.owner_id,
                recipient_contact: profile.whatsapp_number,
                status: ok ? 'sent' : 'failed',
                error_message: ok ? undefined : `HTTP ${resp.status}`,
              });
              if (ok) stats.whatsapp_sent++;
            } catch (waErr) {
              console.warn(`WhatsApp send failed for booking ${booking.id}:`, waErr);
              await logAttempt(sb, {
                booking_type: 'vet',
                booking_id: booking.id,
                reminder_type: '24h',
                channel: 'whatsapp',
                recipient_id: booking.owner_id,
                recipient_contact: profile.whatsapp_number,
                status: 'failed',
                error_message: String(waErr),
              });
            }
          } else {
            await logAttempt(sb, {
              booking_type: 'vet',
              booking_id: booking.id,
              reminder_type: '24h',
              channel: 'whatsapp',
              recipient_id: booking.owner_id,
              status: 'skipped',
              metadata: { reason: 'not_opted_in' },
            });
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
          const timeStr = booking.start_time ? booking.start_time.substring(0, 5) : '';

          await sb.from('notifications').insert({
            user_id: booking.owner_id,
            type: 'booking_reminder_2h',
            title: 'Tu cita es en 2 horas',
            body: `Recuerda asistir a tu cita${timeStr ? ' a las ' + timeStr : ''}.`,
            action_url: '/mis-reservas',
            reference_id: booking.id,
          });
          await logAttempt(sb, {
            booking_type: 'vet',
            booking_id: booking.id,
            reminder_type: '2h',
            channel: 'in_app',
            recipient_id: booking.owner_id,
            status: 'sent',
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
  })
);
