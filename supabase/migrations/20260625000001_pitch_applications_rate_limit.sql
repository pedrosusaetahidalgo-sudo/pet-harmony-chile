-- ==========================================================================
-- Pitch Applications — Rate limit anti-spam
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Problema: el INSERT publico en pitch_applications permite a cualquier
-- anon crear aplicaciones sin limite. Un bot podria inundar la tabla y
-- generar emails basura via notify-pitch-application.
--
-- Solucion: trigger BEFORE INSERT que rechaza si:
--   a) Mismo email ya tiene >= 3 aplicaciones submitted en las ultimas 24h.
--   b) Mismo kind+email ya tiene una aplicacion submitted en las ultimas 24h
--      (evita doble-click accidental y spam del mismo formulario).
--
-- Admin puede seguir insertando via service_role (bypassa RLS y triggers
-- con SECURITY DEFINER si alguna vez se necesita).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.pitch_applications_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_same_email_count INT;
  v_same_kind_count INT;
  v_one_day_ago TIMESTAMPTZ := now() - INTERVAL '24 hours';
BEGIN
  -- Admin bypass: si quien inserta es admin, no aplicamos limite.
  IF auth.uid() IS NOT NULL AND public.is_active_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Regla 1: mismo email >= 3 aplicaciones submitted en 24h.
  SELECT COUNT(*) INTO v_same_email_count
  FROM public.pitch_applications
  WHERE lower(contact_email) = lower(NEW.contact_email)
    AND status = 'submitted'
    AND created_at >= v_one_day_ago;

  IF v_same_email_count >= 3 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: demasiadas postulaciones desde este email en 24h'
      USING ERRCODE = '23514', -- check_violation: mapea a 400 en PostgREST
            HINT = 'Espera 24 horas o contactanos directo a pawfriendcl@gmail.com';
  END IF;

  -- Regla 2: mismo kind+email en las ultimas 24h (evita duplicados accidentales).
  SELECT COUNT(*) INTO v_same_kind_count
  FROM public.pitch_applications
  WHERE lower(contact_email) = lower(NEW.contact_email)
    AND kind = NEW.kind
    AND status = 'submitted'
    AND created_at >= v_one_day_ago;

  IF v_same_kind_count >= 1 THEN
    RAISE EXCEPTION 'duplicate_application: ya tienes una postulacion activa de este tipo'
      USING ERRCODE = '23514',
            HINT = 'Revisa tu email, o espera 24 horas antes de reenviar';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pitch_applications_rate_limit_trg ON public.pitch_applications;
CREATE TRIGGER pitch_applications_rate_limit_trg
  BEFORE INSERT ON public.pitch_applications
  FOR EACH ROW EXECUTE FUNCTION public.pitch_applications_rate_limit();

COMMENT ON FUNCTION public.pitch_applications_rate_limit() IS
  'Anti-spam: maximo 3 postulaciones/email/24h + no duplicar kind+email en 24h. Admin bypass.';
