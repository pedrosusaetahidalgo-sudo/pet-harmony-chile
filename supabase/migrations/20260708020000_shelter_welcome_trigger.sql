-- ==========================================================================
-- Trigger: email welcome al registrarse un refugio
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- Cuando un refugio se registra (INSERT en adoption_centers), queremos
-- enviarle inmediatamente un email de bienvenida con onboarding 4 pasos
-- + link directo al dashboard.
--
-- Idempotencia: AFTER INSERT (solo al crear, no al update).
--
-- REQUISITO: edge fn send-shelter-welcome deployada + RESEND_API_KEY +
-- app.settings.service_role_key.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_shelter_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Fire-and-forget: si falla la edge fn, no rompemos el INSERT
  BEGIN
    PERFORM net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-shelter-welcome',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('adoption_center_id', NEW.id::text)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_shelter_welcome() IS
  'Envía email welcome al crear adoption_center. Fire-and-forget vía send-shelter-welcome.';

DROP TRIGGER IF EXISTS trigger_notify_shelter_welcome ON public.adoption_centers;
CREATE TRIGGER trigger_notify_shelter_welcome
  AFTER INSERT ON public.adoption_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_shelter_welcome();

-- Verificacion post-apply:
-- INSERT de prueba que luego se puede rollback:
--   Crear un refugio desde UI BecomeShelterDialog y verificar que llegue email.
