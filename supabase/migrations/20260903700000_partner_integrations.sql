-- ══════════════════════════════════════════════════════════════════════════
-- Partner integrations scaffolding (Refactor Maestro §7.4 + §2.8.2.bis)
-- ══════════════════════════════════════════════════════════════════════════
-- Tablas para cuando aparezcan los primeros partners retail/pharma/insurer
-- y necesitemos:
--   - Trackear deals firmados con cada partner (config + status comercial)
--   - Tracking de eventos generados desde el partner (referrals, scans,
--     fulfillment orders) para calcular comisiones
--   - Audit trail de quien generó cada evento y cuándo
--
-- 2 tablas:
--   partner_integrations  — config del deal (nombre, tipo, comisiones, etc)
--   partner_events        — eventos generados (referral, scan, fulfillment)
--
-- Sin partners firmados todavia. Estas tablas estan listas para que el
-- dia que se firme el primer deal, Pedro inserta una row en
-- partner_integrations + emite events desde el frontend / edge fns.
--
-- Privacy: SECURITY DEFINER en RPCs, RLS solo admin. Cada partner_event
-- referencia user_id + pet_id pero no expone PII al partner — solo IDs
-- internos. El partner ve sus events agregados via API B2B.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. partner_integrations: config del deal con cada partner
CREATE TABLE IF NOT EXISTS public.partner_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificacion del partner
  slug TEXT NOT NULL UNIQUE,             -- 'mathiesen', 'kiwoko', 'iki', 'mapfre-pet', etc
  name TEXT NOT NULL,                    -- "Mathiesen" / "iki"
  category TEXT NOT NULL CHECK (category IN (
    'retail',           -- §7.4 Mathiesen, Kiwoko, Pet Zone
    'insurance',        -- §7.2 iki, Mapfre Pet, Sura Pet
    'pharma',           -- §7.3 Zoetis, Elanco, MSD, Bayer
    'vet_chain',        -- §8.4.4 cadenas grandes con PIMS
    'shelter_partner',  -- ya existe adoption_centers; aca solo grandes integrados
    'other'
  )),
  -- Modelo comercial
  commission_pct NUMERIC(5,2),           -- 5.00 = 5% sobre GMV
  flat_fee_clp NUMERIC,                  -- Fee mensual fijo, si aplica
  contract_started_at DATE,
  contract_expires_at DATE,
  -- Auth para partner (cuando consume eventos via API)
  api_key_id UUID REFERENCES public.b2b_api_keys(id) ON DELETE SET NULL,
  -- Tracking
  status TEXT NOT NULL DEFAULT 'pilot' CHECK (status IN (
    'lead',           -- conversaciones iniciales
    'pilot',          -- piloto firmado, no escalado
    'active',         -- contrato live
    'paused',         -- temporal
    'churned'         -- terminado
  )),
  contact_email TEXT,
  contact_phone TEXT,
  -- Config arbitraria por partner (URLs, store IDs, branding, etc)
  config JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.partner_integrations IS
  'Refactor Maestro §7.4 + §2.8.2. Config de cada deal partner (retail / '
  'insurance / pharma / vet chain / shelter). Pedro inserta cuando firma '
  'primer deal.';

CREATE INDEX IF NOT EXISTS idx_partner_integrations_status
  ON public.partner_integrations(status, category);

ALTER TABLE public.partner_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_partner_integrations"
  ON public.partner_integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- 2. partner_events: eventos generados (referral, scan, fulfillment, etc)
CREATE TABLE IF NOT EXISTS public.partner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partner_integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'referral',         -- usuario fue referido al partner (click)
    'conversion',       -- el referral termino en compra/poliza/etc
    'scan',             -- §2.8.2 scanner fisico en partner location
    'fulfillment',      -- §7.4 partner cumple un pedido referido
    'commission_due',   -- evento financiero (la commission se calcula de esto)
    'commission_paid',  -- partner pago la commission
    'support_request'   -- evento de soporte/disputa
  )),
  -- Quien (usuario) y que (mascota)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  -- Detalles financieros (CLP)
  gmv_clp NUMERIC,
  commission_clp NUMERIC,
  -- ID externo del partner (orden, poliza, etc)
  external_ref TEXT,
  -- Schema por event_type
  data JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.partner_events IS
  'Refactor Maestro §7.4 + §8.3.3. Eventos generados con cada partner '
  '(referral, scan, fulfillment, commission). Usado para calcular MRR '
  'B2B + auditar comisiones.';

