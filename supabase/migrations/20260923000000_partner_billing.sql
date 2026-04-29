-- 2026-04-30 (Partner billing calculator · cierra audit-readiness 3er batch)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Cuando entren los primeros 1-3 partners B2B reales, Pedro va a
-- necesitar calcular cuanto facturarles cada mes. Este billing
-- calculator agrega:
--
-- 1. Columna `commission_config` JSONB en insurance_partners y
--    retail_partners para guardar el modelo comercial acordado.
-- 2. Columna `monthly_fee_clp` en b2b_api_keys para pricing tier.
-- 3. RPC compute_partner_invoices(p_year, p_month) que devuelve
--    una factura preview por cada partner activo con:
--    - line_items: detalle de cada item facturable
--    - subtotal, IVA (19%), total
--    - period_start, period_end
-- 4. Tabla partner_invoices opcional para persistir facturas emitidas.

BEGIN;

-- ── 1. Commission config en partners ──────────────────────────────────
ALTER TABLE public.insurance_partners
  ADD COLUMN IF NOT EXISTS commission_config JSONB DEFAULT '{
    "model": "per_qualified_lead",
    "amount_clp": 15000,
    "min_monthly_clp": 0,
    "notes": "Pago por lead calificado (con email + telefono validos)"
  }'::jsonb;

COMMENT ON COLUMN public.insurance_partners.commission_config IS
  'Modelo comercial acordado con la aseguradora. Default: pago por qualified lead. Otros modelos: revenue_share, fixed_monthly.';

ALTER TABLE public.retail_partners
  ADD COLUMN IF NOT EXISTS commission_config JSONB DEFAULT '{
    "model": "click_share",
    "click_pct": 5,
    "conversion_pct": 10,
    "min_monthly_clp": 0,
    "notes": "5% por click validado, 10% sobre conversion_clp atribuida"
  }'::jsonb;

COMMENT ON COLUMN public.retail_partners.commission_config IS
  'Modelo comercial retail. Default: click_share (5% click + 10% conversion). Otros: cpc_fixed, revenue_share, fixed_monthly.';

ALTER TABLE public.b2b_api_keys
  ADD COLUMN IF NOT EXISTS monthly_fee_clp INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.b2b_api_keys.monthly_fee_clp IS
  'Tarifa mensual fija acordada con el cliente B2B. 0 para tier free, ej: 200000 para enterprise.';

