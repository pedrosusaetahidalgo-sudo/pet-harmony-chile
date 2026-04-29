-- 2026-04-30 (Retail motor end-to-end · Refactor Maestro Fase 2 §7.4)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Cierra el motor #3 del REVENUE_MASTER_PLAN_2026.md: retail pet
-- (Master Dog · Falabella · Puppis · Pet Star · Vitanimal).
--
-- Diferente a insurance: aqui NO hay cotizacion. El motor es de
-- recomendacion + revenue share por click + auto-replenish suscripcion.
--
-- Componentes:
--   1. retail_partners — partners retailers activos
--   2. retail_clicks — tracking de clicks (para attribution + revenue share)
--   3. RPC list_active_retail_partners(pet_id) — filtra por especie + comuna
--   4. RPC track_retail_click(partner_id, sku, recommendation_kind) — logs click
--
-- Recomendaciones: las hace el frontend leyendo pets.breed/birth_date/weight_kg
-- y mapeando con el catalogo del partner. No persistimos catalogos completos;
-- el partner expone el catalogo via API o lo cargamos como JSONB en
-- retail_partners.product_catalog.

BEGIN;

-- ── 1. retail_partners ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.retail_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  legal_name TEXT,
  contact_email TEXT NOT NULL,
  partner_logo_url TEXT,
  partner_url TEXT,

  -- Modelo: comision sobre venta (revenue share) + tier de visibilidad
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  -- Tier: affiliate (8-12%) | marketplace (15% + setup) | brand_partner ($3k+/mes + RS)
  tier TEXT NOT NULL CHECK (tier IN ('affiliate', 'marketplace', 'brand_partner')) DEFAULT 'affiliate',

  -- Descuento exclusivo Paw Members (opcional)
  paw_member_discount_percent NUMERIC(5,2),

  -- Categorias que vende: food, accessory, food_subscription, pharmacy_supplies, etc.
  categories TEXT[] NOT NULL DEFAULT ARRAY['food']::TEXT[],

  -- Catalogo de productos basico para MVP (opcional; sino se referencia URL externa)
  -- Estructura: [{ sku, name, category, price_clp, image_url, target_breed?, target_weight_min?,
  --                 target_weight_max?, target_age_min_months?, target_age_max_months? }]
  product_catalog JSONB DEFAULT '[]'::jsonb,

  -- Filtros geo + species
  species_filter TEXT[] CHECK (
    species_filter IS NULL OR
    (species_filter <@ ARRAY['DOG', 'CAT'])
  ),
  comunas_disponibles TEXT[],

  is_active BOOLEAN NOT NULL DEFAULT false,
  display_order SMALLINT NOT NULL DEFAULT 100,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.retail_partners IS
  'Retailers pet con acuerdo. Inactive por defecto hasta firma. product_catalog JSONB opcional con SKUs basicos. tier define modelo (affiliate/marketplace/brand_partner).';

CREATE INDEX IF NOT EXISTS idx_rp_active
  ON public.retail_partners(is_active, display_order) WHERE is_active = true;

ALTER TABLE public.retail_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rp_public_read ON public.retail_partners;
CREATE POLICY rp_public_read
  ON public.retail_partners FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS rp_admin_all ON public.retail_partners;
