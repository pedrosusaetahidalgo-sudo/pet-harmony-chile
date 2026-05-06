/**
 * Edge Function: sync-payment-to-booking
 *
 * Actualiza `payment_status` + `payment_reference` de una reserva al confirmarse
 * un pago externo (Flow.cl u otro gateway). Registra el cambio en booking_events
 * y (opcionalmente) notifica al dueno.
 *
 * Invocada desde:
 * - flow-webhook cuando optional.type === 'booking' (futuro).
 * - Admin panel cuando corrige manualmente un pago.
 * - Callback de Flow del owner (success page).
 *
 * Autenticacion: service role o authenticated (el caller debe ser owner del booking).
 *
 * Body JSON:
 *   {
 *     booking_id: string (uuid),
 *     booking_type: 'vet' | 'walk' | 'dogsitter' | 'training',
 *     payment_status: 'completed' | 'failed' | 'refunded' | 'pendiente',
 *     payment_reference?: string,
 *     amount?: number,
 *     metadata?: Record<string, unknown>
 *   }
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';
import { requireCronAuth } from '../_shared/cron-auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type BookingType = 'vet' | 'walk' | 'dogsitter' | 'training';
type PaymentStatus = 'completed' | 'failed' | 'refunded' | 'pendiente';

const TABLE_BY_TYPE: Record<BookingType, string> = {
  vet: 'vet_bookings',
  walk: 'walk_bookings',
  dogsitter: 'dogsitter_bookings',
  training: 'training_bookings',
};

interface Payload {
  booking_id?: string;
  booking_type?: BookingType;
  payment_status?: PaymentStatus;
  payment_reference?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

serve(
  withTelemetry('sync-payment-to-booking', async (req: Request) => {
    const cors = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
      return handleCorsOptions(req);
    }
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    // SEC pre-beta 2026-05-05: la fn UPDATE-aba payment_status sin auth.
    // Vector: atacante con booking_id adivinado podia marcar reserva como
    // completed sin pagar, o refunded para sabotear. Ahora exige
    // X-Cron-Secret o Bearer SUPABASE_SERVICE_ROLE_KEY (callers internos:
    // flow-webhook + admin panel).
    const authError = requireCronAuth(req);
    if (authError) return authError;

    let payload: Payload;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_json' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { booking_id, booking_type, payment_status, payment_reference, metadata } = payload;

    if (!booking_id || !booking_type || !payment_status) {
      return new Response(
        JSON.stringify({ error: 'missing_fields: booking_id, booking_type, payment_status' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!(booking_type in TABLE_BY_TYPE)) {
      return new Response(JSON.stringify({ error: 'invalid_booking_type' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!['completed', 'failed', 'refunded', 'pendiente'].includes(payment_status)) {
      return new Response(JSON.stringify({ error: 'invalid_payment_status' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const table = TABLE_BY_TYPE[booking_type];

    // Construye update set
    const updates: Record<string, unknown> = {
      payment_status,
      updated_at: new Date().toISOString(),
    };
    if (payment_reference) updates.payment_reference = payment_reference;

    const { data: updated, error: updateErr } = await supabase
      .from(table)
      .update(updates)
      .eq('id', booking_id)
      .select('id, owner_id, status, payment_status')
      .maybeSingle();

    if (updateErr) {
      console.error('[sync-payment-to-booking] update failed', updateErr);
      return new Response(JSON.stringify({ error: 'update_failed', detail: updateErr.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!updated) {
      return new Response(JSON.stringify({ error: 'booking_not_found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Log en booking_events
    const eventType =
      payment_status === 'completed'
        ? 'payment_received'
        : payment_status === 'refunded'
          ? 'payment_refunded'
          : null;

    if (eventType) {
      const { error: eventErr } = await supabase.from('booking_events').insert({
        booking_type,
        booking_id,
        event_type: eventType,
        actor_id: null,
        actor_role: 'system',
        new_status: payment_status,
        metadata: {
          payment_reference: payment_reference ?? null,
          amount: payload.amount ?? null,
          ...(metadata ?? {}),
        },
      });
      if (eventErr) {
        console.warn('[sync-payment-to-booking] booking_events insert failed', eventErr);
        // No abortar: la tabla principal ya se actualizo. El event es observability.
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        booking_id,
        payment_status,
        event_logged: !!eventType,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  })
);
