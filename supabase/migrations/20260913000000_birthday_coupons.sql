-- 2026-04-30 (Birthday biometric coupons · #12 RICE 149)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Spec: docs-raiz/PAW_SHIELD_IDEAS_BANK.md §12.
--
-- Componentes:
--   1. Tabla birthday_coupon_partners — partners que ofrecen cupon birthday
--      (Master Dog, Pet Star, etc). Editable desde admin.
--   2. RPC list_active_birthday_coupons(pet_id) — devuelve cupones aplicables
--      si el pet esta dentro de window cumpleanos (±3 dias).
--   3. Trigger sin redemption flow (eso lo hace el partner cuando integramos
--      su scanner de hocico — pendiente firma de partner).

BEGIN;

-- ── 1. Tabla birthday_coupon_partners ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.birthday_coupon_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  discount_percent SMALLINT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  category TEXT NOT NULL CHECK (category IN ('food', 'accessory', 'service', 'grooming', 'other')),
  partner_logo_url TEXT,
  partner_url TEXT,
  redemption_instructions TEXT NOT NULL DEFAULT
    'Lleva a tu mascota a la tienda. El partner escanea su hocico para validar identidad y el descuento se aplica al ticket.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Geo opcional: si tiene comuna, solo se muestra a duenos de esa comuna.
  comunas_disponibles TEXT[],
  -- Especies aplicables. NULL = todas.
  species_filter TEXT[] CHECK (
    species_filter IS NULL OR
    (species_filter <@ ARRAY['DOG', 'CAT'])
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.birthday_coupon_partners IS
  'Partners que ofrecen descuento birthday a Paw Members en su cumple. Cada cupon se valida en la tienda al escanear hocico (Paw Shield). Sin partner integrado todavia: UI listo, redemption flow pendiente firma.';

CREATE INDEX IF NOT EXISTS idx_bcp_active
  ON public.birthday_coupon_partners(is_active) WHERE is_active = true;

-- ── 2. RLS: lectura publica · solo admin puede escribir ───────────────
ALTER TABLE public.birthday_coupon_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bcp_public_read ON public.birthday_coupon_partners;
CREATE POLICY bcp_public_read
  ON public.birthday_coupon_partners FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS bcp_admin_all ON public.birthday_coupon_partners;
CREATE POLICY bcp_admin_all
  ON public.birthday_coupon_partners
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── 3. RPC list_active_birthday_coupons(pet_id) ───────────────────────
CREATE OR REPLACE FUNCTION public.list_active_birthday_coupons(p_pet_id UUID)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  display_name TEXT,
  description TEXT,
  discount_percent SMALLINT,
  category TEXT,
  partner_logo_url TEXT,
  partner_url TEXT,
  redemption_instructions TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  v_pet RECORD;
  v_owner_comuna TEXT;
  v_today DATE := CURRENT_DATE;
  v_birthday_this_year DATE;
  v_days_diff INT;
BEGIN
  -- Cargar pet (con check ownership via RLS, pero como SECURITY DEFINER necesitamos
  -- chequear manualmente).
  SELECT p.id, p.owner_id, p.species, p.birth_date
  INTO v_pet
  FROM public.pets p
  WHERE p.id = p_pet_id
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
    );

  IF v_pet IS NULL OR v_pet.birth_date IS NULL THEN
    RETURN;
  END IF;

  -- Calcular birthday window: cumple este ano +/- 3 dias.
  v_birthday_this_year := MAKE_DATE(
    EXTRACT(YEAR FROM v_today)::INT,
    EXTRACT(MONTH FROM v_pet.birth_date)::INT,
    EXTRACT(DAY FROM v_pet.birth_date)::INT
  );
  v_days_diff := ABS(v_today - v_birthday_this_year);

  -- Si no estamos en window, no devolvemos nada.
  IF v_days_diff > 3 THEN
    RETURN;
  END IF;

  -- Cargar comuna del owner.
  SELECT pr.comuna INTO v_owner_comuna
  FROM public.profiles pr
  WHERE pr.id = v_pet.owner_id;

  -- Especie del pet normalizada.
  RETURN QUERY
  SELECT
    bcp.id,
    bcp.slug,
    bcp.display_name,
    bcp.description,
    bcp.discount_percent,
    bcp.category,
    bcp.partner_logo_url,
    bcp.partner_url,
    bcp.redemption_instructions
  FROM public.birthday_coupon_partners bcp
  WHERE bcp.is_active = true
    AND (
      bcp.species_filter IS NULL OR
      (CASE
        WHEN LOWER(v_pet.species) LIKE '%perro%' OR LOWER(v_pet.species) = 'dog' THEN 'DOG'
        WHEN LOWER(v_pet.species) LIKE '%gato%' OR LOWER(v_pet.species) = 'cat' THEN 'CAT'
        ELSE NULL
      END) = ANY(bcp.species_filter)
    )
    AND (
      bcp.comunas_disponibles IS NULL OR
      v_owner_comuna IS NULL OR
      v_owner_comuna = ANY(bcp.comunas_disponibles)
    )
  ORDER BY bcp.discount_percent DESC;
END $$;

REVOKE ALL ON FUNCTION public.list_active_birthday_coupons(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_active_birthday_coupons(UUID) TO authenticated;

COMMENT ON FUNCTION public.list_active_birthday_coupons IS
  'Devuelve cupones birthday activos para un pet, solo si esta dentro de window ±3 dias del cumple. Filtra por especie + comuna del owner. Owner-only via auth.uid().';

-- ── 4. Seed inicial: 2 partners de ejemplo (placeholder hasta firma real) ──
-- Estos quedan inactivos hasta que Pedro confirme partner.
INSERT INTO public.birthday_coupon_partners
  (slug, display_name, description, discount_percent, category, redemption_instructions, is_active, species_filter)
VALUES
  (
    'master-dog-birthday-2026',
    'Master Dog',
    'Descuento de cumpleanos en alimento premium.',
    20,
    'food',
    'Lleva a tu mascota al local Master Dog. El cajero escanea su hocico con la app del partner y aplica el 20% al ticket. Valido en alimento marca propia.',
    false, -- inactive hasta firma con Master Dog
    ARRAY['DOG']::TEXT[]
  ),
  (
    'pet-star-birthday-2026',
    'Pet Star',
    'Descuento de cumpleanos en accesorios y juguetes.',
    15,
    'accessory',
    'Presenta a tu mascota en cualquier sucursal Pet Star. Se valida con escaneo de hocico y se aplica el 15% en accesorios.',
    false, -- inactive hasta firma con Pet Star
    ARRAY['DOG', 'CAT']::TEXT[]
  )
ON CONFLICT (slug) DO NOTHING;

COMMIT;
