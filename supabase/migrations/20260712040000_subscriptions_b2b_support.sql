-- ==========================================================================
-- Lote A.5 — Extender subscriptions.plan_type para tiers B2B
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Auditoría E2E pre-launch, addendum):
-- La tabla subscriptions tenia CHECK (plan_type IN ('monthly', 'yearly'))
-- heredado de solo B2C. Ahora flow-create-subscription tambien registra
-- pagos B2B (provider_premium, provider_clinic_starter, provider_pro_max)
-- en esta misma tabla para mantener trazabilidad unificada de todos los
-- pagos Flow.cl.
--
-- Idempotente: DROP + ADD constraint.
-- ==========================================================================

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN (
    'monthly',
    'yearly',
    'provider_premium',
    'provider_clinic_starter',
    'provider_pro_max'
  ));

COMMENT ON COLUMN public.subscriptions.plan_type IS
  'Plan pagado: monthly/yearly (B2C Paw Member) o provider_* (B2B vet).';

-- Columna opcional para facilitar queries (derivable de plan_type, pero util
-- para indexes y reportes admin).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS order_type TEXT
  CHECK (order_type IN ('b2c_paw_member', 'b2b_vet'));

COMMENT ON COLUMN public.subscriptions.order_type IS
  'b2c_paw_member | b2b_vet — clasificador del origen del pago.';

CREATE INDEX IF NOT EXISTS idx_subscriptions_order_type_status
  ON public.subscriptions(order_type, status);

-- Backfill: filas existentes son todas B2C
UPDATE public.subscriptions
  SET order_type = 'b2c_paw_member'
  WHERE order_type IS NULL
    AND plan_type IN ('monthly', 'yearly');

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- SELECT order_type, plan_type, COUNT(*) FROM subscriptions GROUP BY 1, 2;
-- -- Intentar insertar un provider_premium para verificar constraint OK
-- ----------------------------------------------------------------------
