-- ============================================================
-- Triggers de avg_rating + enforcement de límite de invitaciones
-- 2026-04-07
-- ============================================================

-- 1. Función para recalcular avg_rating y total_reviews de un provider
CREATE OR REPLACE FUNCTION recalc_provider_rating(p_provider_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE service_providers
  SET
    avg_rating = COALESCE((
      SELECT round(avg(rating)::numeric, 2)
      FROM service_reviews
      WHERE provider_id = p_provider_id AND is_visible = true
    ), 0),
    total_reviews = COALESCE((
      SELECT count(*)
      FROM service_reviews
      WHERE provider_id = p_provider_id AND is_visible = true
    ), 0),
    updated_at = now()
  WHERE id = p_provider_id;
END;
$$;

-- 2. Trigger sobre service_reviews (INSERT/UPDATE/DELETE)
CREATE OR REPLACE FUNCTION trg_service_reviews_recalc()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_provider_rating(OLD.provider_id);
    RETURN OLD;
  ELSE
    PERFORM recalc_provider_rating(NEW.provider_id);
    -- Si cambió el provider_id (raro), recalcular también el viejo
    IF TG_OP = 'UPDATE' AND OLD.provider_id IS DISTINCT FROM NEW.provider_id THEN
      PERFORM recalc_provider_rating(OLD.provider_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS service_reviews_recalc ON service_reviews;
CREATE TRIGGER service_reviews_recalc
  AFTER INSERT OR UPDATE OR DELETE ON service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trg_service_reviews_recalc();

-- Backfill inicial: recalcular todos los providers existentes
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM service_providers LOOP
    PERFORM recalc_provider_rating(r.id);
  END LOOP;
END;
$$;

-- ============================================================
-- 3. Enforcement de límite de invitaciones a reseña por plan
-- ============================================================
CREATE OR REPLACE FUNCTION trg_review_invitations_check_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan text;
  v_limit integer;
  v_used integer;
BEGIN
  -- Obtener el plan del provider
  SELECT provider_plan INTO v_plan
  FROM service_providers
  WHERE id = NEW.provider_id;

  -- Mapear plan → límite mensual
  v_limit := CASE v_plan
    WHEN 'provider_free' THEN 0
    WHEN 'provider_individual' THEN 5
    WHEN 'provider_clinic_basic' THEN 20
    WHEN 'provider_clinic_pro' THEN 999999
    ELSE 0
  END;

  IF v_limit = 0 THEN
    RAISE EXCEPTION 'Tu plan actual no permite invitaciones a reseña. Mejora a Plan Individual.';
  END IF;

  -- Contar invitaciones del mes actual
  SELECT count(*) INTO v_used
  FROM review_invitations
  WHERE provider_id = NEW.provider_id
    AND created_at >= date_trunc('month', now());

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'Llegaste al límite de % invitaciones este mes para tu plan.', v_limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS review_invitations_check_limit ON review_invitations;
CREATE TRIGGER review_invitations_check_limit
  BEFORE INSERT ON review_invitations
  FOR EACH ROW
  EXECUTE FUNCTION trg_review_invitations_check_limit();

-- ============================================================
-- 4. RLS para provider_verifications (admin puede leer/actualizar todas)
-- ============================================================
DROP POLICY IF EXISTS "Admins can read all verifications" ON provider_verifications;
CREATE POLICY "Admins can read all verifications"
  ON provider_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update verifications" ON provider_verifications;
CREATE POLICY "Admins can update verifications"
  ON provider_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Y permitir que admin marque a un provider como verified al aprobarlo
DROP POLICY IF EXISTS "Admins can update providers verification" ON service_providers;
CREATE POLICY "Admins can update providers verification"
  ON service_providers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
