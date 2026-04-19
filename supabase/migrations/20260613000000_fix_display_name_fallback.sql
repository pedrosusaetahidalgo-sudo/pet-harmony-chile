-- ==========================================================================
-- Fix del trigger handle_new_user: restaurar generador de nombre amigable.
--
-- Contexto: la migracion 20260526000000_reset_fake_premium_users.sql tenia como
-- objetivo resetear usuarios "premium falsos" a free, pero al redefinir el
-- trigger handle_new_user sobrescribio el fix previo
-- (20260515100000_default_display_name_generator.sql) que generaba nombres
-- random tipo "PajaritoSaltarin_5674". Resultado: usuarios que hacen signup
-- con Google/Apple OAuth (que traen el nombre en 'full_name', no en 'name')
-- o sin nombre, quedan con su email como display_name, o con NULL.
--
-- Este fix:
--   1. Lee COALESCE(name, full_name) para cubrir todos los providers OAuth.
--   2. Si el valor final es NULL, vacio, o parece email → llama a
--      generate_default_display_name() (funcion creada en la mig 20260515100000,
--      sigue existiendo, no fue droppeada).
--   3. Mantiene plan_id='free', is_premium=false (respeta el pivot del 2026-04-19).
--
-- Zero-downtime: CREATE OR REPLACE de funcion, no toca datos existentes.
-- Los 5 perfiles con display_name='Usuario' (residuo historico) quedan como
-- estan; el NamePromptDialog del frontend los capturara cuando vuelvan a entrar
-- a /home (ver isGenericDisplayName en src/lib/format.ts).
--
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_name TEXT;
  final_name TEXT;
BEGIN
  -- OAuth providers usan distintas claves en raw_user_meta_data:
  --   Email/password signup (Auth.tsx) → 'display_name'
  --   Google OAuth → 'full_name' (a veces tambien 'name')
  --   Apple OAuth → 'full_name' (o nada si el usuario oculta)
  --   Facebook OAuth → 'name'
  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name'
  );

  -- Si viene null, vacio, o parece email → generar nombre amigable aleatorio.
  IF raw_name IS NULL OR btrim(raw_name) = '' OR raw_name ~ '^[a-zA-Z0-9._%+-]+@' THEN
    final_name := generate_default_display_name();
  ELSE
    final_name := btrim(raw_name);
  END IF;

  INSERT INTO public.profiles (id, display_name, plan_id, is_premium, plan_expires_at)
  VALUES (
    NEW.id,
    final_name,
    'free',
    false,
    null
  );

  -- user_stats (puede no existir en todos los envs)
  BEGIN
    INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Crea profile free para usuario nuevo. Genera nombre amigable aleatorio si no viene nombre del provider OAuth o si parece email. Apply_premium lo promueve al pagar via Flow.';
