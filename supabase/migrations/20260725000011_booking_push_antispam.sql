-- ══════════════════════════════════════════════════════════════
-- ANTI-SPAM — booking push triggers respetan prefs + dedup
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS:
--   - 20260725000007 (notify_provider_push_on_new_booking)
--   - 20260725000009 (_get_service_role_key helper)
--   - 20260725000010 (notify_booking_status_change Vault)
--   - 20260723000000 (user_notification_prefs + user_can_receive_notification)
--   - 20260612000001 (notification_attempts con UNIQUE index idempotencia)
--
-- Contexto:
--   Los 2 triggers push de booking empezaron a funcionar tras configurar
--   Vault. Auditoría encontró 2 riesgos de spam:
--
--   R1: Ninguno chequea `user_notification_prefs.transactional_push`.
--       Si el user opt-out de push → igual recibía.
--
--   R2: Ninguno deduplica. Si un UPDATE se dispara 2× por bug/race
--       (ej. admin re-setea status, retry cliente sin dedup), el user
--       recibía 2 pushes iguales.
--
--   Esta migración:
--     - Chequea `user_can_receive_notification(user_id, 'transactional', 'push')`
--       antes de hacer http_post.
--     - Registra en `notification_attempts` (UNIQUE idx la tiene) — si
--       la fila ya existe con status='sent', skippea.
--
--   Resultado: máximo 1 push por (booking_id, event, user) aunque el
--   trigger se dispare múltiples veces.
--
-- Idempotente: CREATE OR REPLACE de ambas funciones.
-- ══════════════════════════════════════════════════════════════

-- ─── Trigger #1: push al PROVIDER on new booking ───
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
  v_key TEXT;
  v_can_receive BOOLEAN;
  v_reminder_type TEXT;
  v_attempt_id UUID;
BEGIN
  IF NEW.service_provider_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_provider_user_id
  FROM service_providers
  WHERE id = NEW.service_provider_id;

  IF v_provider_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- R1 FIX: respetar user prefs antes de siquiera pensar en disparar.
  -- Función existente (mig 20260723000000). Si el user no tiene row,
  -- devuelve TRUE (default permisivo para transactional).
  SELECT public.user_can_receive_notification(v_provider_user_id, 'transactional', 'push')
    INTO v_can_receive;
  IF NOT COALESCE(v_can_receive, TRUE) THEN
    RETURN NEW;
  END IF;

  -- R2 FIX: idempotencia via notification_attempts.
  -- El UNIQUE index (booking_type, booking_id, reminder_type, channel)
  -- WHERE status IN ('sent','delivered','read') impide duplicar.
  -- Intentamos INSERT con status='sent' primero; si ya existe, skip.
  v_reminder_type := 'booking_new_to_provider';
  BEGIN
    INSERT INTO notification_attempts (
      booking_type, booking_id, reminder_type, channel,
      recipient_id, status, metadata
    ) VALUES (
      'vet', NEW.id, v_reminder_type, 'push',
      v_provider_user_id, 'sent',
      jsonb_build_object('event', 'booking.new', 'trigger', 'notify_provider_push_on_new_booking')
    )
    RETURNING id INTO v_attempt_id;
  EXCEPTION WHEN unique_violation THEN
    -- Ya se envió antes → no re-disparamos.
    RETURN NEW;
  END;

  -- Leer secret Vault. Si falta, marcar el attempt como failed (para
  -- no quedar con 'sent' mentiroso) y salir.
  v_key := public._get_service_role_key();
  IF v_key IS NULL OR v_key = '' THEN
    UPDATE notification_attempts
    SET status = 'failed', error_message = 'service_role_key not in Vault'
    WHERE id = v_attempt_id;
    RETURN NEW;
  END IF;

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

  BEGIN
    PERFORM net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
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
    -- Marcar el attempt como failed si pg_net falla sync (raro).
    UPDATE notification_attempts
    SET status = 'failed', error_message = SQLERRM
    WHERE id = v_attempt_id;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_provider_push_on_new_booking IS
  'Booking V3 CC-27 + anti-spam (2026-07-25): chequea user_notification_prefs + dedup via notification_attempts UNIQUE index antes de disparar push al provider.';

-- ─── Trigger #2: push al OWNER on status change ───
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
  v_key TEXT;
  v_reminder_type TEXT;
  v_event TEXT;
  v_can_receive BOOLEAN;
  v_attempt_id UUID;
