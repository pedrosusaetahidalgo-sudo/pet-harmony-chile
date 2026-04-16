-- ============================================================================
-- Fase 4: Recursos de clínica (salas/quirófanos) + soporte cobros WhatsApp
-- ============================================================================

-- Tabla de recursos de la clínica (salas, quirófanos, equipos)
CREATE TABLE IF NOT EXISTS public.provider_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'room'
    CHECK (type IN ('room', 'surgery', 'equipment', 'other')),
  color TEXT DEFAULT '#9333ea',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.provider_resources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "provider_manages_own_resources"
    ON public.provider_resources FOR ALL
    USING (
      provider_id IN (
        SELECT id FROM public.service_providers WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Índice
CREATE INDEX IF NOT EXISTS idx_provider_resources_provider
  ON public.provider_resources(provider_id) WHERE is_active = true;

-- Vincular bookings a recursos (nullable — retrocompatible)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vet_bookings' AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE public.vet_bookings
      ADD COLUMN resource_id UUID REFERENCES public.provider_resources(id);
  END IF;
END $$;

-- Tabla de log de cobros enviados por WhatsApp
-- Complementa whatsapp_message_log con datos de cobro específicos
CREATE TABLE IF NOT EXISTS public.payment_reminders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.vet_bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id),
  owner_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'email', 'in_app')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cooldown: no enviar más de 1 cobro por booking por canal por día
-- Usamos una función wrapper IMMUTABLE para evitar el error de Postgres
CREATE OR REPLACE FUNCTION public.to_cl_date(ts TIMESTAMPTZ)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $f$
  SELECT (ts AT TIME ZONE 'America/Santiago')::date;
$f$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_reminder_cooldown
  ON public.payment_reminders_log (booking_id, channel, (public.to_cl_date(sent_at)));

ALTER TABLE public.payment_reminders_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "provider_reads_own_payment_reminders"
    ON public.payment_reminders_log FOR ALL
    USING (
      provider_id IN (
        SELECT id FROM public.service_providers WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