CREATE POLICY rp_admin_all
  ON public.retail_partners
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── 2. retail_clicks (attribution tracking) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.retail_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.retail_partners(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  sku TEXT,
  category TEXT,
  recommendation_kind TEXT
    CHECK (recommendation_kind IN ('food', 'accessory', 'pharmacy', 'subscription', 'banner', 'other')),
  -- Si despues queremos atribuir conversion (compra real), persistimos amount.
  conversion_clp INT,
  converted_at TIMESTAMPTZ,
  referrer_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rc_partner_time
  ON public.retail_clicks(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rc_owner ON public.retail_clicks(owner_id);
CREATE INDEX IF NOT EXISTS idx_rc_pet ON public.retail_clicks(pet_id) WHERE pet_id IS NOT NULL;

ALTER TABLE public.retail_clicks ENABLE ROW LEVEL SECURITY;

-- Solo admin puede leer todos. Owner puede ver sus propios clicks.
DROP POLICY IF EXISTS rc_owner_select ON public.retail_clicks;
CREATE POLICY rc_owner_select
  ON public.retail_clicks FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS rc_owner_insert ON public.retail_clicks;
CREATE POLICY rc_owner_insert
  ON public.retail_clicks FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS rc_admin_all ON public.retail_clicks;
CREATE POLICY rc_admin_all
  ON public.retail_clicks
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── 3. RPC list_active_retail_partners ────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_active_retail_partners(p_pet_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  display_name TEXT,
  partner_logo_url TEXT,
  partner_url TEXT,
  tier TEXT,
  commission_percent NUMERIC,
  paw_member_discount_percent NUMERIC,
  categories TEXT[],
  product_catalog JSONB,
  display_order SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  v_pet RECORD;
  v_owner_comuna TEXT;
  v_species TEXT;
BEGIN
  IF p_pet_id IS NOT NULL THEN
    SELECT p.species, p.owner_id INTO v_pet
    FROM public.pets p
    WHERE p.id = p_pet_id
      AND (
        p.owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
      );
    IF v_pet IS NULL THEN
      RAISE EXCEPTION 'Pet not found or no permission';
    END IF;

    v_species := CASE
      WHEN LOWER(v_pet.species) LIKE '%perro%' OR LOWER(v_pet.species) = 'dog' THEN 'DOG'
      WHEN LOWER(v_pet.species) LIKE '%gato%' OR LOWER(v_pet.species) = 'cat' THEN 'CAT'
      ELSE NULL
    END;

    SELECT pr.comuna INTO v_owner_comuna
    FROM public.profiles pr
    WHERE pr.id = v_pet.owner_id;
  END IF;

  RETURN QUERY
  SELECT
    rp.id,
    rp.slug,
    rp.display_name,
    rp.partner_logo_url,
    rp.partner_url,
    rp.tier,
    rp.commission_percent,
    rp.paw_member_discount_percent,
    rp.categories,
    rp.product_catalog,
    rp.display_order
  FROM public.retail_partners rp
  WHERE rp.is_active = true
    AND (
      v_species IS NULL OR
      rp.species_filter IS NULL OR
      v_species = ANY(rp.species_filter)
    )
    AND (
      v_owner_comuna IS NULL OR
      rp.comunas_disponibles IS NULL OR
      v_owner_comuna = ANY(rp.comunas_disponibles)
    )
  ORDER BY rp.display_order ASC, rp.display_name ASC;
END $$;

REVOKE ALL ON FUNCTION public.list_active_retail_partners(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_active_retail_partners(UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.list_active_retail_partners IS
  'Devuelve retail partners activos. Si pet_id viene, filtra por especie + comuna.';

-- ── 4. RPC track_retail_click (server-side tracking) ──────────────────
CREATE OR REPLACE FUNCTION public.track_retail_click(
  p_partner_id UUID,
  p_pet_id UUID DEFAULT NULL,
  p_sku TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_recommendation_kind TEXT DEFAULT 'banner',
  p_referrer_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  INSERT INTO public.retail_clicks
    (partner_id, pet_id, owner_id, sku, category, recommendation_kind, referrer_url)
  VALUES
    (p_partner_id, p_pet_id, v_user, p_sku, p_category, p_recommendation_kind, p_referrer_url)
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.track_retail_click(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_retail_click(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.track_retail_click IS
  'Registra click del owner en partner retail. Para attribution + revenue share. Owner-only auth.';

-- ── 5. RPC retail_partner_stats (admin) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.retail_partner_stats(p_partner_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
  total_clicks BIGINT,
  unique_owners BIGINT,
  conversions BIGINT,
  total_conversion_clp BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_clicks,
    COUNT(DISTINCT owner_id)::BIGINT AS unique_owners,
    COUNT(*) FILTER (WHERE converted_at IS NOT NULL)::BIGINT AS conversions,
    COALESCE(SUM(conversion_clp), 0)::BIGINT AS total_conversion_clp
  FROM public.retail_clicks
  WHERE partner_id = p_partner_id
    AND created_at >= NOW() - (p_days * INTERVAL '1 day')
    AND EXISTS (
      SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true
    );
$$;

REVOKE ALL ON FUNCTION public.retail_partner_stats(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retail_partner_stats(UUID, INT) TO authenticated;

-- ── 6. Seed inicial: 3 partners (inactivos hasta firma) ───────────────
INSERT INTO public.retail_partners
  (slug, display_name, legal_name, contact_email, partner_url, tier,
   commission_percent, paw_member_discount_percent, categories, is_active, display_order, notes)
VALUES
  (
    'master-dog',
    'Master Dog',
    'Master Dog Chile S.A.',
    'partnerships@masterdog.cl',
    'https://www.masterdog.cl',
    'affiliate', 10.0, 12.0,
    ARRAY['food', 'accessory']::TEXT[],
    false, 10,
    'Inactivo hasta firma. Pricing referencial 10% comision affiliate.'
  ),
  (
    'puppis',
    'Puppis',
    'Puppis Chile S.A.',
    'partnerships@puppis.cl',
    'https://www.puppis.cl',
    'affiliate', 8.0, 10.0,
    ARRAY['food', 'accessory', 'pharmacy']::TEXT[],
    false, 20,
    'Inactivo hasta firma.'
  ),
  (
    'pet-star',
    'Pet Star',
    'Pet Star S.A.',
    'partnerships@petstar.cl',
    'https://www.petstar.cl',
    'affiliate', 12.0, 15.0,
    ARRAY['food', 'accessory']::TEXT[],
    false, 30,
    'Inactivo hasta firma.'
  )
ON CONFLICT (slug) DO NOTHING;

COMMIT;