CREATE INDEX IF NOT EXISTS idx_partner_events_partner
  ON public.partner_events(partner_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_events_user
  ON public.partner_events(user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_events_type_time
  ON public.partner_events(event_type, occurred_at DESC);

ALTER TABLE public.partner_events ENABLE ROW LEVEL SECURITY;

-- Solo admin lee directamente. Para que partners vean sus events, usar
-- API B2B endpoint dedicado (futuro, requiere scope partner_events).
CREATE POLICY "admin_full_access_partner_events"
  ON public.partner_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Owner ve sus propios eventos (transparencia: que partner sabe que de mi)
CREATE POLICY "owners_read_their_partner_events"
  ON public.partner_events FOR SELECT
  USING (user_id = auth.uid());

-- 3. RPC para insertar evento (frontend / edge fn). Validacion + idempotency
CREATE OR REPLACE FUNCTION public.record_partner_event(
  p_partner_slug TEXT,
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_pet_id UUID DEFAULT NULL,
  p_gmv_clp NUMERIC DEFAULT NULL,
  p_commission_clp NUMERIC DEFAULT NULL,
  p_external_ref TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id UUID;
  v_event_id UUID;
BEGIN
  -- Resolver partner por slug
  SELECT id INTO v_partner_id
  FROM public.partner_integrations
  WHERE slug = p_partner_slug AND status IN ('pilot', 'active');

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'Partner % no esta activo o no existe', p_partner_slug;
  END IF;

  -- Validar event_type
  IF p_event_type NOT IN (
    'referral', 'conversion', 'scan', 'fulfillment',
    'commission_due', 'commission_paid', 'support_request'
  ) THEN
    RAISE EXCEPTION 'event_type invalido: %', p_event_type;
  END IF;

  -- Idempotencia best-effort: si external_ref + event_type repiten en 24h,
  -- devolver el id existente sin insertar duplicado
  IF p_external_ref IS NOT NULL THEN
    SELECT id INTO v_event_id
    FROM public.partner_events
    WHERE partner_id = v_partner_id
      AND event_type = p_event_type
      AND external_ref = p_external_ref
      AND occurred_at >= NOW() - INTERVAL '24 hours'
    LIMIT 1;
    IF v_event_id IS NOT NULL THEN
      RETURN v_event_id;
    END IF;
  END IF;

  INSERT INTO public.partner_events (
    partner_id, event_type, user_id, pet_id,
    gmv_clp, commission_clp, external_ref, data
  )
  VALUES (
    v_partner_id, p_event_type, p_user_id, p_pet_id,
    p_gmv_clp, p_commission_clp, p_external_ref, p_data
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END $$;

REVOKE ALL ON FUNCTION public.record_partner_event(TEXT, TEXT, UUID, UUID, NUMERIC, NUMERIC, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_partner_event(TEXT, TEXT, UUID, UUID, NUMERIC, NUMERIC, TEXT, JSONB) TO authenticated, service_role;

COMMENT ON FUNCTION public.record_partner_event(TEXT, TEXT, UUID, UUID, NUMERIC, NUMERIC, TEXT, JSONB) IS
  'Insert helper para partner_events con validacion de partner activo + '
  'idempotencia por (partner, event_type, external_ref) en ventana 24h.';

-- 4. Vista materializada con MRR por partner (para AdminProjectHealth)
CREATE OR REPLACE VIEW public.partner_mrr_summary AS
SELECT
  pi.id AS partner_id,
  pi.slug,
  pi.name,
  pi.category,
  pi.status,
  COUNT(*) FILTER (
    WHERE pe.event_type = 'commission_due'
      AND pe.occurred_at >= NOW() - INTERVAL '30 days'
  )::INT AS events_30d,
  COALESCE(SUM(
    pe.commission_clp
  ) FILTER (
    WHERE pe.event_type = 'commission_due'
      AND pe.occurred_at >= NOW() - INTERVAL '30 days'
  ), 0) AS commission_pending_clp_30d,
  COALESCE(SUM(
    pe.commission_clp
  ) FILTER (
    WHERE pe.event_type = 'commission_paid'
      AND pe.occurred_at >= NOW() - INTERVAL '30 days'
  ), 0) AS commission_paid_clp_30d
FROM public.partner_integrations pi
LEFT JOIN public.partner_events pe ON pe.partner_id = pi.id
GROUP BY pi.id, pi.slug, pi.name, pi.category, pi.status;

GRANT SELECT ON public.partner_mrr_summary TO authenticated;

COMMENT ON VIEW public.partner_mrr_summary IS
  'MRR por partner para AdminProjectHealth. Calcula commission_pending vs '
  'paid en ultimos 30d. Refactor Maestro §8.3.3.';

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'partner_integrations';
  IF NOT FOUND THEN RAISE EXCEPTION 'partner_integrations no creada'; END IF;

  PERFORM 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'partner_events';
  IF NOT FOUND THEN RAISE EXCEPTION 'partner_events no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'record_partner_event';
  IF NOT FOUND THEN RAISE EXCEPTION 'record_partner_event no creada'; END IF;

  PERFORM 1 FROM information_schema.views
  WHERE table_schema = 'public' AND table_name = 'partner_mrr_summary';
  IF NOT FOUND THEN RAISE EXCEPTION 'partner_mrr_summary no creada'; END IF;

  RAISE NOTICE 'Smoke test OK: partner_integrations infra (§7.4 scaffolding)';
END $$;
