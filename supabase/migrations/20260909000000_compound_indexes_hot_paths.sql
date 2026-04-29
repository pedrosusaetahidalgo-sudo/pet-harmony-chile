-- 2026-04-28 (Sprint 1 P1 PERF — compound indexes hot paths)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- Defensive: todos `IF NOT EXISTS` para idempotencia.
--
-- Contexto: la app crece con miles de filas por user. Las queries con
-- `.eq('a').order('b')` necesitan indices compuestos `(a, b)` para evitar
-- table scan + sort. Los indices simples por columna ya existen pero el
-- planificador puede elegir un sequential scan + sort si el indice simple
-- no cubre el ORDER BY.
--
-- Estos indices son DEFENSIVOS:
--   - Mejoran latencia con >1k filas por user (hoy somos pre-launch).
--   - No degradan: indices compuestos pueden servir tambien queries del
--     primer columna sola.
--   - Storage trade-off minimo (~10MB con 100k filas total).
--
-- No se eliminan los indices simples existentes — los compuestos los
-- complementan.

-- ─── medical_records ───
-- Hot query: useProAnalytics + /reportes mensual filtran por owner_id y
-- ordenan/agrupan por visit_date.
CREATE INDEX IF NOT EXISTS idx_medical_records_owner_visit_date
  ON public.medical_records (owner_id, visit_date DESC);

-- ─── vet_bookings ───
-- Hot query: useMyBookingsV2 (lista del dueno) — `.eq('owner_id').order('scheduled_date')`.
CREATE INDEX IF NOT EXISTS idx_vet_bookings_owner_scheduled
  ON public.vet_bookings (owner_id, scheduled_date DESC);

-- Hot query: provider inbox — `.eq('service_provider_id').eq('status').order('scheduled_date')`.
-- Ya existe idx_vet_bookings_service_provider; este compuesto cubre filtros
-- combinados que el simple no resuelve eficientemente con miles de bookings.
CREATE INDEX IF NOT EXISTS idx_vet_bookings_provider_status_scheduled
  ON public.vet_bookings (service_provider_id, status, scheduled_date DESC);

-- ─── notifications ───
-- Partial index: solo no-leidas. La query principal es "ultimos 20 unread del user".
-- Indice partial es 10x mas chico que full y mas rapido para esta query especifica.
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- ─── pet_reminders ───
-- Hot query: timeline de mascota especifica `.eq('pet_id').order('due_date')`.
-- Ya existe idx_pet_reminders_pet_id (simple); el compuesto evita el sort.
CREATE INDEX IF NOT EXISTS idx_pet_reminders_pet_due
  ON public.pet_reminders (pet_id, due_date)
  WHERE is_completed = false;

-- ─── pet_routines ───
-- Hot query: useRoutines con filterPetId — `.eq('pet_id').order('time_of_day')`.
-- Ya existe idx_pet_routines_pet (simple). Compuesto evita re-sort.
CREATE INDEX IF NOT EXISTS idx_pet_routines_pet_time
  ON public.pet_routines (pet_id, time_of_day)
  WHERE is_active = true;

-- ─── routine_completions ───
-- Hot query: weekly stats — `.in('routine_id', ids).gte/lte('completed_date')`.
CREATE INDEX IF NOT EXISTS idx_routine_completions_routine_date
  ON public.routine_completions (routine_id, completed_date DESC);

-- ─── messages (chat) ───
-- Hot query: useMessages — `.eq('conversation_id').order('created_at')`.
-- Si la tabla tiene >10k mensajes por conversacion, este indice lo mantiene <1ms.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);

-- ─── feed_posts ───
-- Hot query: feed infinito — `.eq('is_published', true).order('created_at')`.
CREATE INDEX IF NOT EXISTS idx_feed_posts_published_created
  ON public.feed_posts (created_at DESC)
  WHERE is_published = true;

-- ─── pet_timeline_events ───
-- Hot query: ficha clinica timeline — `.eq('pet_id').order('event_date')`.
CREATE INDEX IF NOT EXISTS idx_pet_timeline_events_pet_date
  ON public.pet_timeline_events (pet_id, event_date DESC);

-- ─── adoption_posts ───
-- Hot query: feed adopcion — `.eq('status', 'disponible').order('created_at')`.
CREATE INDEX IF NOT EXISTS idx_adoption_posts_status_created
  ON public.adoption_posts (status, created_at DESC);

-- ─── booking_events (audit trail) ───
-- Hot query: drawer detail booking — `.eq('booking_id').order('created_at')`.
CREATE INDEX IF NOT EXISTS idx_booking_events_booking_created
  ON public.booking_events (booking_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────────
-- Verificacion (correr en SQL Editor manualmente):
--
-- 1) Ver todos los indices nuevos del lote:
--    SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
--    FROM pg_stat_user_indexes
--    WHERE indexrelname LIKE 'idx_%_%_%' AND indexrelid::regclass::text IN (
--      'idx_medical_records_owner_visit_date',
--      'idx_vet_bookings_owner_scheduled',
--      'idx_vet_bookings_provider_status_scheduled',
--      'idx_notifications_user_unread',
--      'idx_pet_reminders_pet_due',
--      'idx_pet_routines_pet_time',
--      'idx_routine_completions_routine_date',
--      'idx_messages_conversation_created',
--      'idx_feed_posts_published_created',
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
--   ... (uno por uno)
-- ──────────────────────────────────────────────────────────────────
