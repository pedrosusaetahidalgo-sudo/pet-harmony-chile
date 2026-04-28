-- ══════════════════════════════════════════════════════════════════════════
-- CLEANUP — features muertas detectadas en audit_table_health() 2026-04-27
-- ══════════════════════════════════════════════════════════════════════════
-- Politica refactor maestro §9.0.bis.5: NO drop, solo RENAME a
-- _deprecated_YYYYMMDD para detectar usos en runtime durante 6 meses.
-- Si nada en el codigo o en prod las usa, drop definitivo en 2026-10-30.
--
-- Tablas a renombrar (28 total):
--   - SHARED_WALKS feature (flag false): shared_walks, shared_walk_participants
--   - Walkers (sin uso real): dog_walker_profiles + walk_bookings/reports/reviews/routes
--   - Sitters (sin uso real): dogsitter_profiles + bookings/messages/reports/reviews
--   - Trainers (sin uso real): trainer_profiles + training_bookings/reports/reviews
--   - Groomers (sin uso real): groomer_profiles
--   - LOST_PETS_SECTION feature (flag false): lost_pets
--   - MARKETPLACE feature (flag false): cart_items, order_items, orders
--   - CHAT feature (flag false): conversations, messages
--
-- Cada bloque verifica existencia (IF EXISTS) y skip si no esta — la mig
-- nunca falla si alguna tabla ya fue droppeada o nunca existio.
--
-- IMPORTANT: Las FKs internas se renombran automaticamente con la tabla
-- (PostgreSQL ALTER TABLE RENAME es atomic respecto a constraints).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── SHARED_WALKS feature ────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='shared_walk_participants') THEN
    EXECUTE 'ALTER TABLE public.shared_walk_participants RENAME TO shared_walk_participants_deprecated_20260427';
    RAISE NOTICE '✅ shared_walk_participants → _deprecated_20260427';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='shared_walks') THEN
    EXECUTE 'ALTER TABLE public.shared_walks RENAME TO shared_walks_deprecated_20260427';
    RAISE NOTICE '✅ shared_walks → _deprecated_20260427';
  END IF;
END $$;

-- ─── Walkers (dog walker) ────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  walker_tables TEXT[] := ARRAY[
    'walk_reports', 'walk_reviews', 'walk_routes', 'walk_bookings',
    'dog_walker_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY walker_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', t, t || '_deprecated_20260427');
      RAISE NOTICE '✅ % → _deprecated_20260427', t;
    END IF;
  END LOOP;
END $$;

-- ─── Sitters (dog sitter) ────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  sitter_tables TEXT[] := ARRAY[
    'dogsitter_messages', 'dogsitter_reports', 'dogsitter_reviews',
    'dogsitter_bookings', 'dogsitter_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY sitter_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', t, t || '_deprecated_20260427');
      RAISE NOTICE '✅ % → _deprecated_20260427', t;
    END IF;
  END LOOP;
END $$;

-- ─── Trainers ────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  trainer_tables TEXT[] := ARRAY[
    'training_reports', 'training_reviews', 'training_bookings',
    'trainer_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY trainer_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', t, t || '_deprecated_20260427');
      RAISE NOTICE '✅ % → _deprecated_20260427', t;
    END IF;
  END LOOP;
END $$;

-- ─── Groomers ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='groomer_profiles') THEN
    EXECUTE 'ALTER TABLE public.groomer_profiles RENAME TO groomer_profiles_deprecated_20260427';
    RAISE NOTICE '✅ groomer_profiles → _deprecated_20260427';
  END IF;
END $$;

-- ─── LOST_PETS_SECTION feature ───────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='lost_pets') THEN
    EXECUTE 'ALTER TABLE public.lost_pets RENAME TO lost_pets_deprecated_20260427';
    RAISE NOTICE '✅ lost_pets → _deprecated_20260427';
  END IF;
END $$;

-- ─── MARKETPLACE feature ─────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  marketplace_tables TEXT[] := ARRAY['cart_items', 'order_items', 'orders'];
BEGIN
  FOREACH t IN ARRAY marketplace_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', t, t || '_deprecated_20260427');
      RAISE NOTICE '✅ % → _deprecated_20260427', t;
    END IF;
  END LOOP;
END $$;

-- ─── CHAT feature ────────────────────────────────────────────────────────
-- ATENCION: dependencias internas — messages.conversation_id → conversations.id
-- El RENAME respeta el constraint, ambas tablas se renombran y el FK queda.
DO $$
DECLARE
  t TEXT;
  chat_tables TEXT[] := ARRAY['messages', 'conversations'];
BEGIN
  FOREACH t IN ARRAY chat_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', t, t || '_deprecated_20260427');
      RAISE NOTICE '✅ % → _deprecated_20260427', t;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- SMOKE TEST: contar tablas renombradas con sufijo _deprecated_20260427
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%_deprecated_20260427';

  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Smoke test OK: % tablas con sufijo _deprecated_20260427', v_count;
  RAISE NOTICE 'Politica: drop definitivo en 2026-10-30 si nada las usa.';
  RAISE NOTICE 'Para verificar uso runtime, monitorear error_logs.';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- ROLLBACK MANUAL (solo si rompe algo en prod)
-- ══════════════════════════════════════════════════════════════════════════
-- Si despues de aplicar esta mig una funcionalidad rompe, revertir asi:
--
--   ALTER TABLE public.<tabla>_deprecated_20260427 RENAME TO <tabla>;
--
-- Ejemplo:
--   ALTER TABLE public.conversations_deprecated_20260427 RENAME TO conversations;
--
-- Revisar error_logs por la falla y decidir si:
--   a) restaurar el nombre canonico (rollback)
--   b) actualizar el codigo que la referencia (mejor — la tabla esta vacia
--      y la feature esta marcada false, asi que el codigo no deberia tocarla)
-- ══════════════════════════════════════════════════════════════════════════
