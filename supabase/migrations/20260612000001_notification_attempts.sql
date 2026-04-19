-- Tabla de tracking de intentos de notificacion (Booking System Overhaul §9.3).
-- Usada por booking-reminders-cron, reminder-cron y send-whatsapp-reminder para
-- registrar cada intento por canal, con idempotencia por (booking_id, reminder_type, channel).
--
-- Zero-downtime: tabla nueva, no modifica datos existentes.

CREATE TABLE IF NOT EXISTS public.notification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT,                                  -- 'vet'|'walk'|'dogsitter'|'training'|'pet_reminder'|'appointment'
  booking_id UUID,                                    -- id del booking o pet_reminder
  reminder_type TEXT NOT NULL,                        -- '24h'|'2h'|'cancelled'|'rescheduled'|'no_show_reminder'|...
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'push', 'email', 'in_app', 'sms')),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_contact TEXT,                             -- phone E164, email o token de push
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'skipped', 'read')),
  error_message TEXT,
  external_id TEXT,                                   -- meta_message_id / fcm_id / resend_id
  metadata JSONB DEFAULT '{}'::jsonb,                 -- payload enviado, codigo de error especifico, etc
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,                           -- si el canal reporta delivery
  read_at TIMESTAMPTZ                                 -- si el canal reporta read receipts
);

COMMENT ON TABLE public.notification_attempts IS
  'Registro de cada intento de notificacion por canal. Permite observabilidad (tasa de delivery), idempotencia (no re-enviar) y diagnostico por dueno/vet en soporte.';

-- ─── Indexes ───

-- Busqueda por booking (para mostrar en timeline admin "se envio WhatsApp a las X")
CREATE INDEX IF NOT EXISTS idx_notif_attempts_booking
  ON public.notification_attempts (booking_type, booking_id, attempted_at DESC);

-- Busqueda por recipient (para /profile "ver mis recordatorios")
CREATE INDEX IF NOT EXISTS idx_notif_attempts_recipient
  ON public.notification_attempts (recipient_id, attempted_at DESC);

-- Idempotencia: no reenviar el mismo reminder por el mismo canal al mismo booking.
-- Si el cron corre cada 30 min, esto evita duplicar 24h reminders.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_attempts_idempotency
  ON public.notification_attempts (booking_type, booking_id, reminder_type, channel)
  WHERE booking_id IS NOT NULL AND status IN ('sent', 'delivered', 'read');

-- Busqueda por status para el widget admin "tasa de delivery ultimas 24h"
CREATE INDEX IF NOT EXISTS idx_notif_attempts_status_time
  ON public.notification_attempts (status, attempted_at DESC);

-- ─── RLS ───

ALTER TABLE public.notification_attempts ENABLE ROW LEVEL SECURITY;

-- Service role: acceso total (edge functions + crons)
DROP POLICY IF EXISTS service_all ON public.notification_attempts;
CREATE POLICY service_all ON public.notification_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Recipient: puede leer sus propias notificaciones (ej: /profile "historial")
DROP POLICY IF EXISTS recipient_read ON public.notification_attempts;
CREATE POLICY recipient_read ON public.notification_attempts
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Admin: puede leer todas para soporte
DROP POLICY IF EXISTS admin_read ON public.notification_attempts;
CREATE POLICY admin_read ON public.notification_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
