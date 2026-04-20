-- ==========================================================================
-- Triggers push: booking confirmada / cancelada por vet
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d INIT-16 primer caller real):
-- La edge fn send-push-notification ya existe y los dispositivos persisten
-- sus tokens en device_tokens. Este trigger cierra el loop: cuando el vet
-- confirma/cancela una cita, el dueño recibe push al instante.
--
-- REQUISITO: setting `app.settings.service_role_key` configurado + secret
-- FCM_SERVER_KEY + edge fn send-push-notification deployada.
-- Ver docs-raiz/operacion/PUSH_NOTIFICATIONS_SETUP.md.
--
-- Idempotencia: el trigger dispara solo en la transicion
-- OLD.status != 'confirmado' AND NEW.status = 'confirmado' (y analogamente
-- para 'cancelado'). Update a mismo status no re-dispara.
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------
-- Funcion: invocar send-push-notification via pg_net
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_name TEXT;
  v_vet_name TEXT;
  v_scheduled TEXT;
  v_title TEXT;
  v_body TEXT;
  v_route TEXT;
BEGIN
  -- Solo procesar transiciones relevantes
  IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;

  -- Caso 1: pendiente → confirmado
  IF OLD.status IS DISTINCT FROM 'confirmado' AND NEW.status = 'confirmado' THEN
    SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
    SELECT COALESCE(display_name, 'tu veterinario') INTO v_vet_name
      FROM public.profiles WHERE id = NEW.vet_id;
    v_scheduled := to_char(NEW.scheduled_date AT TIME ZONE 'America/Santiago',
                           'DD "de" FMMonth "a las" HH24:MI');
    v_title := 'Cita confirmada';
    v_body := v_vet_name || ' confirmo tu cita para ' || COALESCE(v_pet_name, 'tu mascota')
              || ' el ' || v_scheduled || '.';
    v_route := '/mis-reservas';

  -- Caso 2: (pendiente|confirmado) → cancelado
  ELSIF OLD.status IN ('pendiente', 'confirmado') AND NEW.status = 'cancelado' THEN
    -- Solo notificar al dueño si fue el vet quien cancelo
    IF NEW.canceled_by IS NULL OR NEW.canceled_by = NEW.owner_id THEN
      RETURN NEW;
    END IF;
    SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
    v_title := 'Cita cancelada';
    v_body := 'El veterinario cancelo la cita de '
              || COALESCE(v_pet_name, 'tu mascota')
              || '. Agenda otra desde Paw Friend.';
    v_route := '/veterinarios';

  ELSE
    RETURN NEW;
  END IF;

  -- Disparar edge fn (fire-and-forget). Si falla, no rompemos el UPDATE.
  BEGIN
    PERFORM net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_ids', jsonb_build_array(NEW.owner_id::text),
        'title', v_title,
        'body', v_body,
        'data', jsonb_build_object(
          'route', v_route,
          'booking_id', NEW.id::text,
          'kind', 'booking_status'
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silencioso: el push es best-effort
    NULL;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_booking_status_change() IS
  'Dispara send-push-notification cuando booking pasa a confirmado o es cancelado por el vet. Idempotente: solo en transicion. Fire-and-forget.';

-- ----------------------------------------------------------------------
-- Trigger en vet_bookings
-- ----------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_notify_booking_status ON public.vet_bookings;
CREATE TRIGGER trigger_notify_booking_status
  AFTER UPDATE OF status ON public.vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();

-- ----------------------------------------------------------------------
-- (Opcional) Extender a walk_bookings y training_bookings si estan en uso
-- ----------------------------------------------------------------------
-- Descomentar si se usa. Hoy: comentado para no crear triggers que
-- disparen con tablas que aun no se usan en produccion.
--
-- DROP TRIGGER IF EXISTS trigger_notify_walk_booking_status ON public.walk_bookings;
-- CREATE TRIGGER trigger_notify_walk_booking_status
--   AFTER UPDATE OF status ON public.walk_bookings
--   FOR EACH ROW
--   EXECUTE FUNCTION public.notify_booking_status_change();

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- 1. Cambiar status de una booking de prueba:
--    UPDATE vet_bookings SET status = 'confirmado', canceled_by = null
--      WHERE id = '<id>' AND status = 'pendiente';
-- 2. Ver en cron.job_run_details o directamente en device del user
--    que llego el push.
-- 3. Si no llega, verificar:
--    - Device token esta en device_tokens con enabled=true.
--    - FCM_SERVER_KEY secret esta configurado.
--    - Edge fn send-push-notification esta deployada.
-- ----------------------------------------------------------------------
