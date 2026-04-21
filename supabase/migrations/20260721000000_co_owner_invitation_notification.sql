-- ══════════════════════════════════════════════════════════════
-- Notificacion in-app cuando el user recibe invitacion de co-ownership
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-21): feature "compartir mascota con otra persona"
-- en AddPet.tsx. Al INSERT en pet_co_owners con user_id asignado
-- (email que YA tiene cuenta), el owner de la mascota necesita que le
-- aparezca una noti in-app al invitado con "X te invito a compartir su
-- mascota Y. Aceptar / Rechazar".
--
-- El INSERT lo hace el user original (dueno de la pet), pero la
-- notificacion es para el invitado. La policy de notifications solo
-- permite user_id = auth.uid() para INSERT, asi que no podemos
-- insertar desde el cliente. Lo hacemos via trigger SECURITY DEFINER.
--
-- Si el row no tiene user_id (invited_email pero cuenta inexistente),
-- el trigger no hace nada — la UI muestra link copiable que, al
-- abrirse post-registro, corre el hook de auto-accept.
--
-- Idempotente: DROP + CREATE TRIGGER.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_co_owner_on_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_name TEXT;
  v_inviter_name TEXT;
  v_role_label TEXT;
BEGIN
  -- Solo notificar en INSERT con user_id asignado + status pending
  IF NEW.user_id IS NULL OR NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Evitar auto-notificar (user se invita a si mismo)
  IF NEW.user_id = NEW.invited_by THEN
    RETURN NEW;
  END IF;

  -- Datos de la mascota
  SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
  IF v_pet_name IS NULL THEN
    v_pet_name := 'una mascota';
  END IF;

  -- Nombre del que invita
  SELECT COALESCE(display_name, 'Alguien') INTO v_inviter_name
    FROM public.profiles WHERE id = NEW.invited_by;
  IF v_inviter_name IS NULL THEN
    v_inviter_name := 'Alguien';
  END IF;

  -- Label del rol
  v_role_label := CASE NEW.role
    WHEN 'co_owner' THEN 'co-dueno/a'
    WHEN 'caretaker' THEN 'cuidador/a'
    WHEN 'trainer' THEN 'entrenador/a'
    WHEN 'family_member' THEN 'familiar'
    ELSE 'co-dueno/a'
  END;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    action_url,
    reference_id
  )
  VALUES (
    NEW.user_id,
    'co_owner_invite',
    format('%s te invito a compartir %s', v_inviter_name, v_pet_name),
    format('Podras ver la ficha clinica como %s. Toca para aceptar o rechazar.', v_role_label),
    '/?co_owner=' || NEW.invitation_token::text,
    NEW.id
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_co_owner_on_invite() IS
  'Trigger: cuando se crea una invitacion de co-owner con user_id asignado, dispara noti in-app al invitado.';

DROP TRIGGER IF EXISTS trg_notify_co_owner_on_invite ON public.pet_co_owners;

CREATE TRIGGER trg_notify_co_owner_on_invite
  AFTER INSERT ON public.pet_co_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_co_owner_on_invite();

-- ──────────────────────────────────────────────────────────────
-- Verificacion:
--
--   -- El trigger existe
--   SELECT tgname FROM pg_trigger
--     WHERE tgrelid = 'public.pet_co_owners'::regclass
--       AND tgname = 'trg_notify_co_owner_on_invite';
--
--   -- Smoke test (reemplaza los UUIDs):
--   INSERT INTO pet_co_owners (pet_id, user_id, role, permissions, invited_by, invited_email, status)
--     VALUES (
--       '<pet-id-propia>',
--       '<user-id-invitado>',
--       'co_owner',
--       ARRAY['view_record', 'add_records', 'edit_pet'],
--       auth.uid(),
--       'invitado@example.cl',
--       'pending'
--     );
--
--   -- El invitado debe tener una noti nueva:
--   SELECT * FROM notifications
--     WHERE user_id = '<user-id-invitado>' AND type = 'co_owner_invite'
--     ORDER BY created_at DESC LIMIT 1;
-- ──────────────────────────────────────────────────────────────
