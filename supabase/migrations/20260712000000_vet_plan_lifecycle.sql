-- ==========================================================================
-- Lote A.1 — Vet plan lifecycle (started/expires/next_billing/cancelled)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Auditoría E2E pre-launch 1 junio 2026):
-- Los 4 tiers B2B (Basica/Premium/Clinica/Pro Max) declarados en plans.ts
-- no tenian manera de tracker suscripcion activa vs expirada. Al pagar
-- via Flow.cl se debe setear started/expires/next_billing. Al cancelar
-- via webhook o vencerse sin renovar, cron downgradea a provider_free.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE.
-- ==========================================================================

-- ----------------------------------------------------------------------
-- 1. Columnas de lifecycle en service_providers
-- ----------------------------------------------------------------------
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_next_billing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_billing_cycle TEXT CHECK (plan_billing_cycle IN ('monthly', 'yearly'));

COMMENT ON COLUMN public.service_providers.plan_started_at IS
  'Fecha en que se activo el plan actual (set por flow-webhook al confirmar pago).';
COMMENT ON COLUMN public.service_providers.plan_expires_at IS
  'Fecha tope de validez del plan. NULL = plan free o sin vencimiento.';
COMMENT ON COLUMN public.service_providers.plan_next_billing_at IS
  'Proximo cobro. Si el user cancela antes, esta fecha queda fija (ultimo dia de cobertura).';
COMMENT ON COLUMN public.service_providers.plan_cancelled_at IS
  'Fecha en que el vet pidio cancelar (no implica downgrade inmediato — sigue hasta plan_expires_at).';
COMMENT ON COLUMN public.service_providers.plan_billing_cycle IS
  'monthly|yearly — identifica el ciclo de cobro elegido al suscribir.';

CREATE INDEX IF NOT EXISTS idx_service_providers_plan_expires
  ON public.service_providers(plan_expires_at)
  WHERE plan_expires_at IS NOT NULL AND provider_plan <> 'provider_free';

-- ----------------------------------------------------------------------
-- 2. Funcion: downgrade de planes vencidos
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.downgrade_expired_vet_plans()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count_downgraded INT := 0;
  v_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  WITH expired AS (
    UPDATE public.service_providers
    SET provider_plan = 'provider_free',
        plan_expires_at = NULL,
        plan_next_billing_at = NULL,
        plan_billing_cycle = NULL
    WHERE plan_expires_at IS NOT NULL
      AND plan_expires_at < NOW()
      AND provider_plan <> 'provider_free'
    RETURNING id
  )
  SELECT COUNT(*)::INT, ARRAY_AGG(id)
    INTO v_count_downgraded, v_ids
    FROM expired;

  RETURN jsonb_build_object(
    'downgraded', v_count_downgraded,
    'ids', to_jsonb(v_ids),
    'ran_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.downgrade_expired_vet_plans() IS
  'Downgrade a provider_free vets cuyo plan expiro sin renovacion. Cron diario.';

-- Revoke publico, admin y service_role pueden ejecutar.
REVOKE EXECUTE ON FUNCTION public.downgrade_expired_vet_plans() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------
-- 3. Cron diario 03:00 UTC (00:00 Chile) — idempotente
-- ----------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('downgrade-expired-vet-plans-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'downgrade-expired-vet-plans-daily',
  '0 3 * * *',
  $$SELECT public.downgrade_expired_vet_plans();$$
);

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- SELECT jobid, jobname, schedule, active FROM cron.job
--   WHERE jobname = 'downgrade-expired-vet-plans-daily';
-- SELECT * FROM downgrade_expired_vet_plans();  -- correr manual (0 downgrades esperados inicial)
-- ----------------------------------------------------------------------
