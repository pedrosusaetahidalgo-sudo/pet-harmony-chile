-- ==========================================================================
-- Donations: soporte para donaciones recurrentes (mensuales)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d INIT-04):
-- La tabla `donations` original solo soporta one-time. Para activar
-- donaciones recurrentes (flag `DONATIONS_MONTHLY`) + Paw Companys
-- sponsor con aporte mensual, agregamos columnas de recurrencia sin
-- romper los registros existentes.
--
-- Por que en una migracion aparte (en vez de ampliar 20260602010000):
-- esa migracion ya fue aplicada en produccion. Respeta CLAUDE.md §9.8
-- (protege datos de usuarios existentes) — todas las filas existentes
-- quedan con frequency='one_time' via DEFAULT.
--
-- El flag DONATIONS_MONTHLY en src/lib/featureFlags.ts sigue en false
-- hasta que INIT-01 (migracion Flow a SpA) quede lista. Esta migracion
-- solo prepara el schema, no activa ninguna funcionalidad.
-- ==========================================================================

-- ----------------------------------------------------------------------
-- Columnas nuevas (NULLABLE o con DEFAULT para proteger datos existentes)
-- ----------------------------------------------------------------------
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'one_time'
    CHECK (frequency IN ('one_time', 'monthly'));

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;  -- ID de suscripcion Flow si es monthly

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS next_charge_at TIMESTAMPTZ;  -- cuando se cobra la siguiente

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;  -- user cancelo la recurrente

-- Beneficiario opcional (refugio). Mig 20260620000000 ya agrego beneficiary_*
-- en donations si fue aplicada. Lo agregamos con IF NOT EXISTS para idempotencia.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'donations'
      AND column_name = 'beneficiary_type'
  ) THEN
    ALTER TABLE public.donations
      ADD COLUMN beneficiary_type TEXT DEFAULT 'paw_friend'
        CHECK (beneficiary_type IN ('paw_friend', 'adoption_center'));
    ALTER TABLE public.donations
      ADD COLUMN beneficiary_adoption_center_id UUID
        REFERENCES public.adoption_centers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------
-- Index para cron de cobros recurrentes (eficiente para "proximos a cobrar")
-- ----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_donations_recurrence_due
  ON public.donations(next_charge_at, status)
  WHERE frequency = 'monthly'
    AND cancelled_at IS NULL
    AND status = 'paid';

CREATE INDEX IF NOT EXISTS idx_donations_subscription
  ON public.donations(subscription_id)
  WHERE subscription_id IS NOT NULL;

-- ----------------------------------------------------------------------
-- Comment documentando el contrato
-- ----------------------------------------------------------------------
COMMENT ON COLUMN public.donations.frequency IS
  'one_time | monthly. Las recurrentes requieren feature flag DONATIONS_MONTHLY=true (src/lib/featureFlags.ts) + cuenta Flow SpA.';

COMMENT ON COLUMN public.donations.subscription_id IS
  'ID de suscripcion Flow.cl. Solo para frequency=monthly. NULL para one-time.';

COMMENT ON COLUMN public.donations.next_charge_at IS
  'Proxima fecha de cobro automatico. Solo para recurrentes activas (cancelled_at IS NULL).';

COMMENT ON COLUMN public.donations.beneficiary_type IS
  'paw_friend | adoption_center. Dirige a refugio cuando SHELTER_DONATIONS flag=true.';