BEGIN
  IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;

  -- Determinar caso + reminder_type para dedup.
  IF OLD.status IS DISTINCT FROM 'confirmado' AND NEW.status = 'confirmado' THEN
    v_reminder_type := 'booking_confirmed_to_owner';
    v_event := 'booking.confirmed';
    SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
    SELECT COALESCE(display_name, 'tu veterinario') INTO v_vet_name
      FROM public.profiles WHERE id = NEW.vet_id;
    v_scheduled := to_char(NEW.scheduled_date AT TIME ZONE 'America/Santiago',
                           'DD "de" FMMonth "a las" HH24:MI');
    v_title := 'Cita confirmada';
    v_body := v_vet_name || ' confirmo tu cita para ' || COALESCE(v_pet_name, 'tu mascota')
              || ' el ' || v_scheduled || '.';
    v_route := '/mis-reservas';

  ELSIF OLD.status IN ('pendiente', 'confirmado') AND NEW.status = 'cancelado' THEN
    IF NEW.canceled_by IS NULL OR NEW.canceled_by = NEW.owner_id THEN
      RETURN NEW;  -- solo notificamos si el vet cancela
    END IF;
    v_reminder_type := 'booking_cancelled_to_owner';
    v_event := 'booking.cancelled_by_provider';
    SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
    v_title := 'Cita cancelada';
    v_body := 'El veterinario cancelo la cita de '
              || COALESCE(v_pet_name, 'tu mascota')
              || '. Agenda otra desde Paw Friend.';
    v_route := '/veterinarios';

  ELSE
    RETURN NEW;
  END IF;

  -- R1 FIX: respetar prefs del owner.
  SELECT public.user_can_receive_notification(NEW.owner_id, 'transactional', 'push')
    INTO v_can_receive;
  IF NOT COALESCE(v_can_receive, TRUE) THEN
    RETURN NEW;
  END IF;

  -- R2 FIX: dedup via notification_attempts UNIQUE index.
  BEGIN
    INSERT INTO notification_attempts (
      booking_type, booking_id, reminder_type, channel,
      recipient_id, status, metadata
    ) VALUES (
      'vet', NEW.id, v_reminder_type, 'push',
      NEW.owner_id, 'sent',
      jsonb_build_object('event', v_event, 'trigger', 'notify_booking_status_change')
    )
    RETURNING id INTO v_attempt_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN NEW;  -- ya se envió antes
  END;

  v_key := public._get_service_role_key();
  IF v_key IS NULL OR v_key = '' THEN
    UPDATE notification_attempts
    SET status = 'failed', error_message = 'service_role_key not in Vault'
    WHERE id = v_attempt_id;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := jsonb_build_object(
        'user_ids', jsonb_build_array(NEW.owner_id::text),
        'title', v_title,
        'body', v_body,
        'data', jsonb_build_object(
          'route', v_route,
          'booking_id', NEW.id::text,
          'booking_type', 'vet',
          'event', v_event
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    UPDATE notification_attempts
    SET status = 'failed', error_message = SQLERRM
    WHERE id = v_attempt_id;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_booking_status_change IS
  'Booking V3 (2026-07-25 anti-spam): push al owner on confirmed/cancelled con chequeo prefs + dedup notification_attempts.';

-- ──────────────────────────────────────────────────────────────
-- Verificación + smoke test:
--
-- 1. Ambas funciones apuntan a la versión con user_can_receive_notification:
--
--    SELECT pg_get_functiondef(oid)
--    FROM pg_proc
--    WHERE proname IN ('notify_provider_push_on_new_booking',
--                      'notify_booking_status_change')
--    ORDER BY proname;
--    -- Debe contener `user_can_receive_notification` y `notification_attempts`.
--
-- 2. Dedup funciona (simular doble UPDATE):
--
--    -- (tomar un booking pendiente real)
--    UPDATE vet_bookings SET status='confirmado' WHERE id='...' AND status='pendiente';
--    UPDATE vet_bookings SET status='pendiente'  WHERE id='...';
--    UPDATE vet_bookings SET status='confirmado' WHERE id='...';
--    -- → en notification_attempts debe haber 1 sola fila con
--    --   reminder_type='booking_confirmed_to_owner'.
--
-- 3. User opt-out respetado:
--
--    INSERT INTO user_notification_prefs (user_id, transactional_push)
--    VALUES ('<user_id>', false) ON CONFLICT (user_id)
--    DO UPDATE SET transactional_push = false;
--    -- → próximos pushes para ese user se skipean silenciosamente.
--
-- 4. Ver intentos recientes (últimos 20):
--
--    SELECT booking_id, reminder_type, channel, status, error_message, attempted_at
--    FROM notification_attempts
--    ORDER BY attempted_at DESC
--    LIMIT 20;
--
-- Rollback:
--   -- Restaurar desde 20260725000009 y 20260725000010 (versiones sin
--   -- user_can_receive_notification ni notification_attempts).
-- ──────────────────────────────────────────────────────────────
