-- 2026-04-30 (Insurance motor end-to-end · Refactor Maestro Fase 2 §7.2)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Cierra el motor de revenue B2B #2 del REVENUE_MASTER_PLAN_2026.md:
-- Aseguradoras pet (Sura · BCI · Mapfre · Consorcio).
--
-- Componentes:
--   1. insurance_partners — partners aseguradores activos (slug, logo, pricing)
--   2. insurance_quotes — cotizaciones generadas (con risk score + prima)
--   3. insurance_leads — interes del dueño en contactar al partner (lead capture)
--   4. RPC compute_insurance_quote(pet_id, partner_slug) — quote real-time
--   5. RPC list_active_insurance_partners() — partners visibles para cotizar
--   6. Reusa calculate_pet_risk_score() existente para input actuarial.
--
-- Flow:
--   Dueno entra a /cotizar-seguro/:petId →
--     llama list_active_insurance_partners() →
--     para cada partner llama compute_insurance_quote(petId, slug) →
--     muestra prima estimada → CTA "Contactar partner" crea insurance_leads row →
--     edge fn request-insurance-quote envia email al partner.

BEGIN;

-- ── 1. insurance_partners ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.insurance_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  legal_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  partner_logo_url TEXT,
  partner_url TEXT,

  -- Pricing model: por defecto, prima base mensual ajustada por risk_score
  -- y multiplicador edad. Cada partner puede sobrescribir via JSONB.
  -- Estructura: {
  --   base_monthly_clp: 24900,
  --   risk_score_multiplier: { '90': 0.9, '80': 1.0, '70': 1.15, '60': 1.35, '50': 1.6 },
  --   age_multiplier: { '0-2': 0.9, '2-7': 1.0, '7-10': 1.3, '10+': 1.6 },
  --   coverage_summary: 'Hospitalizacion + cirugia + emergencia hasta $X CLP/ano'
  -- }
  pricing_model JSONB NOT NULL DEFAULT '{
    "base_monthly_clp": 24900,
    "risk_score_multiplier": {"90": 0.9, "80": 1.0, "70": 1.15, "60": 1.35, "50": 1.6},
    "age_multiplier": {"0-2": 0.9, "2-7": 1.0, "7-10": 1.3, "10+": 1.6},
    "coverage_summary": "Cobertura basica · cotiza con el partner los detalles."
  }'::jsonb,

  -- Especies aplicables. NULL = todas.
  species_filter TEXT[] CHECK (
    species_filter IS NULL OR
    (species_filter <@ ARRAY['DOG', 'CAT'])
  ),

  -- Si comuna no esta en la lista, no se muestra. NULL = todas las comunas.
  comunas_disponibles TEXT[],

  is_active BOOLEAN NOT NULL DEFAULT false,
  display_order SMALLINT NOT NULL DEFAULT 100,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.insurance_partners IS
  'Aseguradoras pet con las que tenemos acuerdo. Inactive por defecto hasta firma. pricing_model JSONB define base + multiplicadores por risk_score y edad.';

CREATE INDEX IF NOT EXISTS idx_ip_active
  ON public.insurance_partners(is_active, display_order) WHERE is_active = true;

ALTER TABLE public.insurance_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ip_public_read ON public.insurance_partners;
CREATE POLICY ip_public_read
  ON public.insurance_partners FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS ip_admin_all ON public.insurance_partners;
CREATE POLICY ip_admin_all
  ON public.insurance_partners
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── 2. insurance_quotes (snapshot de cotizaciones) ────────────────────
CREATE TABLE IF NOT EXISTS public.insurance_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  partner_id UUID NOT NULL REFERENCES public.insurance_partners(id) ON DELETE CASCADE,

  risk_score INT NOT NULL,
  age_years INT,
  monthly_premium_clp INT NOT NULL,
  annual_premium_clp INT NOT NULL,

  -- Snapshot del pricing_model aplicado (para auditoria/explicabilidad)
  pricing_snapshot JSONB,
  factors JSONB,

  -- Si el dueno hace click en "Contactar partner" creamos un lead.
  status TEXT NOT NULL DEFAULT 'computed'
    CHECK (status IN ('computed', 'lead_sent', 'partner_contacted', 'closed', 'declined')),

  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Las cotizaciones expiran. Despues se recomputan.
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_iq_pet ON public.insurance_quotes(pet_id);
CREATE INDEX IF NOT EXISTS idx_iq_owner ON public.insurance_quotes(owner_id);
CREATE INDEX IF NOT EXISTS idx_iq_status_time
  ON public.insurance_quotes(status, computed_at DESC);