-- ── 2. RPC compute_partner_invoices ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_partner_invoices(
  p_year INT DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  p_month INT DEFAULT EXTRACT(MONTH FROM NOW())::INT
)
RETURNS TABLE (
  partner_kind TEXT,
  partner_id UUID,
  partner_name TEXT,
  partner_email TEXT,
  period_start DATE,
  period_end DATE,
  line_items JSONB,
  subtotal_clp BIGINT,
  iva_clp BIGINT,
  total_clp BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Admin gate
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  -- Periodo: primer dia del mes y ultimo dia
  v_period_start := MAKE_DATE(p_year, p_month, 1);
  v_period_end := (v_period_start + INTERVAL '1 month - 1 day')::DATE;

  -- ── Insurance partners ──────────────────────────────────────────────
  RETURN QUERY
  SELECT
    'insurance'::TEXT,
    ip.id,
    ip.display_name,
    ip.contact_email,
    v_period_start,
    v_period_end,
    jsonb_build_object(
      'qualified_leads', COUNT(il.id),
      'amount_per_lead_clp', COALESCE((ip.commission_config->>'amount_clp')::INT, 15000),
      'subtotal_calc', COUNT(il.id) * COALESCE((ip.commission_config->>'amount_clp')::INT, 15000),
      'min_monthly_clp', COALESCE((ip.commission_config->>'min_monthly_clp')::INT, 0)
    ) AS line_items,
    GREATEST(
      COUNT(il.id) * COALESCE((ip.commission_config->>'amount_clp')::INT, 15000),
      COALESCE((ip.commission_config->>'min_monthly_clp')::INT, 0)
    )::BIGINT AS subtotal_clp,
    ROUND(
      GREATEST(
        COUNT(il.id) * COALESCE((ip.commission_config->>'amount_clp')::INT, 15000),
        COALESCE((ip.commission_config->>'min_monthly_clp')::INT, 0)
      ) * 0.19
    )::BIGINT AS iva_clp,
    ROUND(
      GREATEST(
        COUNT(il.id) * COALESCE((ip.commission_config->>'amount_clp')::INT, 15000),
        COALESCE((ip.commission_config->>'min_monthly_clp')::INT, 0)
      ) * 1.19
    )::BIGINT AS total_clp
  FROM public.insurance_partners ip
  LEFT JOIN public.insurance_leads il
    ON il.partner_id = ip.id
    AND il.created_at >= v_period_start
    AND il.created_at <= v_period_end + INTERVAL '1 day'
    AND il.contact_email IS NOT NULL
    AND il.contact_phone IS NOT NULL
  WHERE ip.is_active = true
  GROUP BY ip.id, ip.display_name, ip.contact_email, ip.commission_config;

  -- ── Retail partners ─────────────────────────────────────────────────
  RETURN QUERY
  SELECT
    'retail'::TEXT,
    rp.id,
    rp.display_name,
    rp.contact_email,
    v_period_start,
    v_period_end,
    jsonb_build_object(
      'total_clicks', COUNT(rc.id),
      'conversions', COUNT(rc.id) FILTER (WHERE rc.converted_at IS NOT NULL),
      'total_conversion_clp', COALESCE(SUM(rc.conversion_clp), 0),
      'click_pct', COALESCE((rp.commission_config->>'click_pct')::NUMERIC, 5),
      'conversion_pct', COALESCE((rp.commission_config->>'conversion_pct')::NUMERIC, 10),
      'min_monthly_clp', COALESCE((rp.commission_config->>'min_monthly_clp')::INT, 0)
    ) AS line_items,
    GREATEST(
      ROUND(
        COALESCE(SUM(rc.conversion_clp), 0) *
        COALESCE((rp.commission_config->>'conversion_pct')::NUMERIC, 10) / 100
      ),
      COALESCE((rp.commission_config->>'min_monthly_clp')::INT, 0)
    )::BIGINT AS subtotal_clp,
    ROUND(
      GREATEST(
        ROUND(
          COALESCE(SUM(rc.conversion_clp), 0) *
          COALESCE((rp.commission_config->>'conversion_pct')::NUMERIC, 10) / 100
        ),
        COALESCE((rp.commission_config->>'min_monthly_clp')::INT, 0)
      ) * 0.19
    )::BIGINT AS iva_clp,
    ROUND(
      GREATEST(
        ROUND(
          COALESCE(SUM(rc.conversion_clp), 0) *
          COALESCE((rp.commission_config->>'conversion_pct')::NUMERIC, 10) / 100
        ),
        COALESCE((rp.commission_config->>'min_monthly_clp')::INT, 0)
      ) * 1.19
    )::BIGINT AS total_clp
  FROM public.retail_partners rp
  LEFT JOIN public.retail_clicks rc
    ON rc.partner_id = rp.id
    AND rc.created_at >= v_period_start
    AND rc.created_at <= v_period_end + INTERVAL '1 day'
  WHERE rp.is_active = true
  GROUP BY rp.id, rp.display_name, rp.contact_email, rp.commission_config;

  -- ── B2B API partners ────────────────────────────────────────────────
  RETURN QUERY
  SELECT
    'b2b_api'::TEXT,
    k.id,
    k.name,
    k.contact_email,
    v_period_start,
    v_period_end,
    jsonb_build_object(
      'tier', k.tier,
      'monthly_fee_clp', k.monthly_fee_clp,
      'requests_in_period', COALESCE(SUM(u.request_count), 0),
      'rate_limit_per_hour', k.rate_limit_per_hour
    ) AS line_items,
    k.monthly_fee_clp::BIGINT AS subtotal_clp,
    ROUND(k.monthly_fee_clp * 0.19)::BIGINT AS iva_clp,
    ROUND(k.monthly_fee_clp * 1.19)::BIGINT AS total_clp
  FROM public.b2b_api_keys k
  LEFT JOIN public.b2b_api_usage u
    ON u.api_key_id = k.id
    AND u.hour_bucket >= v_period_start
    AND u.hour_bucket <= v_period_end + INTERVAL '1 day'
  WHERE k.is_active = true
    AND k.monthly_fee_clp > 0
  GROUP BY k.id, k.name, k.contact_email, k.tier, k.monthly_fee_clp, k.rate_limit_per_hour;
END $$;

REVOKE ALL ON FUNCTION public.compute_partner_invoices(INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_partner_invoices(INT, INT) TO authenticated;

COMMENT ON FUNCTION public.compute_partner_invoices IS
  'Calcula facturas preview por partner para un mes dado. Insurance: por qualified leads. Retail: % de conversion + click_share. B2B API: monthly_fee_clp fijo. ADMIN-ONLY. Devuelve N filas (una por partner activo).';

COMMIT;
