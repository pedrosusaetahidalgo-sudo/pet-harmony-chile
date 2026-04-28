-- ══════════════════════════════════════════════════════════════════════════
-- BACKEND AUDIT — Paw Friend (2026-04-27)
-- ══════════════════════════════════════════════════════════════════════════
-- Correr este script en Supabase Dashboard > SQL Editor con rol service_role.
-- Devuelve un set de checks para detectar:
--   - Migraciones pendientes (en repo pero no aplicadas)
--   - Tablas/columnas que el código frontend espera y no existen
--   - RPCs / triggers / RLS / extensiones críticas
--   - Crones programados vs los que el plan dice que deben existir
--   - Vault secrets necesarios
--   - Health del schema (tablas zombi, indices faltantes)
--
-- Cada bloque está numerado y aislado. Si uno falla, los siguientes igual
-- corren. Pega los resultados de cada bloque al chat para revisarlos.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 0. METADATA DEL ENTORNO
-- ──────────────────────────────────────────────────────────────────────────
SELECT
  current_database()                AS db_name,
  current_user                       AS exec_user,
  version()                          AS pg_version,
  NOW()                              AS executed_at,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public') AS public_tables,
  (SELECT COUNT(*) FROM pg_proc WHERE pronamespace='public'::regnamespace)      AS public_functions,
  (SELECT COUNT(*) FROM pg_trigger WHERE NOT tgisinternal)                       AS triggers_total;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONES INSTALADAS (vs esperadas)
-- ──────────────────────────────────────────────────────────────────────────
-- Esperadas en Paw Friend al 2026-04-27:
--   - vector (pgvector para nose print embeddings)
--   - pg_cron (crones)
--   - pg_net (HTTP calls desde SQL para llamar edge fns)
--   - vault (encrypted secrets)
SELECT
  extname,
  extversion,
  CASE
    WHEN extname IN ('vector','pg_cron','pg_net','vault','pgcrypto','uuid-ossp')
      THEN '✅ critica'
    ELSE 'standard'
  END AS criticidad
FROM pg_extension
ORDER BY extname;

-- Si falta alguna critica, instalarla desde Supabase Dashboard > Extensions.

-- ──────────────────────────────────────────────────────────────────────────
-- 2. MIGRACIONES APLICADAS (vs repo)
-- ──────────────────────────────────────────────────────────────────────────
-- Lista las ultimas 30 aplicadas. En el repo hay 312 SQLs en
-- supabase/migrations/. Comparar manualmente con `ls supabase/migrations/`
-- para detectar pendientes.
SELECT
  version,
  name,
  COALESCE(array_length(statements, 1), 0) AS num_statements
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 30;

-- Contar total aplicadas:
SELECT COUNT(*) AS total_aplicadas FROM supabase_migrations.schema_migrations;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. TABLAS CRITICAS — existen?
-- ──────────────────────────────────────────────────────────────────────────
-- El frontend espera estas tablas. Si alguna devuelve 0, hay drift.
WITH expected(name) AS (
  VALUES
    -- Core mascotas
    ('pets'), ('pet_timeline_events'), ('pet_id_cards'), ('pet_co_owners'),
    ('pet_health_alerts'), ('pet_routines'), ('pet_reminders'),
    -- Owner / vet
    ('profiles'), ('service_providers'), ('vet_bookings'),
    ('availability_rules'), ('availability_exceptions'),
    -- Adoption / shelter
    ('adoption_centers'), ('adoption_processes'), ('adoption_followups'),
    ('adoption_posts'),
    -- Medical
    ('medical_records'), ('routine_completions'), ('consultation_templates'),
    -- Pagos
    ('subscriptions'), ('orders'), ('donations'),
    -- Modelo v2
    ('paw_companys'), ('correlation_definitions'), ('correlation_observations'),
    ('b2b_api_keys'), ('b2b_api_usage'),
    ('partner_integrations'), ('partner_events'),
    -- Pitch / aplicaciones
    ('pitch_applications'),
    -- Notificaciones
    ('user_notification_prefs'), ('notification_attempts'),
    -- Plataforma
    ('error_logs'), ('audit_snapshots'), ('admin_access'),
    -- Nose print
    ('nose_prints'),
    -- Insights / Paw Voices
    -- public_breed_stats es materialized view (mig 20260901000000), no tabla
    ('paw_voices'), ('public_breed_stats')
)
SELECT
  e.name AS expected_table,
  CASE WHEN c.oid IS NOT NULL THEN '✅ existe' ELSE '❌ FALTA' END AS status,
  CASE c.relkind
    WHEN 'r' THEN 'tabla'
    WHEN 'm' THEN 'matview'
    WHEN 'v' THEN 'view'
    ELSE NULL
  END AS kind,
  -- pg_size_pretty(NULL) y pg_total_relation_size(NULL) devuelven NULL,
  -- asi que no rompe si la tabla no existe.
  pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM expected e
