-- ==========================================================================
-- Reset premium falsos: todos los usuarios a free.
-- Motivo: FEATURE_FLAGS.USER_PREMIUM estaba false, por lo que la app trataba
-- a todos como premium a nivel UI. Muchos profiles tienen plan_id='premium'
-- e is_premium=true sin haber pagado (trial de 14 dias del trigger, o datos
-- de pruebas). Al activar USER_PREMIUM=true estos usuarios seguirian viendose
-- premium sin haber pagado.
--
-- Criterio: un usuario es premium REAL solo si tiene una subscription con
-- status='active' en public.subscriptions (la tabla que actualiza flow-webhook
-- via apply_premium). Cualquier otra combinacion se considera premium falso.
--
-- Tambien se deja handle_new_user creando usuarios nuevos como 'free' sin
-- trial, consistente con el criterio de no regalar premium automatico.
--
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ==========================================================================

-- 1. Reset de profiles premium falsos.
--    Preserva premium REAL (subscription active).
UPDATE public.profiles p
SET plan_id = 'free',
    is_premium = false,
    premium_plan = null,
    plan_expires_at = null
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s
  WHERE s.user_id = p.id AND s.status = 'active'
);

-- 2. Si alguien tiene subscription active pero el profile no lo refleja,
--    re-sincronizar (idempotente, no rompe a usuarios premium pagados).
UPDATE public.profiles p
SET plan_id = 'premium',
    is_premium = true
FROM public.subscriptions s
WHERE s.user_id = p.id
  AND s.status = 'active'
  AND (p.is_premium = false OR p.plan_id IS DISTINCT FROM 'premium');

-- 3. handle_new_user: nuevos usuarios arrancan free, sin trial.
--    Apply_premium los promueve cuando pagan via Flow.
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
  'Nuevos usuarios se crean como free. Apply_premium los promueve al pagar via Flow.';
