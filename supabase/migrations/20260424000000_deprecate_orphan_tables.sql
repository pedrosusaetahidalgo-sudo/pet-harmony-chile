-- ══════════════════════════════════════════════════════════════════════════
-- DEPRECATE ORPHAN TABLES — Refactor Maestro 2026-04-23 Fase 0
-- ══════════════════════════════════════════════════════════════════════════
-- Contexto: plan maestro (docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md
-- seccion 9.0.bis) detecto 4 tablas huerfanas en DB que existen pero el
-- codigo NO las referencia (solo aparecen en types.ts generado de Supabase).
--
-- Son intentos previos de modelar conceptos que ya se resolvieron con
-- otras tablas. Las renombramos con sufijo _deprecated_20260424 para:
--   - Mantener la data historica si alguna vez tuvo algo
--   - Liberar el nombre original para uso futuro
--   - Flagear que NO se usan activamente
--   - Permitir DROP definitivo en +6 meses (ver _pending/HIDDEN_FEATURES_REVIEW_2026_11_23.md)
--
-- Tablas renombradas:
--   1. comprehensive_medical_records → duplica medical_records, nunca adoptada
--   2. vet_pet_relationships       → tercer intento vet↔pet, ya existe pet_vet_links
--   3. points_history              → duplica paw_point_transactions
--   4. virtual_routes              → feature experimental abandonada
--
-- Reversible: sí, con ALTER TABLE ... RENAME TO inverso.
-- Idempotente: usa DO block con checks para re-ejecucion segura.
-- NO borra data. Solo renombra.
--
-- Aplicar MANUALMENTE desde Supabase Dashboard > SQL Editor.
-- Backup tomado por Pedro antes de aplicar (confirmado 2026-04-23).
-- ══════════════════════════════════════════════════════════════════════════

-- 1. comprehensive_medical_records
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables
             WHERE schemaname = 'public'
               AND tablename = 'comprehensive_medical_records') THEN
    ALTER TABLE public.comprehensive_medical_records
      RENAME TO comprehensive_medical_records_deprecated_20260424;
    RAISE NOTICE 'Renamed: comprehensive_medical_records → _deprecated_20260424';
  ELSE
    RAISE NOTICE 'Skip: comprehensive_medical_records no existe o ya fue renombrada';
  END IF;
END $$;

-- 2. vet_pet_relationships
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables
             WHERE schemaname = 'public'
               AND tablename = 'vet_pet_relationships') THEN
    ALTER TABLE public.vet_pet_relationships
      RENAME TO vet_pet_relationships_deprecated_20260424;
    RAISE NOTICE 'Renamed: vet_pet_relationships → _deprecated_20260424';
  ELSE
    RAISE NOTICE 'Skip: vet_pet_relationships no existe o ya fue renombrada';
  END IF;
END $$;

-- 3. points_history
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables
             WHERE schemaname = 'public'
               AND tablename = 'points_history') THEN
    ALTER TABLE public.points_history
      RENAME TO points_history_deprecated_20260424;
    RAISE NOTICE 'Renamed: points_history → _deprecated_20260424';
  ELSE
    RAISE NOTICE 'Skip: points_history no existe o ya fue renombrada';
  END IF;
END $$;

-- 4. virtual_routes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables
             WHERE schemaname = 'public'
               AND tablename = 'virtual_routes') THEN
    ALTER TABLE public.virtual_routes
      RENAME TO virtual_routes_deprecated_20260424;
    RAISE NOTICE 'Renamed: virtual_routes → _deprecated_20260424';
  ELSE
    RAISE NOTICE 'Skip: virtual_routes no existe o ya fue renombrada';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Verificacion post-apply
-- ──────────────────────────────────────────────────────────────────────────
-- Ejecutar en Supabase SQL Editor y verificar:
--
--   SELECT tablename, (SELECT COUNT(*) FROM information_schema.columns
--                      WHERE table_name = pg_tables.tablename) AS num_columns
--   FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename LIKE '%_deprecated_20260424'
--   ORDER BY tablename;
--
-- Debe listar las 4 tablas renombradas. Si alguna no aparece, es porque
-- no existia en tu instancia (puede ser normal).
-- ──────────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────────
-- Rollback (si algo sale mal, ejecutar inverso)
-- ──────────────────────────────────────────────────────────────────────────
-- ALTER TABLE public.comprehensive_medical_records_deprecated_20260424
--   RENAME TO comprehensive_medical_records;
-- ALTER TABLE public.vet_pet_relationships_deprecated_20260424
--   RENAME TO vet_pet_relationships;
-- ALTER TABLE public.points_history_deprecated_20260424
--   RENAME TO points_history;
-- ALTER TABLE public.virtual_routes_deprecated_20260424
--   RENAME TO virtual_routes;
-- ──────────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────────
-- Paso siguiente (despues de aplicar esta mig):
-- Pedro regenera types.ts desde terminal:
--   npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd
--     > src/integrations/supabase/types.ts
--
-- Luego verifica que nada compila roto:
--   npx tsc -b
--
-- Si hay errores, es porque algun archivo de src/ referencia una tabla
-- renombrada — habria que encontrarlo y corregirlo. Si no hay errores,
-- commit del types.ts actualizado.
-- ──────────────────────────────────────────────────────────────────────────
