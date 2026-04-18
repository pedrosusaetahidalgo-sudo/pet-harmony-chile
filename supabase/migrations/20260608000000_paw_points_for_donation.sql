-- ==========================================================================
-- Paw Points por donacion: trigger que otorga puntos cuando una donacion se paga
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- Incentivo extra para donantes: por cada donacion pagada via Flow, el
-- user recibe Paw Points proporcionales al monto. Ratio definido:
--   10 Paw Points por cada $100 CLP donados (10% del monto en points).
--
-- Ejemplos:
--   $1.000 CLP  →   100 points
--   $5.000 CLP  →   500 points
--   $50.000 CLP → 5.000 points
--
-- Comparacion: una accion normal (completar rutina, publicar post) da ~20 puntos,
-- por lo que $1.000 CLP ≈ 5 acciones. Balance entre incentivar donaciones y no
-- inflar la economia de points.
--
-- Los points solo se otorgan si user_id es NOT NULL (donantes anonimos sin
-- cuenta no entran a la gamificacion).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.award_points_for_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INT;
  v_old_status TEXT;
BEGIN
  -- Solo otorgar points cuando el pago efectivamente se concreta (pending -> paid)
  -- o cuando llega paid directo (INSERT con status='paid').
  v_old_status := COALESCE(OLD.status, '');

  IF NEW.status = 'paid'
     AND v_old_status <> 'paid'
     AND NEW.user_id IS NOT NULL
     AND NEW.amount_clp > 0 THEN

    -- Ratio: 10 points por cada $100 CLP (equivale a 10% del monto).
    v_points := FLOOR(NEW.amount_clp / 100);

    IF v_points > 0 THEN
      -- Registrar en points_history (audit trail de gamificacion)
      INSERT INTO public.points_history (
        user_id,
        points,
        action_type,
        action_id,
        description,
        created_at
      )
      VALUES (
        NEW.user_id,
        v_points,
        'donation',
        NEW.id,
        format('Paw Points por aporte de $%s CLP', NEW.amount_clp::TEXT),
        NOW()
      );

      -- Actualizar total de points en profile (cache denormalizada)
      UPDATE public.profiles
      SET
        points = COALESCE(points, 0) + v_points,
        updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Asegurar el trigger no duplicado
DROP TRIGGER IF EXISTS trg_award_points_for_donation ON public.donations;

CREATE TRIGGER trg_award_points_for_donation
  AFTER INSERT OR UPDATE OF status ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_donation();

COMMENT ON FUNCTION public.award_points_for_donation() IS
  'Trigger que otorga Paw Points (10 por $100 CLP) a donantes autenticados cuando su donacion pasa a status=paid. Registra en points_history + actualiza profiles.points.';

-- Backfill opcional: otorgar points a donaciones ya pagadas que aun no
-- tienen registro en points_history. Solo aplica a donaciones con user_id.
-- Se ejecuta una sola vez en esta migracion.
DO $$
DECLARE
  v_row RECORD;
  v_points INT;
BEGIN
  FOR v_row IN
    SELECT d.id, d.user_id, d.amount_clp
    FROM public.donations d
    WHERE d.status = 'paid'
      AND d.user_id IS NOT NULL
      AND d.amount_clp > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.points_history ph
        WHERE ph.action_type = 'donation'
          AND ph.action_id = d.id
      )
  LOOP
    v_points := FLOOR(v_row.amount_clp / 100);
    IF v_points > 0 THEN
      INSERT INTO public.points_history (
        user_id, points, action_type, action_id, description, created_at
      )
      VALUES (
        v_row.user_id,
        v_points,
        'donation',
        v_row.id,
        format('Paw Points (backfill) por aporte de $%s CLP', v_row.amount_clp::TEXT),
        NOW()
      );

      UPDATE public.profiles
      SET points = COALESCE(points, 0) + v_points, updated_at = NOW()
      WHERE id = v_row.user_id;
    END IF;
  END LOOP;
END $$;
