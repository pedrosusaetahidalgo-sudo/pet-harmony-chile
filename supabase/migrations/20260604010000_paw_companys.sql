-- ==========================================================================
-- Paw Companys: motor B2B2C de sponsors con badge empresarial
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- Slide 8 del pitch promete Paw Companys ($49.9K-$199.9K CLP/mes) como tercer
-- motor de revenue. Esta migracion crea el MVP: tabla + policies + CRUD admin.
--
-- Alcance MVP:
--   - Billing manual (transferencia). Sin Flow recurrent todavia.
--   - Tier: bronze / silver / gold determina badge visual.
--   - Admin ingresa sponsors manualmente; se muestran en /donaciones grid.
--
-- Privacy: no hay PII en la tabla. Policy lectura anon OK para is_active.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.paw_companys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  logo_url TEXT,
  website TEXT CHECK (website IS NULL OR website ~ '^https?://'),
  description TEXT CHECK (description IS NULL OR length(description) <= 280),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  monthly_clp INT CHECK (monthly_clp IS NULL OR (monthly_clp >= 0 AND monthly_clp <= 10000000)),
  featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paw_companys_active
  ON public.paw_companys(featured DESC, tier, name)
  WHERE is_active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_paw_companys_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paw_companys_updated_at ON public.paw_companys;
CREATE TRIGGER trg_paw_companys_updated_at
  BEFORE UPDATE ON public.paw_companys
  FOR EACH ROW EXECUTE FUNCTION public.touch_paw_companys_updated_at();

-- RLS
ALTER TABLE public.paw_companys ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer sponsors activos (no hay PII).
DROP POLICY IF EXISTS "paw_companys_public_read" ON public.paw_companys;
CREATE POLICY "paw_companys_public_read"
  ON public.paw_companys FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Solo admin activo puede leer TODO (incluidos inactivos) y escribir.
DROP POLICY IF EXISTS "paw_companys_admin_all" ON public.paw_companys;
CREATE POLICY "paw_companys_admin_all"
  ON public.paw_companys FOR ALL
  TO authenticated
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

COMMENT ON TABLE public.paw_companys IS
  'Sponsors empresariales (Paw Companys). Admin ingresa manualmente. MVP sin billing recurrente.';
