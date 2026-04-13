-- ============================================================
-- Cuentas admin/tester con todo desbloqueado
-- 2026-04-12
-- NO aplicar automaticamente. El dueno aplica manualmente desde Supabase Dashboard > SQL Editor.
-- ============================================================

-- Los 3 emails admin/tester:
--   pedro.susaeta.hidalgo@gmail.com
--   psusaeta13@gmail.com
--   pawfriendcl@gmail.com
--
-- Este script:
-- 1. Les da rol 'admin' en user_roles (si no lo tienen)
-- 2. Les crea un registro en service_providers (si no lo tienen) para acceder al dashboard vet
-- 3. Les asigna plan provider_clinic_pro + premium B2C para tener todo desbloqueado

-- ============================================================
-- 1. Asignar rol admin a los 3 usuarios
-- ============================================================

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::public.app_role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'pedro.susaeta.hidalgo@gmail.com',
  'psusaeta13@gmail.com',
  'pawfriendcl@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- 2. Marcar como premium B2C
-- ============================================================

UPDATE public.profiles
SET
  plan_id = 'premium',
  is_premium = true,
  plan_badge = '⭐'
WHERE id IN (
  SELECT u.id FROM auth.users u
  WHERE u.email IN (
    'pedro.susaeta.hidalgo@gmail.com',
    'psusaeta13@gmail.com',
    'pawfriendcl@gmail.com'
  )
);

-- ============================================================
-- 3. Crear service_provider si no existe para cada uno
-- ============================================================

INSERT INTO public.service_providers (
  user_id,
  display_name,
  status,
  is_verified,
  provider_plan,
  provider_type,
  slug,
  commune,
  is_directory_visible
)
SELECT
  u.id,
  COALESCE(p.display_name, split_part(u.email, '@', 1)),
  'approved',
  true,
  'provider_clinic_pro',
  'individual',
  'admin-' || split_part(u.email, '@', 1),
  'Santiago',
  false  -- No visible en directorio publico (son cuentas admin/tester)
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'pedro.susaeta.hidalgo@gmail.com',
  'psusaeta13@gmail.com',
  'pawfriendcl@gmail.com'
)
AND NOT EXISTS (
  SELECT 1 FROM public.service_providers sp WHERE sp.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Si ya existen como providers, actualizar su plan a clinic_pro
UPDATE public.service_providers
SET provider_plan = 'provider_clinic_pro'
WHERE user_id IN (
  SELECT u.id FROM auth.users u
  WHERE u.email IN (
    'pedro.susaeta.hidalgo@gmail.com',
    'psusaeta13@gmail.com',
    'pawfriendcl@gmail.com'
  )
);
