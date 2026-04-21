-- ==========================================================================
-- Drip email nueva mascota: D0 trigger + D3/D7 cron
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- Al crear mascota, enviar email onboarding en 3 stages:
--   - D0: bienvenida inmediata (trigger AFTER INSERT).
--   - D3: tip subir carnet vacunas (cron diario busca pets created hace 3d).
--   - D7: tip descargar PDF joya de la corona (cron diario busca pets 7d).
--
-- REQUISITO: edge fn send-new-pet-drip deployada + RESEND_API_KEY +
-- app.settings.service_role_key.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------
-- 1. Trigger D0: dispara email welcome inmediato al crear mascota
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_pet_drip_d0()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo disparar si owner_id existe (evita mascotas pending_owner)
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.lifecycle_status IS DISTINCT FROM 'active' THEN RETURN NEW; END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-new-pet-drip',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('pet_id', NEW.id::text, 'stage', 0)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_new_pet_drip_d0() IS
  'Dispara email D0 drip cuando se crea mascota con owner. Fire-and-forget.';

DROP TRIGGER IF EXISTS trigger_new_pet_drip_d0 ON public.pets;
CREATE TRIGGER trigger_new_pet_drip_d0
  AFTER INSERT ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_pet_drip_d0();

-- ----------------------------------------------------------------------
-- 2. Cron D3+D7: busca pets creadas hace 3 y 7 días
-- ----------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('new-pet-drip-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'new-pet-drip-daily',
  '0 15 * * *',  -- Diario 15:00 UTC = 12:00 Chile
  $$
  SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-new-pet-drip',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

-- Verificacion post-apply:
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'new-pet-drip-daily';
-- Trigger D0: crear mascota de prueba via /add-pet → email llega en 1 min.
-- D3/D7: esperar 3 y 7 días respectivamente (o cambiar pets.created_at manualmente para test).