LEFT JOIN pg_class c
  ON c.relnamespace = 'public'::regnamespace
  AND c.relname = e.name
  AND c.relkind IN ('r', 'm', 'v')  -- tablas + materialized views + views
ORDER BY status DESC, e.name;

-- ──────────────────────────────────────────────────────────────────────────
-- 4. RPCs CRITICOS — existen?
-- ──────────────────────────────────────────────────────────────────────────
-- El frontend / cron / edge fns invocan estas funciones. Si falta alguna,
-- esos flujos rompen silenciosamente o devuelven error 404 al cliente.
WITH expected_rpcs(name) AS (
  VALUES
    -- Bootstrap pet
    ('create_welcome_timeline_event'),
    ('count_pets_complete_ficha'),
    ('claim_ficha_complete_milestone'),
    -- Pet ID Card / nose print
    ('match_nose_print'), ('set_nose_print_primary'),
    -- Cascadas (modelo v2)
    ('detect_vaccine_overdue_alerts'),
    ('detect_antiparasitic_overdue_alerts'),
    ('detect_inactive_user_alerts'),
    ('detect_birthday_window_alerts'),
    ('detect_memorial_anniversary_alerts'),
    -- Risk + KPIs
    ('calculate_pet_risk_score'),
    ('compute_risk_signals'),
    ('refresh_master_kpis'),
    -- Correlations
    ('compute_breed_lifespan_correlation'),
    ('compute_neuter_age_by_comuna_correlation'),
    -- B2B API
    ('create_b2b_api_key'),
    -- Audit
    ('audit_table_health'),
    -- Partners
    ('record_partner_event'),
    -- Adoption
    ('approve_pitch_application'),
    -- Notificaciones
    ('user_can_receive_notification'),
    -- Plan provider normalizado
    ('apply_premium')
)
SELECT
  e.name AS expected_rpc,
  CASE WHEN p.proname IS NOT NULL THEN '✅ existe' ELSE '❌ FALTA' END AS status
FROM expected_rpcs e
LEFT JOIN pg_proc p
  ON p.proname=e.name AND p.pronamespace='public'::regnamespace
ORDER BY status DESC, e.name;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. TRIGGERS CRITICOS — auto-sync timeline + bootstrap pet
-- ──────────────────────────────────────────────────────────────────────────
-- Sin estos, el timeline pet_timeline_events nace vacio y los flujos de
-- ambient computing no funcionan.
WITH expected_triggers(table_name, trigger_name) AS (
  VALUES
    -- Auto-sync a timeline (Refactor Maestro §2.4.3)
    ('medical_records', 'trigger_medical_to_timeline'),
    ('pet_reminders', 'trigger_reminder_to_timeline'),
    ('vet_bookings', 'trigger_booking_to_timeline'),
    ('routine_completions', 'trigger_routine_to_timeline'),
    -- Bootstrap pet enriquecido (§14.bis)
    ('pets', 'trigger_create_welcome_timeline'),
    -- Adoption interest -> process
    ('adoption_interests', 'trigger_adoption_interest_to_process'),
    -- Anti-spam booking
    ('vet_bookings', 'trigger_booking_antispam'),
    -- Weight loss alert
    ('pets', 'trigger_detect_weight_loss')
)
SELECT
  e.table_name,
  e.trigger_name,
  CASE WHEN t.tgname IS NOT NULL THEN '✅ existe' ELSE '❌ FALTA' END AS status
FROM expected_triggers e
LEFT JOIN pg_trigger t
  ON t.tgname=e.trigger_name AND NOT t.tgisinternal
ORDER BY status DESC, e.table_name;

