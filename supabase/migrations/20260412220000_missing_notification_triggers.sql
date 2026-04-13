-- ============================================================
-- Triggers de notificación faltantes
-- 2026-04-12
-- NO aplicar automaticamente. El dueno aplica manualmente desde Supabase Dashboard > SQL Editor.
-- ============================================================

-- ============================================================
-- 1. Notificar al dueño del post de adopción cuando alguien muestra interés
-- ============================================================

CREATE OR REPLACE FUNCTION notify_adoption_interest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_owner_id uuid;
  v_pet_name text;
  v_interested_name text;
BEGIN
  -- Obtener el dueño del post de adopción
  SELECT user_id INTO v_post_owner_id
  FROM adoption_posts
  WHERE id = NEW.adoption_post_id;

  IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.interested_user_id THEN
    RETURN NEW;
  END IF;

  -- Nombre de la mascota del post
  SELECT p.name INTO v_pet_name
  FROM adoption_posts ap
  JOIN pets p ON p.id = ap.pet_id
  WHERE ap.id = NEW.adoption_post_id;

  -- Nombre del interesado
  SELECT display_name INTO v_interested_name
  FROM profiles
  WHERE id = NEW.interested_user_id;

  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  VALUES (
    v_post_owner_id,
    'adoption_interest',
    '¡Alguien quiere adoptar!',
    COALESCE(v_interested_name, 'Un usuario') || ' mostró interés en adoptar a ' || COALESCE(v_pet_name, 'tu mascota') || '.',
    '/adoption',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_adoption_interest ON adoption_interests;
CREATE TRIGGER notify_on_adoption_interest
  AFTER INSERT ON adoption_interests
  FOR EACH ROW
  EXECUTE FUNCTION notify_adoption_interest();


-- ============================================================
-- 2. Notificar cuando alguien te sigue
-- ============================================================

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_follower_name text;
BEGIN
  -- No notificar si te sigues a ti mismo (edge case)
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_follower_name
  FROM profiles
  WHERE id = NEW.follower_id;

  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  VALUES (
    NEW.following_id,
    'new_follower',
    'Nuevo seguidor',
    COALESCE(v_follower_name, 'Alguien') || ' comenzó a seguirte.',
    '/user/' || NEW.follower_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_new_follower ON user_follows;
CREATE TRIGGER notify_on_new_follower
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();


-- ============================================================
-- 3. Notificar cuando recibes un mensaje nuevo
-- ============================================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_id uuid;
  v_sender_name text;
BEGIN
  -- Determinar el destinatario (el otro participante de la conversación)
  SELECT
    CASE
      WHEN c.participant1_id = NEW.sender_id THEN c.participant2_id
      ELSE c.participant1_id
    END INTO v_recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_recipient_id IS NULL OR v_recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
  VALUES (
    v_recipient_id,
    'new_message',
    'Nuevo mensaje',
    COALESCE(v_sender_name, 'Alguien') || ': ' || LEFT(NEW.content, 80),
    '/chat/' || NEW.conversation_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_new_message ON messages;
CREATE TRIGGER notify_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
