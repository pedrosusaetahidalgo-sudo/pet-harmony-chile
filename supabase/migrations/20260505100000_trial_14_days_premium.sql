-- Trial 14 dias Premium para todos los usuarios nuevos
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.

-- 1. Actualizar handle_new_user para asignar trial premium
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, plan_id, is_premium, plan_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'premium',
    true,
    now() + interval '14 days'
  );

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- 2. Funcion para degradar trials expirados (ejecutar via cron o manualmente)
CREATE OR REPLACE FUNCTION public.expire_premium_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.profiles
  SET plan_id = 'free',
      is_premium = false
  WHERE plan_id = 'premium'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
