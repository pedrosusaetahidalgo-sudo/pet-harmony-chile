-- ==========================================================================
-- Lote A.4 — Booking commission tracking (vet_bookings)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Auditoría E2E pre-launch):
-- plans.ts declara commissionRate 10/5/3/0 % segun tier (provider_free/
-- provider_premium/provider_clinic_starter/provider_pro_max). Hoy flow-
-- webhook no aplicaba ninguna comision en bookings (vet_bookings).
--
-- Este patch:
-- 1. Agrega commission_rate + commission_amount_clp a vet_bookings.
-- 2. Trigger AFTER UPDATE status='completado' calcula la comision
--    usando el plan vigente del vet al momento de completar.
-- 3. RPC admin para recalcular comision de un booking (manual).
--
-- NOTA: walk_bookings y dogsitter_bookings quedan fuera — no tienen
-- modelo de ingresos B2B todavia. Se agregan cuando haya pricing claro.
--
-- Idempotente.
-- ==========================================================================

ALTER TABLE public.vet_bookings
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS commission_amount_clp INTEGER,
  ADD COLUMN IF NOT EXISTS commission_calculated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.vet_bookings.commission_rate IS
  'Porcentaje de comision Paw Friend cobrada al vet (10/5/3/0 segun plan).';
COMMENT ON COLUMN public.vet_bookings.commission_amount_clp IS
  'Monto absoluto en CLP = total_price * commission_rate / 100.';

CREATE INDEX IF NOT EXISTS idx_vet_bookings_commission_pending
  ON public.vet_bookings(status)
  WHERE status = 'completado' AND commission_calculated_at IS NULL;

-- ----------------------------------------------------------------------
-- Funcion: calcular comision para un booking dado
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_booking_commission(p_booking_id UUID)
RETURNS TABLE(booking_id UUID, rate NUMERIC, amount_clp INTEGER, plan TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.vet_bookings%ROWTYPE;
  v_plan TEXT;
  v_rate NUMERIC;
  v_amount INT;
BEGIN
  SELECT * INTO v_booking FROM public.vet_bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Obtener plan vigente del vet (usa service_providers.user_id = vet_bookings.vet_id)
  SELECT provider_plan INTO v_plan
    FROM public.service_providers
    WHERE user_id = v_booking.vet_id;

  IF v_plan IS NULL THEN v_plan := 'provider_free'; END IF;

  v_rate := CASE v_plan
    WHEN 'provider_free' THEN 10.0
    WHEN 'provider_premium' THEN 5.0
    WHEN 'provider_clinic_starter' THEN 3.0
    WHEN 'provider_pro_max' THEN 0.0
    ELSE 10.0
  END;

  v_amount := FLOOR(v_booking.total_price * v_rate / 100)::INT;

  UPDATE public.vet_bookings
    SET commission_rate = v_rate,
        commission_amount_clp = v_amount,
        commission_calculated_at = NOW()
    WHERE id = p_booking_id;

  RETURN QUERY
  SELECT p_booking_id, v_rate, v_amount, v_plan;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.calculate_booking_commission(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_booking_commission(UUID) TO authenticated;

-- ----------------------------------------------------------------------
-- Trigger: calcular comision al completar booking
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_calculate_booking_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo al transicionar a completado
  IF NEW.status = 'completado' AND OLD.status IS DISTINCT FROM 'completado' THEN
    BEGIN
      PERFORM public.calculate_booking_commission(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      -- Best effort: nunca romper el UPDATE del booking por fallo de comision
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vet_bookings_commission ON public.vet_bookings;
CREATE TRIGGER trg_vet_bookings_commission
  AFTER UPDATE ON public.vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calculate_booking_commission();

-- ----------------------------------------------------------------------
-- RPC admin: recalcular comision (util si cambian reglas o plan)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_recalculate_commission(p_booking_id UUID)
RETURNS TABLE(booking_id UUID, rate NUMERIC, amount_clp INTEGER, plan TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY SELECT * FROM public.calculate_booking_commission(p_booking_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_recalculate_commission(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recalculate_commission(UUID) TO authenticated;

-- ----------------------------------------------------------------------
-- Backfill opcional: calcular comision para bookings ya completados
-- sin commission_calculated_at. Descomentar si quieres correrlo.
-- ----------------------------------------------------------------------
-- DO $$
-- DECLARE v_id UUID; v_count INT := 0;
-- BEGIN
--   FOR v_id IN
--     SELECT id FROM public.vet_bookings
--     WHERE status = 'completado' AND commission_calculated_at IS NULL
--   LOOP
--     PERFORM public.calculate_booking_commission(v_id);
--     v_count := v_count + 1;
--   END LOOP;
--   RAISE NOTICE 'Backfilled % bookings', v_count;
-- END $$;

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- SELECT id, total_price, commission_rate, commission_amount_clp
--   FROM vet_bookings WHERE status = 'completado' LIMIT 10;
-- SELECT * FROM calculate_booking_commission('<uuid>');  -- manual test
-- ----------------------------------------------------------------------
