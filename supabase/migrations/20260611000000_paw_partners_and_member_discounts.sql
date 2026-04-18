-- ==========================================================================
-- Paw Partners: distincion sponsor vs partner (tiendas/accesorios/restaurantes)
-- + estructura para descuentos de Paw Member
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19 - modelo final):
-- Pedro clarifica que hay 3 tipos de alianzas en el modelo Paw Friend:
--   1. Paw Voices    — creadores/influencers (tabla paw_voices existente)
--   2. Paw Companys  — sponsors empresariales con aporte monetario mensual
--   3. Paw Partners  — tiendas/accesorios/comida/restaurantes que aportan
--                      exposicion/descuentos a cambio de publicidad en la app.
--                      Nombre pendiente de confirmacion (placeholder "Paw Partners").
--
-- Esta migracion:
--   - Agrega columna `partnership_type` a paw_companys para distinguir
--     'sponsor' (aporta $) vs 'partner' (barter, descuentos vs flujo).
--     Default 'sponsor' para retrocompat con los existentes.
--   - Agrega columna `paw_member_discount` (texto libre) para que el
--     partner describa que descuento ofrece a usuarios Paw Member.
--     Ej: "10% de descuento", "2x1 en alimento premium".
--   - Crea RPC get_paw_member_discounts() publico que lista partners
--     activos con descuentos visibles. Usado por pagina Paw Member.
-- ==========================================================================

ALTER TABLE public.paw_companys
  ADD COLUMN IF NOT EXISTS partnership_type TEXT NOT NULL DEFAULT 'sponsor'
    CHECK (partnership_type IN ('sponsor', 'partner')),
  ADD COLUMN IF NOT EXISTS paw_member_discount TEXT CHECK (
    paw_member_discount IS NULL OR length(paw_member_discount) <= 200
  );

CREATE INDEX IF NOT EXISTS idx_paw_companys_partnership_type
  ON public.paw_companys(partnership_type, is_active);

COMMENT ON COLUMN public.paw_companys.partnership_type IS
  'sponsor = aporta dinero mensual | partner = tienda/accesorios que aporta descuentos/flujo a cambio de exposicion (barter).';

COMMENT ON COLUMN public.paw_companys.paw_member_discount IS
  'Texto libre con el descuento/beneficio que el partner ofrece a usuarios Paw Member. NULL si no aplica.';

-- ==========================================================================
-- RPC get_paw_member_discounts: lista partners activos con descuentos
-- visibles para Paw Members. Publico (cualquier user autenticado puede
-- leer, anon tambien — los descuentos son publicos).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_paw_member_discounts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  paw_member_discount TEXT,
  partnership_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.logo_url,
    p.website,
    p.description,
    p.paw_member_discount,
    p.partnership_type
  FROM public.paw_companys p
  WHERE p.is_active = TRUE
    AND p.paw_member_discount IS NOT NULL
    AND LENGTH(TRIM(p.paw_member_discount)) > 0
  ORDER BY p.featured DESC, p.partnership_type ASC, p.name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_paw_member_discounts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_paw_member_discounts() TO anon, authenticated;

COMMENT ON FUNCTION public.get_paw_member_discounts() IS
  'Lista publica de partners activos (sponsor o partner) que ofrecen descuentos a Paw Members. Usado en pagina /paw-member.';