-- ──────────────────────────────────────────────────────────────────────────
-- 6. CRONES PROGRAMADOS (pg_cron)
-- ──────────────────────────────────────────────────────────────────────────
-- Plan modelo v2 dice que deben existir:
--   - run-all-cascades-daily (1 cron unificado, 9am Chile)
--   - send-adoption-followups-daily (9am Chile)
--   - refresh-master-kpis-daily (6am Chile)
--   - notify-pending-thanks (cron de gracias por aporte voluntario)
SELECT
  jobid,
  jobname,
  schedule,
  active,
  CASE
    WHEN jobname IN (
      'run-all-cascades-daily',
      'send-adoption-followups-daily',
      'refresh-master-kpis-daily',
      'detect-vaccine-overdue-daily',
      'detect-inactive-users-daily',
      'detect-birthday-window-daily',
      'notify-health-alerts-daily',
      'audit-cron-daily'
    ) THEN '⚙️ esperado'
    ELSE 'extra'
  END AS criticidad,
  -- Trunca command para visualizar mejor
  LEFT(command::text, 100) AS command_preview
FROM cron.job
ORDER BY jobname;

-- ──────────────────────────────────────────────────────────────────────────
-- 7. VAULT SECRETS — los crones los necesitan
-- ──────────────────────────────────────────────────────────────────────────
-- Si esta vacio, los crones que usan
-- `current_setting('app.settings.service_role_key')` van a fallar al ejecutarse.
SELECT
  name,
  description,
  created_at,
  CASE
    WHEN name IN ('service_role_key') THEN '✅ critico'
    ELSE 'extra'
  END AS criticidad
FROM vault.secrets
ORDER BY name;

-- Si service_role_key no aparece, programar:
--   SELECT vault.create_secret('JWT_NUEVO', 'service_role_key', 'Cron auth');

-- ──────────────────────────────────────────────────────────────────────────
-- 8. RLS POLICIES — coverage por tabla
-- ──────────────────────────────────────────────────────────────────────────
-- Cualquier tabla con RLS habilitado pero 0 policies = inaccesible.
-- Cualquier tabla con datos sensibles SIN RLS = leak abierto.
-- Vista pg_policies expone columnas: schemaname, tablename, policyname, ...
SELECT
  c.relname AS table_name,
  CASE
    WHEN c.relrowsecurity AND COUNT(p.policyname) = 0 THEN '🚨 RLS on SIN policies'
    WHEN c.relrowsecurity THEN '🔒 RLS on'
    ELSE '⚠️ RLS OFF'
  END AS rls_status,
  COUNT(p.policyname) AS policy_count,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_class c
LEFT JOIN pg_policies p
  ON p.tablename = c.relname AND p.schemaname = 'public'
WHERE c.relkind = 'r'
  AND c.relnamespace = 'public'::regnamespace
  AND c.relname NOT LIKE 'pg_%'
GROUP BY c.relname, c.relrowsecurity, c.oid
ORDER BY rls_status DESC, policy_count ASC, c.relname;

-- ──────────────────────────────────────────────────────────────────────────
-- 9. TABLAS DEPRECATED — siguen existiendo?
-- ──────────────────────────────────────────────────────────────────────────
-- Mig 20260903900000 renombro 4 a _deprecated_20260427.
-- Drop definitivo programado para 2026-10-04 (6 meses).
SELECT
  c.relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
  s.n_live_tup AS rows_live,
  s.last_autovacuum,
  CASE
    WHEN s.last_autovacuum < NOW() - INTERVAL '90 days'
      OR s.last_autovacuum IS NULL THEN '🟢 candidata DROP definitivo'
    ELSE '⏳ esperar mas tiempo'
  END AS recomendacion
FROM pg_class c
LEFT JOIN pg_stat_user_tables s
  ON s.relname = c.relname AND s.schemaname = 'public'
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND (c.relname LIKE '%_deprecated%' OR c.relname LIKE '%_legacy%')
ORDER BY c.relname;

-- ──────────────────────────────────────────────────────────────────────────
-- 10. TABLAS HUERFANAS — sospechosas (segun §9.0.bis del refactor)
-- ──────────────────────────────────────────────────────────────────────────
-- Si una tabla tiene <100 filas Y last_autovacuum > 60 dias atras,
-- candidata a _deprecated.
SELECT
  schemaname,
  relname AS tabla,
  n_live_tup AS filas,
  last_autovacuum,
  last_analyze,
  CASE
    WHEN n_live_tup < 100 AND last_autovacuum < NOW() - INTERVAL '60 days'
      THEN '🟡 candidata _deprecated'
    WHEN n_live_tup = 0
      THEN '⚠️ vacia'
    ELSE 'ok'
  END AS recomendacion
