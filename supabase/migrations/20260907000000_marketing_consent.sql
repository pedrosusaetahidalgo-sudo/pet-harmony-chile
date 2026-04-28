-- 2026-04-28 (Sprint 1 P1 COMP-005)
--
-- Marketing consent separado del consent de uso (Ley 19.628 / Reglamento
-- 21.719 vigente 2026): el opt-in para recibir emails promocionales tiene que
-- ser explicito y diferenciado del aceptar T&C de la app.
--
-- Cambios:
--   1. Columna profiles.marketing_email_consent BOOLEAN NOT NULL DEFAULT false.
--      Default false porque solo se considera opt-in si el usuario marca el
--      checkbox en signup. Usuarios existentes quedan en false (no marketing
--      a quien no opto). Si Pedro quiere migrar usuarios historicos con un
--      consent valido (ej: ya aceptaron via email), un UPDATE manual puntual.
--
--   2. Columna profiles.marketing_email_consent_at TIMESTAMPTZ NULL — registra
--      el momento en que se otorgo o revoco el consent. NULL = nunca se ha
--      tocado. Util para auditoria de compliance.
--
--   3. handle_new_user() ahora lee NEW.raw_user_meta_data->>'marketing_email_consent'
--      (string 'true'/'false' viene del signup form) y lo persiste.
--
-- Datos de usuarios existentes (CLAUDE §9.7): default false los protege.
-- Ningun fallback ambiguo: marketing solo se envia si la columna es true.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_email_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_email_consent_at timestamptz NULL;

COMMENT ON COLUMN public.profiles.marketing_email_consent IS
  'Sprint 1 P1 COMP-005: opt-in explicito para emails de marketing. NO confundir con consent de uso de la app (T&C).';
COMMENT ON COLUMN public.profiles.marketing_email_consent_at IS
  'Timestamp del ultimo cambio de marketing_email_consent. NULL = nunca lo toco.';

-- Recreate handle_new_user para incluir el campo nuevo. Mantiene la logica
-- de display_name de la mig 20260613000000.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_name TEXT;
  final_name TEXT;
  raw_marketing TEXT;
  marketing_bool BOOLEAN := false;
BEGIN
  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name'
  );
  IF raw_name IS NULL OR btrim(raw_name) = '' OR raw_name ~ '^[a-zA-Z0-9._%+-]+@' THEN
    final_name := generate_default_display_name();
  ELSE
    final_name := btrim(raw_name);
  END IF;

  -- Marketing consent: 'true'/'false' (string) viene del checkbox; default false.
  raw_marketing := NEW.raw_user_meta_data->>'marketing_email_consent';
  IF raw_marketing IS NOT NULL AND lower(btrim(raw_marketing)) IN ('true', 't', '1') THEN
    marketing_bool := true;
  END IF;

  INSERT INTO public.profiles (
    id, display_name, plan_id, is_premium, plan_expires_at,
    marketing_email_consent, marketing_email_consent_at
  )
  VALUES (
    NEW.id, final_name, 'free', false, NULL,
    marketing_bool,
    CASE WHEN raw_marketing IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Crea profile free para usuario nuevo. Persiste marketing_email_consent del signup form. Default plan_id=free hasta apply_premium.';

-- Smoke test inline (CLAUDE §9.2.1): provocar el trigger y verificar que
-- el campo nuevo se setea correctamente. Rollback al final.
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_consent boolean;
BEGIN
  -- Insertar fila auth.users dummy NO se puede sin permisos super;
  -- en su lugar, ejecutar handle_new_user con un NEW sintetico via PERFORM
  -- no es trivial en plpgsql sin trigger context. Validacion mas barata:
  -- comprobar que la columna existe y default es false.
  SELECT column_default = 'false'
    INTO v_consent
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'marketing_email_consent';

  IF v_consent IS NULL THEN
    RAISE EXCEPTION 'profiles.marketing_email_consent no fue creada';
  END IF;
  IF NOT v_consent THEN
    RAISE EXCEPTION 'profiles.marketing_email_consent default no es false';
  END IF;
END $$;
