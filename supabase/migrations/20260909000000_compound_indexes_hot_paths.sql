-- 2026-04-28 (Sprint 1 P1 PERF — compound indexes hot paths)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- Defensive bulletproof: cada bloque DO chequea con `to_regclass` que la
-- tabla exista antes de crear el indice. No falla si una tabla fue
-- eliminada en cleanups previos (ej: messages, feed_posts).
--
-- Contexto: la app crece con miles de filas por user. Las queries con
-- `.eq('a').order('b')` necesitan indices compuestos `(a, b)` para evitar
-- table scan + sort. Storage trade-off minimo (~10MB con 100k filas total).

-- ─── medical_records (owner_id, visit_date DESC) ───
-- Hot query: useProAnalytics + /reportes mensual.
DO $$
BEGIN
  IF to_regclass('public.medical_records') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_medical_records_owner_visit_date
      ON public.medical_records (owner_id, visit_date DESC);
  END IF;
END $$;

-- ─── vet_bookings (owner_id, scheduled_date DESC) ───
-- Hot query: useMyBookingsV2 (lista del dueno).
DO $$
BEGIN
  IF to_regclass('public.vet_bookings') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_vet_bookings_owner_scheduled
      ON public.vet_bookings (owner_id, scheduled_date DESC);

    -- Provider inbox: status filter + scheduled_date order.
    CREATE INDEX IF NOT EXISTS idx_vet_bookings_provider_status_scheduled
      ON public.vet_bookings (service_provider_id, status, scheduled_date DESC);
  END IF;
END $$;

-- ─── notifications (user_id, created_at DESC) WHERE !is_read ───
-- Partial index: solo no-leidas. ~10x mas chico que full.
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
      ON public.notifications (user_id, created_at DESC)
      WHERE is_read = false;
  END IF;
END $$;

-- ─── pet_reminders (pet_id, due_date) WHERE !is_completed ───
-- Hot query: timeline de mascota especifica.
DO $$
BEGIN
  IF to_regclass('public.pet_reminders') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_pet_reminders_pet_due
      ON public.pet_reminders (pet_id, due_date)
      WHERE is_completed = false;
  END IF;
END $$;

-- ─── pet_routines (pet_id, time_of_day) WHERE is_active ───
-- Hot query: useRoutines con filterPetId.
DO $$
BEGIN
  IF to_regclass('public.pet_routines') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_pet_routines_pet_time
      ON public.pet_routines (pet_id, time_of_day)
      WHERE is_active = true;
  END IF;
END $$;

-- ─── routine_completions (routine_id, completed_date DESC) ───
-- Hot query: weekly stats `.in('routine_id', ids).gte/lte('completed_date')`.
DO $$
BEGIN
  IF to_regclass('public.routine_completions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_routine_completions_routine_date
      ON public.routine_completions (routine_id, completed_date DESC);
  END IF;
END $$;

-- ─── messages (conversation_id, created_at DESC) ───
-- Hot query: useMessages. Skip si fue eliminada en cleanup previo.
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
      ON public.messages (conversation_id, created_at DESC);
  END IF;
END $$;

-- ─── posts (created_at DESC) ───
-- Hot query: feed infinito. La tabla canonica es `posts` (no `feed_posts`).
-- No tiene columna is_published; el feed se ordena por created_at puro.
DO $$
BEGIN
  IF to_regclass('public.posts') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_posts_created
      ON public.posts (created_at DESC);
  END IF;
END $$;

-- ─── pet_timeline_events (pet_id, event_date DESC) ───
-- Hot query: ficha clinica timeline.
DO $$
BEGIN
  IF to_regclass('public.pet_timeline_events') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_pet_timeline_events_pet_date
      ON public.pet_timeline_events (pet_id, event_date DESC);
  END IF;
END $$;

-- ─── adoption_posts (status, created_at DESC) ───
-- Hot query: feed adopcion.
DO $$
BEGIN
  IF to_regclass('public.adoption_posts') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_adoption_posts_status_created
      ON public.adoption_posts (status, created_at DESC);
  END IF;
END $$;

-- ─── booking_events (booking_id, created_at DESC) ───
-- Hot query: drawer detail booking (audit trail).
DO $$
BEGIN
  IF to_regclass('public.booking_events') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_booking_events_booking_created
      ON public.booking_events (booking_id, created_at DESC);
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────
-- Verificacion (correr en SQL Editor manualmente):
--
-- 1) Ver todos los indices nuevos del lote (los que efectivamente se crearon):
--    SELECT schemaname, tablename, indexname,
--           pg_size_pretty(pg_relation_size(indexrelid)) AS size
--    FROM pg_stat_user_indexes
--    WHERE indexrelname IN (
--      'idx_medical_records_owner_visit_date',
--      'idx_vet_bookings_owner_scheduled',
--      'idx_vet_bookings_provider_status_scheduled',
--      'idx_notifications_user_unread',
--      'idx_pet_reminders_pet_due',
--      'idx_pet_routines_pet_time',
--      'idx_routine_completions_routine_date',
--      'idx_messages_conversation_created',
--      'idx_posts_created',
--      'idx_pet_timeline_events_pet_date',
--      'idx_adoption_posts_status_created',
--      'idx_booking_events_booking_created'
--    );
--
-- 2) Ver si el planificador los usa:
--    EXPLAIN ANALYZE SELECT * FROM medical_records
--    WHERE owner_id = '<tu-uuid>' ORDER BY visit_date DESC LIMIT 20;
--    -> deberias ver "Index Scan using idx_medical_records_owner_visit_date".
--
-- Rollback (no recomendado, indices son inocuos):
--   DROP INDEX IF EXISTS public.idx_medical_records_owner_visit_date;
--   DROP INDEX IF EXISTS public.idx_vet_bookings_owner_scheduled;
--   ... (uno por uno, mismos nombres del CREATE INDEX arriba)
-- ──────────────────────────────────────────────────────────────────
