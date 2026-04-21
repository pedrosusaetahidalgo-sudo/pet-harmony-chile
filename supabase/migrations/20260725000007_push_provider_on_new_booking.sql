-- ══════════════════════════════════════════════════════════════
-- CC-27 — Push FCM al provider cuando llega nueva reserva
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS:
--   - pg_net extension (ya activa por migración 20260701000000)
--   - app.settings.service_role_key configurado
--   - Edge fn send-push-notification desplegada
--   - FCM tokens persistidos en device_tokens
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §18 + Fase 4 CC-27):
--   El trigger `notify_on_directory_booking` (migración 20260520) ya
--   inserta notificación in-app al provider cuando llega booking nuevo.
--   Pero el provider NO recibe push FCM → tiene que entrar al dashboard
--   para enterarse. Fricción operativa alta (F-P4 en el master plan).
--
--   Este trigger agrega push real-time sin tocar el trigger existente
--   (inserta en paralelo). Pattern idéntico a migración 20260701000000
--   (notify_booking_status_change).
--
-- Idempotente: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.
-- Fire-and-forget: si pg_net falla, el INSERT de vet_bookings sigue OK.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_provider_push_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_user_id UUID;
  v_pet_name TEXT;
  v_owner_name TEXT;
  v_scheduled TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Solo para bookings desde el directorio (service_provider_id presente).
  IF NEW.service_provider_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolver user_id del provider.
  SELECT user_id INTO v_provider_user_id
  FROM service_providers
  WHERE id = NEW.service_provider_id;

  IF v_provider_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Contexto para el push.
  SELECT name INTO v_pet_name FROM pets WHERE id = NEW.pet_id;
  SELECT COALESCE(display_name, 'un dueño') INTO v_owner_name
    FROM profiles WHERE id = NEW.owner_id;
  v_scheduled := to_char(
    NEW.scheduled_date AT TIME ZONE 'America/Santiago',
    'DD "de" FMMonth "a las" HH24:MI'
  );

  IF NEW.is_emergency THEN
    v_title := '⚡ Solicitud de urgencia';
    v_body := v_owner_name || ' pide atención urgente para '
              || COALESCE(v_pet_name, 'una mascota')
              || ' — ' || v_scheduled || '.';
  ELSIF NEW.confirmation_mode = 'manual' OR NEW.status = 'pendiente' THEN
    v_title := 'Nueva solicitud de cita';
    v_body := v_owner_name || ' quiere agendar con '
              || COALESCE(v_pet_name, 'su mascota')
              || ' el ' || v_scheduled || '. Revisa para confirmar.';
  ELSE
    v_title := 'Nueva cita agendada';
    v_body := v_owner_name || ' reservó hora para '
              || COALESCE(v_pet_name, 'su mascota')
              || ' el ' || v_scheduled || '.';
  END IF;

  -- Fire-and-forget. Si pg_net falla o la edge fn no responde, no
  -- queremos romper el INSERT original.
  BEGIN
    PERFORM net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'user_ids', jsonb_build_array(v_provider_user_id::text),
        'title', v_title,
        'body', v_body,
        'data', jsonb_build_object(
          'route', '/provider/dashboard?tab=reservas',
          'booking_id', NEW.id::text,
          'booking_type', 'vet',
          'is_emergency', NEW.is_emergency,
          'event', 'booking.new'
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log en audit_log si existe; si no, ignorar silenciosamente.
    -- El trigger notify_on_directory_booking sigue creando la notif in-app.
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_provider_on_new_booking ON vet_bookings;
CREATE TRIGGER push_provider_on_new_booking
  AFTER INSERT ON vet_bookings
  FOR EACH ROW
  WHEN (NEW.service_provider_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_provider_push_on_new_booking();

COMMENT ON FUNCTION public.notify_provider_push_on_new_booking IS
  'Booking V3 CC-27: envía push FCM al provider cuando llega booking nuevo desde el directorio. Complementa el trigger notify_on_directory_booking (in-app). Fire-and-forget via pg_net.';

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--   INSERT INTO vet_bookings (owner_id, service_provider_id, pet_id, ...)
--   VALUES (...) → provider recibe push en 1-2 segundos.
--
--   Revisar logs edge fn: Supabase Dashboard > Functions > send-push-notification
--
-- Rollback:
--   DROP TRIGGER IF EXISTS push_provider_on_new_booking ON vet_bookings;
--   DROP FUNCTION IF EXISTS public.notify_provider_push_on_new_booking();
-- ──────────────────────────────────────────────────────────────