FROM pg_stat_user_tables
WHERE schemaname='public'
ORDER BY n_live_tup ASC, relname
LIMIT 30;

-- ──────────────────────────────────────────────────────────────────────────
-- 11. INDICES FALTANTES — queries con seq_scan altos
-- ──────────────────────────────────────────────────────────────────────────
-- Tablas grandes (>10K filas) con muchos seq_scan = falta indice.
SELECT
  relname AS tabla,
  n_live_tup AS filas,
  seq_scan,
  seq_tup_read,
  idx_scan,
  CASE
    WHEN n_live_tup > 10000 AND seq_scan > idx_scan * 10
      THEN '⚠️ probable indice faltante'
    ELSE 'ok'
  END AS health
FROM pg_stat_user_tables
WHERE schemaname='public' AND n_live_tup > 100
ORDER BY seq_tup_read DESC
LIMIT 20;

-- ──────────────────────────────────────────────────────────────────────────
-- 12. ERROR LOGS — health rate ultimos 7 dias
-- ──────────────────────────────────────────────────────────────────────────
-- Schema (mig 20260512000000_error_logs_table.sql):
--   source IN (frontend|edge_function|database|external)
--   severity IN (error|warning|critical)
--   resolved BOOLEAN
SELECT
  source,
  COUNT(*) AS total_7d,
  COUNT(*) FILTER (WHERE severity='critical') AS criticos,
  COUNT(*) FILTER (WHERE severity='error')    AS errors,
  COUNT(*) FILTER (WHERE severity='warning')  AS warnings,
  COUNT(*) FILTER (WHERE NOT resolved)        AS sin_resolver,
  MAX(created_at)                              AS last_seen
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY source
ORDER BY criticos DESC, errors DESC NULLS LAST
LIMIT 30;

-- ──────────────────────────────────────────────────────────────────────────
-- 13. NOTIFICATION_ATTEMPTS — dedup + delivery health
-- ──────────────────────────────────────────────────────────────────────────
-- Schema (mig 20260612000001_notification_attempts.sql):
--   booking_type, booking_id, reminder_type, channel
--   status IN (queued|sent|delivered|failed|skipped|read)
--   attempted_at, delivered_at, read_at
-- Si delivered/sent/read son 0 hace dias, push roto.
-- Si failed sube mucho, problema con FCM/Resend/WhatsApp.
SELECT
  status,
  channel,
  COUNT(*) AS total_7d,
  COUNT(DISTINCT booking_id) AS bookings_distintos,
  MAX(attempted_at) AS ultima_actividad
FROM notification_attempts
WHERE attempted_at > NOW() - INTERVAL '7 days'
GROUP BY status, channel
ORDER BY channel, status;

-- ──────────────────────────────────────────────────────────────────────────
-- 14. SUBSCRIPTIONS SHAPE (modelo v2 = "Paw Member voluntario")
-- ──────────────────────────────────────────────────────────────────────────
-- Confirma que no haya planes legacy mal mapeados.
SELECT
  plan_type,
  status,
  COUNT(*) AS total,
  SUM(payment_amount_clp) AS revenue_total_clp
FROM subscriptions
GROUP BY plan_type, status
ORDER BY plan_type, status;

-- ──────────────────────────────────────────────────────────────────────────
-- 15. PROVIDER PLANS — distribucion (Clinica/Pro Max escondidos)
-- ──────────────────────────────────────────────────────────────────────────
-- Modelo v2: Clinica/Pro Max no deberian aparecer en pricing publico.
-- Pero sigue siendo asignable manualmente. Verificar quien tiene cada plan.
SELECT
  provider_plan,
  COUNT(*) AS providers,
  COUNT(*) FILTER (WHERE status='active') AS activos
FROM service_providers
WHERE provider_plan IS NOT NULL
GROUP BY provider_plan
ORDER BY providers DESC;

-- ──────────────────────────────────────────────────────────────────────────
-- 16. RESEARCH CONSENT OPT-IN RATE (leading indicator pharma)
-- ──────────────────────────────────────────────────────────────────────────
-- El moat pharma depende de este KPI. Si esta < 25%, no hay deals.
SELECT
  COUNT(*) FILTER (WHERE anonymous_data_research_consent = TRUE)  AS opt_in,
  COUNT(*) FILTER (WHERE anonymous_data_research_consent = FALSE) AS opt_out,
  COUNT(*) FILTER (WHERE anonymous_data_research_consent IS NULL) AS no_decidido,
  COUNT(*)                                                          AS total_users,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE anonymous_data_research_consent = TRUE)
    / NULLIF(COUNT(*), 0),
    1
  ) AS opt_in_pct
