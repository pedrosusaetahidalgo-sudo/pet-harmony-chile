-- ══════════════════════════════════════════════════════════════
-- FIX — notify_booking_status_change: leer secret desde Vault
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS:
--   - 20260701000000 ya aplicada (trigger existente)
--   - 20260725000009 ya aplicada (helper public._get_service_role_key)
--
-- Contexto:
--   La migración 20260701 (push al owner cuando vet confirma/cancela)
--   usa `current_setting('app.settings.service_role_key', true)`. En
--   Supabase managed ese setting nunca se pudo configurar (ALTER
--   DATABASE requiere superuser → 42501).
--
--   Resultado: desde 2026-07 el trigger intenta hacer http_post con
--   Authorization: Bearer '' → la edge fn send-push-notification
--   devuelve 401 → el catch silencioso (EXCEPTION WHEN OTHERS) come
--   el error → booking se confirma/cancela pero el dueño nunca recibe
--   push de que su cita fue confirmada/cancelada.
--
--   Este fix redefine SOLO la función, reutilizando el helper Vault
--   de la migración 20260725000009. El trigger sigue igual (mismo
--   nombre, mismo hook).
--
-- Idempotente: CREATE OR REPLACE.
-- ══════════════════════════════════════════════════════════════

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
BEGIN
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

  -- FIX: leer secret desde Vault (antes: current_setting que fallaba).
  v_key := public._get_service_role_key();
  IF v_key IS NULL OR v_key = '' THEN
    RETURN NEW;  -- sin secret, skipeamos push pero preservamos el UPDATE
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
          'event',
            CASE
              WHEN NEW.status = 'confirmado' THEN 'booking.confirmed'
              ELSE 'booking.cancelled_by_provider'
            END
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;  -- fire-and-forget, no romper el UPDATE
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_booking_status_change IS
  'Booking V3 FIX Vault (2026-07-25): push al owner cuando vet confirma/cancela cita. Lee service_role_key desde Vault via public._get_service_role_key(). Fire-and-forget.';

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   -- Trigger sigue existiendo (no lo tocamos, solo redefinimos la función):
--   SELECT tgname, tgenabled FROM pg_trigger
--   WHERE tgname = 'trg_booking_status_push';   -- o el nombre real
--
--   -- La función apunta a la versión Vault:
--   SELECT pg_get_functiondef(oid)
--   FROM pg_proc WHERE proname = 'notify_booking_status_change';
--   -- Debe contener `public._get_service_role_key()` y NO `current_setting`.
--
--   -- Smoke test real: confirmar/cancelar un booking de prueba y ver
--   -- en Dashboard > Functions > send-push-notification > Invocations
--   -- que llegó la invocación.
--
-- Rollback:
--   -- Restaurar la versión previa desde la migración 20260701000000.
-- ──────────────────────────────────────────────────────────────
