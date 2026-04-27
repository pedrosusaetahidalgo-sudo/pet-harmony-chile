-- ══════════════════════════════════════════════════════════════════════════
-- Renames de tablas huerfanas a _deprecated (Refactor Maestro §9.0.bis.5)
-- ══════════════════════════════════════════════════════════════════════════
-- 4 tablas detectadas como huerfanas en auditoria del plan:
--   - comprehensive_medical_records (alternativa nunca adoptada a medical_records)
--   - vet_pet_relationships (3er intento de modelar vet↔mascota; canon: pet_co_owners)
--   - points_history (alternativa a paw_point_transactions)
--   - virtual_routes (feature experimental abandonada)
--
-- Politica:
--   - NO drop. Solo rename para detectar uso del codigo en runtime.
--   - Si algo en el codigo aun referencia, fallaria con tabla no encontrada
--     y nos enteramos antes de borrar definitivamente.
--   - Eliminacion definitiva: en 6 meses (2026-10-04+) tras revisar logs.
--
-- Las 4 tablas pueden no existir en el env de Pedro (algunas pueden haberse
-- creado y borrado historicamente). Por eso usamos DO blocks con check
-- previo — la mig nunca falla si una tabla no esta.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. comprehensive_medical_records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comprehensive_medical_records'
  ) THEN
    EXECUTE 'ALTER TABLE public.comprehensive_medical_records ' ||
            'RENAME TO comprehensive_medical_records_deprecated_20260427';
    RAISE NOTICE 'Renombrado: comprehensive_medical_records → _deprecated_20260427';
  ELSE
    RAISE NOTICE 'comprehensive_medical_records no existe — skip';
  END IF;
END $$;

-- 2. vet_pet_relationships
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vet_pet_relationships'
  ) THEN
    EXECUTE 'ALTER TABLE public.vet_pet_relationships ' ||
            'RENAME TO vet_pet_relationships_deprecated_20260427';
    RAISE NOTICE 'Renombrado: vet_pet_relationships → _deprecated_20260427';
  ELSE
    RAISE NOTICE 'vet_pet_relationships no existe — skip';
  END IF;
END $$;

-- 3. points_history
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'points_history'
  ) THEN
    EXECUTE 'ALTER TABLE public.points_history ' ||
            'RENAME TO points_history_deprecated_20260427';
    RAISE NOTICE 'Renombrado: points_history → _deprecated_20260427';
  ELSE
    RAISE NOTICE 'points_history no existe — skip';
  END IF;
END $$;

-- 4. virtual_routes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'virtual_routes'
  ) THEN
    EXECUTE 'ALTER TABLE public.virtual_routes ' ||
            'RENAME TO virtual_routes_deprecated_20260427';
    RAISE NOTICE 'Renombrado: virtual_routes → _deprecated_20260427';
  ELSE
    RAISE NOTICE 'virtual_routes no existe — skip';
  END IF;
END $$;

COMMIT;

-- Smoke test: si alguna se renombro, debe aparecer con sufijo _deprecated
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%_deprecated_20260427';

  RAISE NOTICE 'Smoke test OK: % tablas renombradas con sufijo _deprecated_20260427', v_count;
END $$;
