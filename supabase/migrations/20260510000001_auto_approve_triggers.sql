-- Auto-aprobacion inteligente para proveedores no-vet y verification requests
-- Spec: ADMIN_POWERHOUSE_SPEC.md secciones 2.1, 2.3

-- =============================================
-- 1. Auto-aprobar proveedores no-vet con datos completos
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_approve_provider()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_vet BOOLEAN;
  has_offering BOOLEAN;
BEGIN
  -- Solo actuar si status es pending
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Verificar si tiene offering tipo vet
  SELECT EXISTS (
    SELECT 1 FROM provider_service_offerings
    WHERE provider_id = NEW.id AND service_type = 'vet'
  ) INTO is_vet;

  -- Vets NUNCA se auto-aprueban (requieren verificacion Colmevet)
  IF is_vet THEN
    RETURN NEW;
  END IF;

  -- Verificar que tiene al menos 1 servicio activo
  SELECT EXISTS (
    SELECT 1 FROM provider_service_offerings
    WHERE provider_id = NEW.id AND is_active = true
  ) INTO has_offering;

  -- Auto-aprobar si datos completos
  IF NEW.display_name IS NOT NULL
    AND NEW.display_name != ''
    AND NEW.city IS NOT NULL
    AND NEW.commune IS NOT NULL
    AND NEW.bio IS NOT NULL
    AND char_length(NEW.bio) >= 20
    AND has_offering
  THEN
    NEW.status := 'approved';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger en UPDATE (no INSERT, porque al insertar aun no tiene offerings)
DROP TRIGGER IF EXISTS trg_auto_approve_provider ON service_providers;
CREATE TRIGGER trg_auto_approve_provider
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION auto_approve_provider();

-- =============================================
-- 2. Funcion para re-evaluar aprobacion cuando se agrega un servicio
-- =============================================

CREATE OR REPLACE FUNCTION public.reevaluate_provider_on_offering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_status TEXT;
  is_vet BOOLEAN;
  prov RECORD;
BEGIN
  -- Obtener estado actual del provider
  SELECT status, display_name, city, commune, bio
  INTO prov
  FROM service_providers
  WHERE id = NEW.provider_id;

  -- Solo re-evaluar si esta pending
  IF prov.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- No auto-aprobar si el nuevo servicio es vet
  IF NEW.service_type = 'vet' THEN
    RETURN NEW;
  END IF;

  -- Verificar completitud
  IF prov.display_name IS NOT NULL
    AND prov.display_name != ''
    AND prov.city IS NOT NULL
    AND prov.commune IS NOT NULL
    AND prov.bio IS NOT NULL
    AND char_length(prov.bio) >= 20
  THEN
    UPDATE service_providers SET status = 'approved' WHERE id = NEW.provider_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reevaluate_on_offering ON provider_service_offerings;
CREATE TRIGGER trg_reevaluate_on_offering
  AFTER INSERT ON provider_service_offerings
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION reevaluate_provider_on_offering();

-- =============================================
-- 3. Auto-resolver verification requests si ya tiene provider aprobado
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_resolve_verification_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matching_provider BOOLEAN;
BEGIN
  -- Solo actuar en nuevas requests pendientes
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Buscar si ya tiene provider aprobado con servicio matching
  SELECT EXISTS (
    SELECT 1
    FROM service_providers sp
    JOIN provider_service_offerings pso ON pso.provider_id = sp.id
    WHERE sp.user_id = NEW.user_id
      AND sp.status = 'approved'
      AND (
        (NEW.requested_role = 'dog_walker' AND pso.service_type = 'walking')
        OR (NEW.requested_role = 'dogsitter' AND pso.service_type = 'sitting')
        OR (NEW.requested_role = 'trainer' AND pso.service_type = 'training')
        OR (NEW.requested_role = 'groomer' AND pso.service_type = 'grooming')
        OR (NEW.requested_role = 'vet' AND pso.service_type = 'vet' AND sp.is_verified = true)
      )
  ) INTO matching_provider;

  IF matching_provider THEN
    NEW.status := 'approved';
    NEW.notes := 'Auto-aprobado: provider verificado con servicio activo';
    NEW.reviewed_at := now();

    -- Agregar rol
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.requested_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_resolve_verification ON verification_requests;
CREATE TRIGGER trg_auto_resolve_verification
  BEFORE INSERT ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_resolve_verification_request();

-- =============================================
-- 4. Auto-aprobar promotions con score IA >= 0.8
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_approve_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending'
    AND NEW.ai_moderation_score IS NOT NULL
    AND NEW.ai_moderation_score >= 0.8
  THEN
    NEW.status := 'approved';
    NEW.reviewed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approve_promotion ON service_promotions;
CREATE TRIGGER trg_auto_approve_promotion
  BEFORE INSERT OR UPDATE ON service_promotions
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION auto_approve_promotion();
