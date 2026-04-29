-- 2026-04-30 (Inbound B2B kinds: gobierno + banca + edificios + longtail)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Cierra los motores #4 (Gobierno), #5 (Banca), #6 (Edificios), #7
-- (Long-tail) del Revenue Master Plan via lead capture inbound. Estos
-- son ciclos de venta largos B2B que no se cotizan en vivo: el partner
-- aplica via /aplicar?tipo=<kind> y nuestro pipeline comercial los
-- contacta. Toda la informacion estructurada se guarda en pitch_applications.payload.
--
-- Cambios:
--   1. Agregar 4 kinds al CHECK constraint de pitch_applications.kind:
--      - 'gobierno_municipio' (Motor #4: SAG · municipios · Subdere)
--      - 'banca' (Motor #5: BCI · Santander · Itau · BancoEstado · Falabella)
--      - 'edificios' (Motor #6: inmobiliarias · administradoras · HOAs)
--      - 'longtail' (Motor #7: aerolineas · hoteles · academia · hardware ·
--                   plataformas · cremacion)

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.pitch_applications') IS NULL THEN
    RAISE EXCEPTION 'tabla pitch_applications no existe';
  END IF;

  -- Drop constraint anterior.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname LIKE '%pitch_applications_kind_check%'
  ) THEN
    ALTER TABLE public.pitch_applications
      DROP CONSTRAINT IF EXISTS pitch_applications_kind_check;
  END IF;

  ALTER TABLE public.pitch_applications
    ADD CONSTRAINT pitch_applications_kind_check
    CHECK (kind IN (
      'corfo',
      'startup_chile',
      'paw_companys',
      'angels_vc',
      'refugio',
      'paw_partners',
      'vet',
      'paw_voices',
      'b2b_api',
      'gobierno_municipio',
      'banca',
      'edificios',
      'longtail',
      'otro'
    ));
END $$;

COMMIT;
