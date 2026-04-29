-- 2026-04-30 (Pricing defaults seed · cierra audit-readiness 4to batch)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Cuando llegue el primer partner B2B real, Pedro tendria que setear
-- monthly_fee_clp y commission_config manualmente porque hoy:
--   - b2b_api_keys.monthly_fee_clp default = 0
--   - insurance_partners.commission_config tiene defaults pero no se
--     aplicaron a los seeds existentes
--   - retail_partners.commission_config idem
--
-- Esta mig:
-- 1. Pre-popula monthly_fee_clp por tier en b2b_api_keys (free/research/
--    enterprise) usando los precios standard del pitch (USD ~$50/$200/$2k).
-- 2. Asegura que los 3 insurance seeds (Sura/BCI/Mapfre) tengan
--    commission_config setteado con $15.000/lead default.
-- 3. Asegura que los 3 retail seeds (Master Dog/Puppis/Pet Star) tengan
--    commission_config con click_pct=5 + conversion_pct=10.
-- 4. Agrega trigger BEFORE INSERT en b2b_api_keys que pre-llena
--    monthly_fee_clp segun tier al crear key nueva.

BEGIN;

-- ── 1. Backfill b2b_api_keys.monthly_fee_clp por tier ─────────────────
-- Pricing standard pitch (CLP convertido USD ~ x900 + redondeo):
--   free:       $0 (tesis academicas, prototipos)
--   research:   $49.000 (~$54 USD/mes — universidades, INIA)
--   enterprise: $200.000 (~$220 USD/mes — aseguradoras, pharma con
--               integracion productiva. Real deal price es a medida,
--               este es el floor para no regalarlo)
UPDATE public.b2b_api_keys
SET monthly_fee_clp = CASE tier
  WHEN 'free' THEN 0
  WHEN 'research' THEN 49000
  WHEN 'enterprise' THEN 200000
  ELSE 0
END
WHERE monthly_fee_clp = 0; -- Solo updates donde aun no se setteo manual

-- ── 2. Trigger pre-fill monthly_fee_clp en INSERT ─────────────────────
CREATE OR REPLACE FUNCTION public.b2b_api_keys_set_default_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.monthly_fee_clp = 0 THEN
    NEW.monthly_fee_clp := CASE NEW.tier
      WHEN 'free' THEN 0
      WHEN 'research' THEN 49000
      WHEN 'enterprise' THEN 200000
      ELSE 0
    END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_b2b_api_keys_default_fee ON public.b2b_api_keys;
CREATE TRIGGER trg_b2b_api_keys_default_fee
  BEFORE INSERT ON public.b2b_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.b2b_api_keys_set_default_fee();

-- Smoke test del trigger (regla 9.2.1 CLAUDE.md)
DO $$
DECLARE
  v_test_id UUID;
  v_test_fee INT;
BEGIN
  -- Insert dummy con tier=research, monthly_fee_clp=0 → trigger debe
  -- llenarlo a 49000.
  INSERT INTO public.b2b_api_keys (
    key_hash, key_prefix, name, contact_email, tier, scopes,
    rate_limit_per_hour, is_active, monthly_fee_clp
  ) VALUES (
    'smoke-test-hash-' || gen_random_uuid()::text,
    'pf_smoke',
    '__smoke_test__',
    'smoke@test.invalid',
    'research',
    ARRAY['breed_stats']::TEXT[],
    100,
    false,
    0
  ) RETURNING id, monthly_fee_clp INTO v_test_id, v_test_fee;

  IF v_test_fee != 49000 THEN
    RAISE EXCEPTION 'Trigger no llenó monthly_fee_clp: esperado 49000, got %', v_test_fee;
  END IF;

  -- Cleanup
  DELETE FROM public.b2b_api_keys WHERE id = v_test_id;
EXCEPTION WHEN OTHERS THEN
  -- Cleanup defensivo
  DELETE FROM public.b2b_api_keys WHERE id = v_test_id;
  RAISE EXCEPTION 'b2b_api_keys trigger smoke failed: %', SQLERRM;
END $$;

-- ── 3. Backfill insurance_partners.commission_config ──────────────────
-- Precio default: $15.000 CLP por qualified lead (con email + telefono).
-- Min monthly: $0 (no hay piso). Para deal real, ajustar manualmente.
UPDATE public.insurance_partners
SET commission_config = jsonb_build_object(
  'model', 'per_qualified_lead',
  'amount_clp', 15000,
  'min_monthly_clp', 0,
  'notes', 'Default 2026-04-30. Ajustar al firmar contrato real con partner.'
)
WHERE commission_config IS NULL
   OR commission_config = '{}'::jsonb
   OR NOT (commission_config ? 'amount_clp');

-- ── 4. Backfill retail_partners.commission_config ─────────────────────
-- Default: 5% click_share + 10% sobre conversion_clp.
UPDATE public.retail_partners
SET commission_config = jsonb_build_object(
  'model', 'click_share',
  'click_pct', 5,
  'conversion_pct', 10,
  'min_monthly_clp', 0,
  'notes', 'Default 2026-04-30. Ajustar al firmar contrato real con partner.'
)
WHERE commission_config IS NULL
   OR commission_config = '{}'::jsonb
   OR NOT (commission_config ? 'conversion_pct');

COMMIT;

-- ── Verificacion post-mig ─────────────────────────────────────────────
DO $$
DECLARE
  v_insurance_unconfigured INT;
  v_retail_unconfigured INT;
BEGIN
  SELECT COUNT(*) INTO v_insurance_unconfigured
  FROM public.insurance_partners
  WHERE commission_config IS NULL OR NOT (commission_config ? 'amount_clp');

  SELECT COUNT(*) INTO v_retail_unconfigured
  FROM public.retail_partners
  WHERE commission_config IS NULL OR NOT (commission_config ? 'conversion_pct');

  IF v_insurance_unconfigured > 0 THEN
    RAISE NOTICE 'WARN: % insurance partners sin commission_config aun', v_insurance_unconfigured;
  END IF;
  IF v_retail_unconfigured > 0 THEN
    RAISE NOTICE 'WARN: % retail partners sin commission_config aun', v_retail_unconfigured;
  END IF;

  RAISE NOTICE 'Pricing defaults mig OK';
END $$;
