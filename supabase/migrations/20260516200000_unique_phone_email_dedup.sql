-- =====================================================
-- Unicidad de email y teléfono en toda la app.
-- Regla: 1 cuenta por correo, 1 cuenta por celular.
-- Leads que ya son usuarios → auto-descartados.
-- =====================================================

-- 1. Agregar phone a profiles (no existía)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON public.profiles (phone) WHERE phone IS NOT NULL;

-- 2. UNIQUE en service_providers (public_email, public_phone)
-- Primero limpiar duplicados si existen (mantener el más reciente)
DELETE FROM public.service_providers a
USING public.service_providers b
WHERE a.id < b.id
  AND a.public_email IS NOT NULL
  AND a.public_email = b.public_email;

DELETE FROM public.service_providers a
USING public.service_providers b
WHERE a.id < b.id
  AND a.public_phone IS NOT NULL
  AND a.public_phone = b.public_phone;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sp_public_email_unique
  ON public.service_providers (public_email) WHERE public_email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sp_public_phone_unique
  ON public.service_providers (public_phone) WHERE public_phone IS NOT NULL;


-- 3. RPC: verificar si email o phone ya existen (para validación pre-registro)
CREATE OR REPLACE FUNCTION public.check_contact_exists(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_exists BOOLEAN := false;
  v_phone_exists BOOLEAN := false;
  v_email_user_type TEXT := NULL;
  v_phone_user_type TEXT := NULL;
BEGIN
  -- Verificar email en auth.users
  IF p_email IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
      v_email_exists := true;
      -- Determinar tipo
      IF EXISTS (
        SELECT 1 FROM auth.users u
        JOIN service_providers sp ON sp.user_id = u.id
        WHERE u.email = lower(trim(p_email))
      ) THEN
        v_email_user_type := 'provider';
      ELSE
        v_email_user_type := 'owner';
      END IF;
    END IF;
  END IF;

  -- Verificar phone en profiles y service_providers
  IF p_phone IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM profiles WHERE phone = p_phone
      UNION ALL
      SELECT 1 FROM service_providers WHERE public_phone = p_phone
    ) THEN
      v_phone_exists := true;
      IF EXISTS (SELECT 1 FROM service_providers WHERE public_phone = p_phone) THEN
        v_phone_user_type := 'provider';
      ELSE
        v_phone_user_type := 'owner';
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'email_exists', v_email_exists,
    'email_user_type', v_email_user_type,
    'phone_exists', v_phone_exists,
    'phone_user_type', v_phone_user_type
  );
END;
$$;


-- 4. Función para auto-descartar leads que ya son usuarios registrados.
--    Se ejecuta al cargar nuevos leads Y periódicamente.
CREATE OR REPLACE FUNCTION leads.auto_descartar_leads_registrados()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_descartados_email INT := 0;
  v_descartados_phone INT := 0;
BEGIN
  -- Descartar leads cuyo email ya está en auth.users
  UPDATE leads.vet_profesionales lp
  SET
    estado_validacion = 'convertido',
    notas_seguimiento = COALESCE(notas_seguimiento, '') ||
      E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ' auto] Ya tiene cuenta en PawFriend (email match)',
    fecha_actualizacion = now()
  FROM auth.users au
  WHERE lp.email IS NOT NULL
    AND lower(trim(lp.email)) = lower(au.email)
    AND lp.estado_validacion NOT IN ('convertido', 'descartado');
  GET DIAGNOSTICS v_descartados_email = ROW_COUNT;

  -- Descartar leads cuyo teléfono ya está en profiles o service_providers
  UPDATE leads.vet_profesionales lp
  SET
    estado_validacion = 'convertido',
    notas_seguimiento = COALESCE(notas_seguimiento, '') ||
      E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ' auto] Ya tiene cuenta en PawFriend (phone match)',
    fecha_actualizacion = now()
  WHERE lp.telefono IS NOT NULL
    AND lp.estado_validacion NOT IN ('convertido', 'descartado')
    AND (
      EXISTS (SELECT 1 FROM profiles p WHERE p.phone = lp.telefono)
      OR EXISTS (SELECT 1 FROM service_providers sp WHERE sp.public_phone = lp.telefono)
      OR EXISTS (SELECT 1 FROM service_providers sp WHERE sp.public_phone = lp.whatsapp)
    );
  GET DIAGNOSTICS v_descartados_phone = ROW_COUNT;

  -- Lo mismo para clínicas
  UPDATE leads.vet_clinicas lc
  SET
    estado_validacion = 'convertido',
    notas_seguimiento = COALESCE(notas_seguimiento, '') ||
      E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ' auto] Ya tiene cuenta en PawFriend',
    fecha_actualizacion = now()
  FROM auth.users au
  WHERE lc.email IS NOT NULL
    AND lower(trim(lc.email)) = lower(au.email)
    AND lc.estado_validacion NOT IN ('convertido', 'descartado');

  RETURN jsonb_build_object(
    'descartados_email', v_descartados_email,
    'descartados_phone', v_descartados_phone
  );
END;
$$;

-- 5. RPC pública (solo admin) para ejecutar el auto-descarte manualmente
CREATE OR REPLACE FUNCTION public.run_leads_dedup_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN leads.auto_descartar_leads_registrados();
END;
$$;


-- 6. Trigger: cuando se registra un nuevo usuario, auto-descartar sus leads
CREATE OR REPLACE FUNCTION public.on_user_created_dedup_leads()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar leads con el email del nuevo usuario como convertidos
  UPDATE leads.vet_profesionales
  SET
    estado_validacion = 'convertido',
    notas_seguimiento = COALESCE(notas_seguimiento, '') ||
      E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ' auto] Usuario se registró en PawFriend',
    fecha_actualizacion = now()
  WHERE email IS NOT NULL
    AND lower(trim(email)) = lower(NEW.email)
    AND estado_validacion NOT IN ('convertido', 'descartado');

  UPDATE leads.vet_clinicas
  SET
    estado_validacion = 'convertido',
    notas_seguimiento = COALESCE(notas_seguimiento, '') ||
      E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ' auto] Usuario se registró en PawFriend',
    fecha_actualizacion = now()
  WHERE email IS NOT NULL
    AND lower(trim(email)) = lower(NEW.email)
    AND estado_validacion NOT IN ('convertido', 'descartado');

  RETURN NEW;
END;
$$;

-- Trigger en auth.users → cuando alguien se registra, descartar sus leads
DROP TRIGGER IF EXISTS trg_user_created_dedup_leads ON auth.users;
CREATE TRIGGER trg_user_created_dedup_leads
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_user_created_dedup_leads();


COMMENT ON FUNCTION public.check_contact_exists IS 'Verifica si email o phone ya existen en la app. Para validación pre-registro.';
COMMENT ON FUNCTION leads.auto_descartar_leads_registrados IS 'Marca como convertidos los leads que ya tienen cuenta en PawFriend.';
COMMENT ON FUNCTION public.run_leads_dedup_check IS 'Ejecuta chequeo de dedup leads vs usuarios. Solo admin.';
COMMENT ON FUNCTION public.on_user_created_dedup_leads IS 'Trigger: auto-descarta leads cuando un usuario se registra con su email.';