FROM profiles;

-- ──────────────────────────────────────────────────────────────────────────
-- 17. PETS COMPLETOS (North Star) — ¿cuántos llegaron a >=10 eventos?
-- ──────────────────────────────────────────────────────────────────────────
WITH pet_event_count AS (
  SELECT pet_id, COUNT(*) AS events
  FROM pet_timeline_events
  GROUP BY pet_id
)
SELECT
  CASE
    WHEN events >= 10 THEN '✅ >=10 eventos (North Star)'
    WHEN events >= 5  THEN '🟡 5-9 eventos'
    WHEN events >= 1  THEN '🔴 1-4 eventos'
    ELSE '⚫ 0 eventos'
  END AS bucket,
  COUNT(*) AS pets
FROM pet_event_count
GROUP BY bucket
ORDER BY bucket DESC;

-- ──────────────────────────────────────────────────────────────────────────
-- 18. NOSE PRINTS — ¿cuántas mascotas registraron biometría?
-- ──────────────────────────────────────────────────────────────────────────
-- Schema (mig 20260825000000_nose_print_dinov2_large.sql):
--   embedding extensions.vector(1024), provider TEXT, model_id TEXT,
--   is_primary BOOLEAN, captured_at TIMESTAMPTZ, created_at TIMESTAMPTZ
SELECT
  COUNT(DISTINCT pet_id)                   AS pets_con_nose_print,
  COUNT(*)                                  AS total_embeddings,
  COUNT(*) FILTER (WHERE is_primary=TRUE)   AS primarios,
  COUNT(DISTINCT provider)                  AS providers_distintos,
  COUNT(DISTINCT model_id)                  AS modelos_distintos,
  MODE() WITHIN GROUP (ORDER BY model_id)   AS modelo_mas_usado,
  MIN(captured_at)                          AS primer_scan,
  MAX(captured_at)                          AS ultimo_scan
FROM nose_prints;

-- ──────────────────────────────────────────────────────────────────────────
-- 19. CASCADAS HEALTH — ¿se están creando alerts?
-- ──────────────────────────────────────────────────────────────────────────
-- Schema (mig 20260902200000_pet_health_alerts.sql):
--   alert_type IN (weight_loss_30d|vaccine_overdue|no_activity_7d|
--                  antiparasitic_overdue|birthday_window|memorial_anniversary)
--   severity IN (low|medium|high)
--   dismissed_at, dismissed_by (NO acknowledged_at)
--   email_sent_at (mig 20260902500000)
SELECT
  alert_type,
  severity,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS ultimos_7d,
  COUNT(*) FILTER (WHERE email_sent_at IS NOT NULL)               AS email_enviado,
  COUNT(*) FILTER (WHERE dismissed_at IS NOT NULL)                AS dismissed
FROM pet_health_alerts
GROUP BY alert_type, severity
ORDER BY alert_type, severity;

-- ──────────────────────────────────────────────────────────────────────────
-- 20. AUDIT TABLE HEALTH — ritual mensual (§9.0.bis.4)
-- ──────────────────────────────────────────────────────────────────────────
-- RPC del refactor maestro que clasifica tablas: zombie/tiny/dormant/
-- stale/deprecated/active. Correr cada mes (1° lunes hábil).
SELECT * FROM public.audit_table_health()
ORDER BY classification, table_name;

-- ══════════════════════════════════════════════════════════════════════════
-- FIN DEL AUDIT
-- ══════════════════════════════════════════════════════════════════════════
-- Como interpretar los resultados:
--   - Bloque 3-5: si algo dice "❌ FALTA", revisar /supabase/migrations/
--     contra schema_migrations table del bloque 2.
--   - Bloque 6: si crones esperados no aparecen, programarlos via:
--       SELECT cron.schedule('nombre', '0 13 * * *', $$ SELECT ... $$);
--   - Bloque 7: si no hay 'service_role_key', ningun cron HTTP funciona.
--   - Bloque 8: tablas con RLS off + datos sensibles = leak. Activar y
--     poner policies.
--   - Bloque 9-10: candidatas a drop si nadie las tocó en 60+ dias.
--   - Bloque 11: indices faltantes = queries lentas.
--   - Bloque 16: research consent < 25% = sin moat pharma.
-- ══════════════════════════════════════════════════════════════════════════