ALTER TABLE public.insurance_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS iq_owner_select ON public.insurance_quotes;
CREATE POLICY iq_owner_select
  ON public.insurance_quotes FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS iq_admin_all ON public.insurance_quotes;
CREATE POLICY iq_admin_all
  ON public.insurance_quotes
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── 3. insurance_leads (cuando el dueño expresa interes) ──────────────
CREATE TABLE IF NOT EXISTS public.insurance_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.insurance_quotes(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  partner_id UUID NOT NULL REFERENCES public.insurance_partners(id) ON DELETE CASCADE,

  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  message TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'partner_replied', 'closed', 'lost')),
  partner_notified_at TIMESTAMPTZ,
  partner_reply_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_il_owner ON public.insurance_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_il_partner_status
  ON public.insurance_leads(partner_id, status, created_at DESC);

ALTER TABLE public.insurance_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS il_owner_select ON public.insurance_leads;
CREATE POLICY il_owner_select
  ON public.insurance_leads FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Insert: el dueño puede crear leads sobre sus propias quotes.
DROP POLICY IF EXISTS il_owner_insert ON public.insurance_leads;
CREATE POLICY il_owner_insert
  ON public.insurance_leads FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS il_admin_all ON public.insurance_leads;
CREATE POLICY il_admin_all
  ON public.insurance_leads
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── 4. RPC list_active_insurance_partners ────────────────────────────
CREATE OR REPLACE FUNCTION public.list_active_insurance_partners(p_pet_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  display_name TEXT,
  partner_logo_url TEXT,
  partner_url TEXT,
  coverage_summary TEXT,
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
  -- Si pet_id viene, filtrar por especie + comuna del owner.
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
    ip.id,
    ip.slug,
    ip.display_name,
    ip.partner_logo_url,
    ip.partner_url,
    (ip.pricing_model->>'coverage_summary')::TEXT AS coverage_summary,
    ip.display_order
  FROM public.insurance_partners ip
  WHERE ip.is_active = true
    AND (
      v_species IS NULL OR
      ip.species_filter IS NULL OR
      v_species = ANY(ip.species_filter)
    )
    AND (
      v_owner_comuna IS NULL OR
      ip.comunas_disponibles IS NULL OR
      v_owner_comuna = ANY(ip.comunas_disponibles)
    )
  ORDER BY ip.display_order ASC, ip.display_name ASC;
END $$;

REVOKE ALL ON FUNCTION public.list_active_insurance_partners(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_active_insurance_partners(UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.list_active_insurance_partners IS
  'Devuelve aseguradoras activas. Si pet_id viene, filtra por especie + comuna del owner.';

-- ── 5. RPC compute_insurance_quote ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_insurance_quote(
  p_pet_id UUID,
  p_partner_slug TEXT
)
RETURNS TABLE (
  quote_id UUID,
  risk_score INT,
  age_years INT,
  monthly_premium_clp INT,
  annual_premium_clp INT,
  factors JSONB,
  partner_name TEXT,
  coverage_summary TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_pet RECORD;
  v_partner RECORD;
  v_risk_row RECORD;
  v_base_monthly INT;
  v_risk_mult NUMERIC := 1.0;
  v_age_mult NUMERIC := 1.0;
  v_monthly INT;
  v_annual INT;
  v_age_bucket TEXT;
  v_score_bucket TEXT;
  v_quote_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- 1. Cargar pet (con check ownership).
  SELECT * INTO v_pet FROM public.pets WHERE id = p_pet_id;
  IF v_pet IS NULL THEN
    RAISE EXCEPTION 'Pet not found';
  END IF;
  IF v_pet.owner_id != v_user
    AND NOT EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = v_user AND is_active = true)
  THEN
    RAISE EXCEPTION 'no permission';
  END IF;

  -- 2. Cargar partner activo.
  SELECT * INTO v_partner
  FROM public.insurance_partners
  WHERE slug = p_partner_slug AND is_active = true;
  IF v_partner IS NULL THEN
    RAISE EXCEPTION 'Partner % no encontrado o inactivo', p_partner_slug;
  END IF;

  -- 3. Calcular risk score (RPC existente).
  SELECT * INTO v_risk_row
  FROM public.calculate_pet_risk_score(p_pet_id)
  LIMIT 1;

  IF v_risk_row IS NULL THEN
    RAISE EXCEPTION 'No se pudo calcular risk score';
  END IF;

  -- 4. Aplicar multiplicadores.
  v_base_monthly := COALESCE((v_partner.pricing_model->>'base_monthly_clp')::INT, 24900);

  -- Risk score buckets: 90+, 80+, 70+, 60+, 50+
  v_score_bucket := CASE
    WHEN v_risk_row.risk_score >= 90 THEN '90'
    WHEN v_risk_row.risk_score >= 80 THEN '80'
    WHEN v_risk_row.risk_score >= 70 THEN '70'
    WHEN v_risk_row.risk_score >= 60 THEN '60'
    ELSE '50'
  END;
  v_risk_mult := COALESCE(
    (v_partner.pricing_model->'risk_score_multiplier'->>v_score_bucket)::NUMERIC,
    1.0
  );

  -- Age buckets
  v_age_bucket := CASE
    WHEN v_risk_row.age_years IS NULL THEN '2-7'
    WHEN v_risk_row.age_years < 2 THEN '0-2'
    WHEN v_risk_row.age_years < 7 THEN '2-7'
    WHEN v_risk_row.age_years < 10 THEN '7-10'
    ELSE '10+'
  END;
  v_age_mult := COALESCE(
    (v_partner.pricing_model->'age_multiplier'->>v_age_bucket)::NUMERIC,
    1.0
  );

  v_monthly := ROUND(v_base_monthly * v_risk_mult * v_age_mult)::INT;
  v_annual := v_monthly * 12;

  -- 5. Persistir quote.
  INSERT INTO public.insurance_quotes
    (pet_id, owner_id, partner_id, risk_score, age_years, monthly_premium_clp, annual_premium_clp,
     pricing_snapshot, factors)
  VALUES
    (p_pet_id, v_pet.owner_id, v_partner.id, v_risk_row.risk_score, v_risk_row.age_years,
     v_monthly, v_annual, v_partner.pricing_model, v_risk_row.factors)
  RETURNING id INTO v_quote_id;

  RETURN QUERY SELECT
    v_quote_id,
    v_risk_row.risk_score,
    v_risk_row.age_years,
    v_monthly,
    v_annual,
    v_risk_row.factors,
    v_partner.display_name,
    (v_partner.pricing_model->>'coverage_summary')::TEXT;
END $$;

REVOKE ALL ON FUNCTION public.compute_insurance_quote(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_insurance_quote(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.compute_insurance_quote IS
  'Genera cotizacion real-time para un pet + partner. Reusa calculate_pet_risk_score. Persiste quote en insurance_quotes para tracking.';

-- ── 6. Seed inicial de 3 aseguradoras ejemplo (inactivas) ─────────────
INSERT INTO public.insurance_partners
  (slug, display_name, legal_name, contact_email, partner_url, pricing_model, is_active, display_order, notes)
VALUES
  (
    'sura-pet',
    'Sura Pet',
    'Compañia de Seguros Sura S.A.',
    'partnerships@sura.cl',
    'https://www.sura.cl',
    '{
      "base_monthly_clp": 28900,
      "risk_score_multiplier": {"90": 0.85, "80": 1.0, "70": 1.18, "60": 1.4, "50": 1.7},
      "age_multiplier": {"0-2": 0.9, "2-7": 1.0, "7-10": 1.35, "10+": 1.7},
      "coverage_summary": "Hospitalizacion + cirugia + emergencia 24/7. Tope anual $3M CLP. Deducible $50k por evento."
    }'::jsonb,
    false, 10,
    'Inactivo hasta firma comercial. Pricing referencial.'
  ),
  (
    'bci-pet',
    'BCI Seguros Pet',
    'BCI Seguros S.A.',
    'partnerships@bci.cl',
    'https://www.bciseguros.cl',
    '{
      "base_monthly_clp": 24900,
      "risk_score_multiplier": {"90": 0.9, "80": 1.0, "70": 1.15, "60": 1.35, "50": 1.6},
      "age_multiplier": {"0-2": 0.9, "2-7": 1.0, "7-10": 1.3, "10+": 1.6},
      "coverage_summary": "Cobertura basica + extension hospitalizacion. Tope anual $2.5M CLP."
    }'::jsonb,
    false, 20,
    'Inactivo hasta firma comercial.'
  ),
  (
    'mapfre-pet',
    'Mapfre Pet',
    'Mapfre Compañia de Seguros Generales de Chile S.A.',
    'partnerships@mapfre.cl',
    'https://www.mapfre.cl',
    '{
      "base_monthly_clp": 22900,
      "risk_score_multiplier": {"90": 0.9, "80": 1.0, "70": 1.2, "60": 1.4, "50": 1.65},
      "age_multiplier": {"0-2": 0.95, "2-7": 1.0, "7-10": 1.3, "10+": 1.55},
      "coverage_summary": "Plan basico con consulta vet incluida. Tope anual $2M CLP."
    }'::jsonb,
    false, 30,
    'Inactivo hasta firma comercial.'
  )
ON CONFLICT (slug) DO NOTHING;

COMMIT;
