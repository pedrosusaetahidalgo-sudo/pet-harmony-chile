-- ============================================================
-- Fix: notify_adoption_interest JOIN invalido
-- 2026-05-21 (plan PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN Fase 0)
--
-- Problema: el trigger original (mig 20260412220000) hace
--   JOIN pets p ON p.id = ap.pet_id
-- pero adoption_posts NO tiene columna pet_id. Tiene pet_name TEXT
-- directo (ver mig 20251127162210). El JOIN silencioso retorna NULL
-- y el nombre cae al fallback 'tu mascota' siempre, pero ademas
-- produce overhead de plan innecesario.
--
-- Fix: reemplazar la funcion para leer ap.pet_name directamente.
-- NO aplicar automaticamente. El dueno aplica manualmente desde
-- Supabase Dashboard > SQL Editor.
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
  SELECT user_id, pet_name INTO v_post_owner_id, v_pet_name
  FROM adoption_posts
  WHERE id = NEW.adoption_post_id;

  IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.interested_user_id THEN
    RETURN NEW;
  END IF;

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

-- El trigger notify_on_adoption_interest ya existe desde mig 20260412220000,
-- solo redefinimos la funcion. No tocamos el trigger mismo.
