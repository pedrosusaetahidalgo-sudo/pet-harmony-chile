-- ============================================================
-- Activar premium para Anto y Sofia Rossi
-- 2026-04-13
-- APLICADO MANUALMENTE en Supabase Dashboard el 2026-04-13.
-- ============================================================
--   antosusaeta@gmail.com          (b248c4dc-ab36-4c46-aec7-afdedf5664f4) → premium B2C yearly
--   vetsofiarossi@gmail.com        (839d7626-7292-4bb1-92c6-e50ba551832e) → premium B2C yearly + provider_clinic_pro
-- ============================================================

-- ============================================================
-- 1. Premium B2C en profiles (ambas)
-- ============================================================

UPDATE public.profiles
SET
  is_premium = true,
  premium_plan = 'yearly',
  premium_start_date = now(),
  premium_end_date = now() + interval '1 year',
  is_grandfathered = true,
  updated_at = now()
WHERE id IN (
  'b248c4dc-ab36-4c46-aec7-afdedf5664f4',
  '839d7626-7292-4bb1-92c6-e50ba551832e'
);

-- ============================================================
-- 2. Subscription record (ambas)
-- ============================================================

INSERT INTO public.subscriptions (user_id, plan_type, status, start_date, end_date, auto_renew)
VALUES
  ('b248c4dc-ab36-4c46-aec7-afdedf5664f4', 'yearly', 'active', now(), now() + interval '1 year', false),
  ('839d7626-7292-4bb1-92c6-e50ba551832e', 'yearly', 'active', now(), now() + interval '1 year', false);

-- ============================================================
-- 3. Upgrade provider plan de Sofia a clinic_pro
-- ============================================================

UPDATE public.service_providers
SET
  provider_plan = 'provider_clinic_pro',
  is_verified = true,
  updated_at = now()
WHERE user_id = '839d7626-7292-4bb1-92c6-e50ba551832e';
