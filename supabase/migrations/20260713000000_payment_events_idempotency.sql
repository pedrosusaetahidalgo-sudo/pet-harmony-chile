-- ==========================================================================
-- P0-2 — Idempotencia de webhooks de Flow (auditoría top-tier 2026-04-20)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Problema resuelto:
--   Flow.cl reenvía el callback (flow-webhook) si no recibe 200 rápido
--   o por su propio fault tolerance. Hoy, dos entregas del mismo token
--   podían ejecutar el camino B2C/B2B/donation dos veces (apply_premium
--   ya es idempotente, pero el B2B update y el trigger de
--   send-donation-thanks no lo eran).
--
--   Esta migración crea una tabla de "eventos ya procesados" con
--   PRIMARY KEY (flow_token, status_code). El webhook hace
--   INSERT ... ON CONFLICT DO NOTHING como primer paso crítico:
--     - 1ra vez: inserta, continúa procesando.
--     - 2da vez (mismo token+status): conflict, no inserta, webhook
--       corta con 200 y NO ejecuta el resto.
--
--   Como status es parte de la PK, una transición legítima
--   (pending -> paid, o paid -> refunded) sigue procesándose.
--
-- Idempotente: CREATE TABLE IF NOT EXISTS + DROP/CREATE policy.
-- No toca datos existentes. Una vez aplicada, el webhook empezará a
-- llenarla (ver cambios en supabase/functions/flow-webhook/index.ts).
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.payment_events (
  flow_token      TEXT        NOT NULL,
  status_code     SMALLINT    NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  outcome         TEXT        CHECK (outcome IN ('ok', 'failed', 'skipped')),
  error_message   TEXT,
  payload_summary JSONB       NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (flow_token, status_code)
);

COMMENT ON TABLE public.payment_events IS
  'Lock de idempotencia para callbacks de Flow.cl. PK (flow_token, status_code) garantiza que cada transición se procese una sola vez aunque Flow reenvíe el webhook.';

COMMENT ON COLUMN public.payment_events.status_code IS
  'Código status de Flow getStatus: 1=pendiente, 2=pagada, 3=rechazada, 4=anulada.';

COMMENT ON COLUMN public.payment_events.outcome IS
  'ok = procesamiento exitoso, failed = error en el handler, skipped = rechazado antes de efectos (ej. amount inválido). NULL mientras está procesándose.';

-- Index para auditoría admin (ver pagos procesados últimas 24h)
CREATE INDEX IF NOT EXISTS idx_payment_events_received_at
  ON public.payment_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_outcome_received
  ON public.payment_events (outcome, received_at DESC);

-- ──────────────────────────────────────────────────────────────────────────
-- RLS: solo service_role escribe/lee. Admins pueden leer via RPC dedicado
-- si se necesita en el panel.
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_events service role only" ON public.payment_events;
CREATE POLICY "payment_events service role only"
  ON public.payment_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Los admins pueden SELECT para auditoría desde Admin > Finance.
-- Inline (no usamos helper is_active_admin para no depender de su
-- creación previa: migraciones 20260518200000 / 20260519200000 /
-- 20260519300000 podrían no estar aplicadas en todos los entornos).
DROP POLICY IF EXISTS "payment_events admin read" ON public.payment_events;
CREATE POLICY "payment_events admin read"
  ON public.payment_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      WHERE aa.user_id = auth.uid()
        AND aa.is_active = true
    )
  );

-- ──────────────────────────────────────────────────────────────────────────
-- Verificación post-apply:
--
--   SELECT count(*) FROM public.payment_events;        -- debería ser 0
--   \d public.payment_events                            -- PK (flow_token, status_code)
--
--   -- Simular webhook duplicado (manual):
--   INSERT INTO public.payment_events (flow_token, status_code, outcome)
--     VALUES ('TEST-TOKEN-123', 2, 'ok');
--   INSERT INTO public.payment_events (flow_token, status_code, outcome)
--     VALUES ('TEST-TOKEN-123', 2, 'ok')
--     ON CONFLICT DO NOTHING;                           -- debe NO insertar
--
--   SELECT count(*) FROM public.payment_events
--     WHERE flow_token = 'TEST-TOKEN-123';              -- debe ser 1
--
--   DELETE FROM public.payment_events
--     WHERE flow_token = 'TEST-TOKEN-123';              -- cleanup
-- ──────────────────────────────────────────────────────────────────────────
