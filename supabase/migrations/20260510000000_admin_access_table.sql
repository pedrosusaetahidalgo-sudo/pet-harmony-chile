-- Admin Access Control: restringe panel admin a usuarios autorizados
-- Super admin: acceso total + puede invitar operadores
-- Admin operator: acceso parcial segun permisos granulares

CREATE TABLE IF NOT EXISTS public.admin_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'super_admin'
    CHECK (role IN ('super_admin', 'admin_operator')),
  permissions JSONB DEFAULT '{}'::jsonb,
  -- Permisos granulares para admin_operator:
  -- { "dashboard": true, "providers": true, "users": true, "payments": true,
  --   "content": true, "rewards": true, "ads": true, "partners": true,
  --   "settings": true, "safety": true, "system": true }
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ,
  UNIQUE(user_id)
);

ALTER TABLE public.admin_access ENABLE ROW LEVEL SECURITY;

-- Solo super_admin puede ver/modificar admin_access
DROP POLICY IF EXISTS "Super admin full access on admin_access" ON public.admin_access;
CREATE POLICY "Super admin full access on admin_access"
  ON public.admin_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access aa
      WHERE aa.user_id = auth.uid()
        AND aa.role = 'super_admin'
        AND aa.is_active = true
    )
  );

-- Cualquier admin activo puede leer su propio registro (para verificar acceso)
DROP POLICY IF EXISTS "Admin can read own access" ON public.admin_access;
CREATE POLICY "Admin can read own access"
  ON public.admin_access FOR SELECT
  USING (user_id = auth.uid() AND is_active = true);

-- Seed: Pedro como super_admin
INSERT INTO public.admin_access (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'pedro.susaeta.hidalgo@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
