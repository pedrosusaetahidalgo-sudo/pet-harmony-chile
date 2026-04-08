-- ============================================================================
-- Reconciliación atómica de total_paw_points
-- ----------------------------------------------------------------------------
-- Contexto: hoy `total_paw_points` en `user_guardian_progress` se actualiza
-- desde la función `awardPoints()` en cliente + RPC. Si dos awards corren en
-- paralelo o un INSERT a `paw_point_transactions` ocurre por otro path, el
-- agregado puede driftear. Este trigger garantiza que cualquier INSERT en
-- `paw_point_transactions` reconcilie `total_paw_points` desde la suma real.
--
-- Diseño:
--  - AFTER INSERT en paw_point_transactions
--  - Recalcula total como SUM(points_amount) WHERE user_id = NEW.user_id
--    (los `spend`/`penalty` ya vienen como negativos por convención del cliente)
--  - UPSERT en user_guardian_progress (crea fila si no existe)
--
-- Idempotente: re-aplicar el trigger sobre transacciones existentes deja
-- el agregado consistente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reconcile_total_paw_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT COALESCE(SUM(points_amount), 0)
    INTO v_total
    FROM public.paw_point_transactions
    WHERE user_id = NEW.user_id;

  INSERT INTO public.user_guardian_progress (user_id, total_paw_points, current_level_points, last_activity_date)
    VALUES (NEW.user_id, GREATEST(v_total, 0), GREATEST(v_total, 0), CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE
      SET total_paw_points = GREATEST(v_total, 0),
          last_activity_date = CURRENT_DATE,
          updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reconcile_total_paw_points ON public.paw_point_transactions;

CREATE TRIGGER trg_reconcile_total_paw_points
  AFTER INSERT ON public.paw_point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.reconcile_total_paw_points();

-- Backfill: reconciliar agregados existentes
UPDATE public.user_guardian_progress ugp
SET total_paw_points = GREATEST(sub.total, 0)
FROM (
  SELECT user_id, COALESCE(SUM(points_amount), 0) AS total
  FROM public.paw_point_transactions
  GROUP BY user_id
) sub
WHERE ugp.user_id = sub.user_id
  AND ugp.total_paw_points <> GREATEST(sub.total, 0);
