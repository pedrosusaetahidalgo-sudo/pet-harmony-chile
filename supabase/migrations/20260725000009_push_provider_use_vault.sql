-- ══════════════════════════════════════════════════════════════
-- FIX — notify_provider_push_on_new_booking: leer de Supabase Vault
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS: migración 20260725000007 ya aplicada.
--
-- Contexto:
--   La migración 20260725000007 asumía que `app.settings.service_role_key`
--   estaba seteado via `ALTER DATABASE postgres SET ...`. En Supabase
--   managed eso requiere superuser → falla con 42501 para el rol
--   `postgres` normal.
--
--   La forma oficial en Supabase es Vault (extensión `supabase_vault`
--   viene activa por default). Guardamos el secret ahí y lo leemos
--   desde la función del trigger con permisos SECURITY DEFINER.
--
--   Esta migración:
--     1. Crea helper `public._get_service_role_key()` que lee de Vault.
--     2. Redefine `notify_provider_push_on_new_booking()` para usar el
--        helper en vez de `current_setting(...)`.
--     3. Queda idempotente: CREATE OR REPLACE.
--
-- El secret SE INSERTA APARTE (ver bloque "PASO MANUAL DE PEDRO" al
-- final de esta migración). La migración en sí NO contiene la key.
-- ══════════════════════════════════════════════════════════════

-- Asegurar que Vault está disponible (viene por default en Supabase).
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- ─── Helper que lee el secret de Vault ───
-- SECURITY DEFINER + search_path = vault, public para que la función pueda
-- leer `vault.decrypted_secrets` incluso cuando la invoca un trigger que
-- corre como el rol del caller.
CREATE OR REPLACE FUNCTION public._get_service_role_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = vault, public
AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;
  RETURN v_key;
EXCEPTION WHEN OTHERS THEN
  -- Si Vault no está accesible o no hay secret → devolver null.
  -- El trigger que lo invoque manejará el null.
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._get_service_role_key() FROM public, anon, authenticated;
-- Sólo accesible desde otras funciones SECURITY DEFINER (triggers).
GRANT EXECUTE ON FUNCTION public._get_service_role_key() TO service_role;

COMMENT ON FUNCTION public._get_service_role_key IS
  'Helper interno: retorna el service_role_key desde vault.decrypted_secrets (name=''service_role_key''). Usado por triggers push via pg_net. Devuelve NULL si no está seteado.';

-- ─── Redefinir el trigger push para usar el helper ───
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

  -- Leer secret de Vault. Si falta, abortar push (booking sigue ok).
  v_key := public._get_service_role_key();
  IF v_key IS NULL OR v_key = '' THEN
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
    NULL;  -- fire-and-forget: no rompemos el INSERT
  END;

  RETURN NEW;
END;
$$;

-- El trigger ya está creado (migración 20260725000007), solo redefinimos
-- la función. No tocamos `CREATE TRIGGER` para no duplicarlo.

COMMENT ON FUNCTION public.notify_provider_push_on_new_booking IS
  'Booking V3 CC-27 (fix Vault): envía push FCM al provider cuando llega booking nuevo. Lee service_role_key desde Supabase Vault. Fire-and-forget.';

-- ──────────────────────────────────────────────────────────────
-- PASO MANUAL DE PEDRO (aplicar DESPUÉS de correr esta migración):
--
-- 1. Ir a Supabase Dashboard > Project Settings > API
--    → Copiar el `service_role` key (⚠️ secret, no commitear).
--
-- 2. En el SQL Editor (nueva ventana), ejecutar:
--
--    SELECT vault.create_secret(
--      '<PEGAR_SERVICE_ROLE_KEY_AQUI>',
--      'service_role_key',
--      'Usada por triggers push (notify_provider_push_on_new_booking + notify_booking_status_change)'
--    );
--
-- 3. Verificar:
--
--    SELECT
--      CASE
--        WHEN public._get_service_role_key() IS NULL
--             OR public._get_service_role_key() = ''
--        THEN '❌ Vault secret no legible'
--        ELSE '✓ Vault secret OK (' || LENGTH(public._get_service_role_key()) || ' chars)'
--      END AS status;
--
-- 4. Rotación futura (si la key se compromete):
--
--    -- Borrar el secret viejo
--    DELETE FROM vault.secrets WHERE name = 'service_role_key';
--    -- Insertar el nuevo (paso 2 con la key nueva)
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public._get_service_role_key();
--   -- + restaurar la versión previa de notify_provider_push_on_new_booking
--     desde la migración 20260725000007.
-- ──────────────────────────────────────────────────────────────
