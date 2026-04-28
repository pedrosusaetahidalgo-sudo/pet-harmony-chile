-- ══════════════════════════════════════════════════════════════════════════
-- SQL OPERACIONALES FALTANTES — Paw Friend (2026-04-27)
-- ══════════════════════════════════════════════════════════════════════════
-- Estos NO son migraciones — son comandos one-shot que se corren manualmente
-- desde Supabase Dashboard > SQL Editor para terminar de configurar el
-- backend post-pivot modelo v2.
--
-- CORRER EN ORDEN:
--   1. Bloque A: smoke test del trigger welcome (diagnosticar timeline vacio)
--   2. Bloque B: refresh matviews public_breed_stats + public_species_stats
--   3. Bloque C: rotar service_role JWT (HACER PRIMERO en Dashboard, luego SQL)
--   4. Bloque D: programar 3 crones (run-all-cascades + adoption-followups + master-kpis)
--   5. Bloque E: borrar crones legacy si existen (los reemplaza run-all-cascades)
--
-- Cada bloque es independiente y puede correrse aislado.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- BLOQUE A — DIAGNOSTICAR pet_timeline_events VACIO CON 38 PETS
-- ──────────────────────────────────────────────────────────────────────────
-- audit_table_health() reporto pet_timeline_events con 0 filas pero existen
-- 38 pets. El trigger trigger_create_welcome_timeline (mig 20260903200000)
-- deberia haber creado al menos 1 evento "Bienvenida" por cada pet.
--
-- Posibilidad 1: el trigger no esta creado (la mig fallo silenciosamente)
-- Posibilidad 2: el trigger existe pero no se dispara en INSERT (ROW level
--   o WHEN clause incorrecto)
-- Posibilidad 3: las pets se crearon ANTES de aplicar la mig 903200000

-- A.1 Verificar que el trigger existe
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgname IN (
  'trigger_create_welcome_timeline',
  'trigger_create_welcome_timeline_event'
);

-- A.2 Verificar que la funcion existe
SELECT
  proname AS function_name,
  prosrc IS NOT NULL AS has_body
FROM pg_proc
WHERE proname IN (
  'create_welcome_timeline_event',
  'create_pet_bootstrap_events'
)
  AND pronamespace = 'public'::regnamespace;

-- A.3 Si el trigger existe pero no se disparo, ejecutar bootstrap retroactivo:
-- (Solo correr DESPUES de A.1 + A.2 — si trigger existe pero pet_timeline_events vacio)
--
-- INSERT INTO public.pet_timeline_events
--   (pet_id, category, title, description, event_at, recorded_at, recorded_by, source)
-- SELECT
--   p.id,
--   'general'::timeline_category,
--   'Bienvenida a Paw Friend',
--   'Tu mascota ' || p.name || ' fue agregada a Paw Friend',
--   COALESCE(p.created_at, NOW()),
--   NOW(),
--   p.owner_id,
--   'auto_trigger'::timeline_event_source
-- FROM public.pets p
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.pet_timeline_events e
--   WHERE e.pet_id = p.id
-- );


-- ──────────────────────────────────────────────────────────────────────────
-- BLOQUE B — REFRESH MATVIEWS public_breed_stats + public_species_stats
-- ──────────────────────────────────────────────────────────────────────────
-- audit_table_health() reporto ambas matviews con 0 filas. Necesitan al
-- menos 50 pets por (especie, raza) para que aparezcan filas (k-anonymity).
-- Hoy hay 38 pets total — probablemente no hay ningun bucket >=50.
-- Refrescar igual para confirmar.

REFRESH MATERIALIZED VIEW public.public_breed_stats;
REFRESH MATERIALIZED VIEW public.public_species_stats;

-- Verificar
SELECT 'public_breed_stats' AS matview, COUNT(*) AS rows FROM public.public_breed_stats
UNION ALL
SELECT 'public_species_stats', COUNT(*) FROM public.public_species_stats;

-- Si sigue en 0, es expectable hasta que crucemos los 50 pets por bucket.


-- ──────────────────────────────────────────────────────────────────────────
-- BLOQUE C — ROTAR SERVICE_ROLE JWT (orden estricto)
-- ──────────────────────────────────────────────────────────────────────────
-- PASO 1 (NO en SQL Editor, en el Dashboard):
--   Supabase Dashboard > Settings > API > Project API keys
--   → Click "Reset service_role key" → guardar el JWT NUEVO
--
-- PASO 2 (aqui, despues de tener el JWT nuevo en mano):
--   Borrar el secret viejo y crear uno nuevo en Vault.

-- C.1 Ver secret actual (solo nombre, no valor)
SELECT name, description, created_at
FROM vault.secrets
WHERE name = 'service_role_key';

-- C.2 Borrar el secret viejo
DELETE FROM vault.secrets WHERE name = 'service_role_key';

-- C.3 Crear con JWT NUEVO (REEMPLAZAR <PEGAR_JWT_NUEVO_AQUI> con el real)
SELECT vault.create_secret(
  '<PEGAR_JWT_NUEVO_AQUI>',
  'service_role_key',
  'Cron auth para llamadas HTTP a edge fns. Rotado 2026-04-27.'
);

-- C.4 Verificar que el secret es legible
SELECT
  CASE
    WHEN length(decrypted_secret) > 100 THEN '✅ JWT presente y legible'
    ELSE '❌ Vault no devuelve JWT — revisar permisos'
  END AS vault_health
FROM vault.decrypted_secrets
WHERE name = 'service_role_key';


-- ──────────────────────────────────────────────────────────────────────────
-- BLOQUE D — PROGRAMAR 3 CRONES NUEVOS (modelo v2)
-- ──────────────────────────────────────────────────────────────────────────
-- Solo correr DESPUES de bloque C (necesita Vault con JWT nuevo).

-- D.1 Cron unificado de cascadas (reemplaza 6 individuales)
SELECT cron.schedule(
  'run-all-cascades-daily',
  '0 13 * * *',  -- 9am Chile = UTC 13:00
  $$ SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/run-all-cascades',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'service_role_key' LIMIT 1
      ),
      'Content-Type', 'application/json'
    )
  ); $$
);

-- D.2 Cron adoption followups (30/90 dias post adopcion)
SELECT cron.schedule(
  'send-adoption-followups-daily',
  '0 13 * * *',  -- 9am Chile (mismo horario que cascadas)
  $$ SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/send-adoption-followups',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'service_role_key' LIMIT 1
      ),
      'Content-Type', 'application/json'
    )
  ); $$
);

-- D.3 Cron refresh master KPIs (matview con 30+ metricas)
SELECT cron.schedule(
  'refresh-master-kpis-daily',
  '0 10 * * *',  -- 6am Chile = UTC 10:00 (antes de la jornada)
  $$ REFRESH MATERIALIZED VIEW public.master_kpis_daily; $$
);

-- D.4 Verificar que se programaron
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'run-all-cascades-daily',
  'send-adoption-followups-daily',
  'refresh-master-kpis-daily'
)
ORDER BY jobname;


-- ──────────────────────────────────────────────────────────────────────────
-- BLOQUE E — BORRAR CRONES LEGACY (reemplazados por run-all-cascades)
-- ──────────────────────────────────────────────────────────────────────────
-- Si existian estos crones individuales antes, ahora son redundantes —
-- run-all-cascades los corre todos en serie en una sola llamada HTTP.

-- E.1 Listar crones legacy si existen
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'detect-vaccine-overdue-daily',
  'detect-antiparasitic-overdue-daily',
  'detect-inactive-users-daily',
  'detect-birthday-window-daily',
  'detect-memorial-anniversary-daily',
  'notify-health-alerts-daily'
);

-- E.2 Borrarlos uno a uno (solo si aparecen en E.1 — DO blocks defensivos)
DO $$
DECLARE
  jname TEXT;
  legacy_jobs TEXT[] := ARRAY[
    'detect-vaccine-overdue-daily',
    'detect-antiparasitic-overdue-daily',
    'detect-inactive-users-daily',
    'detect-birthday-window-daily',
    'detect-memorial-anniversary-daily',
    'notify-health-alerts-daily'
  ];
BEGIN
  FOREACH jname IN ARRAY legacy_jobs LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = jname) THEN
      PERFORM cron.unschedule(jname);
      RAISE NOTICE '🗑️  Cron legacy borrado: %', jname;
    END IF;
  END LOOP;
END $$;


-- ──────────────────────────────────────────────────────────────────────────
-- VERIFICACION FINAL
-- ──────────────────────────────────────────────────────────────────────────
-- Estado deseado al cierre:
--   - 3 crones nuevos activos (run-all-cascades, adoption-followups, master-kpis)
--   - 0 crones legacy
--   - Vault con service_role_key NUEVO
--   - Matviews refrescadas (aunque sigan en 0 hasta cruzar 50 pets/bucket)

SELECT
  (SELECT COUNT(*) FROM cron.job
    WHERE jobname IN (
      'run-all-cascades-daily',
      'send-adoption-followups-daily',
      'refresh-master-kpis-daily'
    )) AS crones_v2_activos,
  (SELECT COUNT(*) FROM cron.job
    WHERE jobname IN (
      'detect-vaccine-overdue-daily',
      'detect-antiparasitic-overdue-daily',
      'detect-inactive-users-daily',
      'detect-birthday-window-daily',
      'detect-memorial-anniversary-daily',
      'notify-health-alerts-daily'
    )) AS crones_legacy_remanentes,
  (SELECT COUNT(*) FROM vault.secrets WHERE name = 'service_role_key') AS vault_secret_ok;

-- Esperado: crones_v2_activos=3, crones_legacy_remanentes=0, vault_secret_ok=1

-- ══════════════════════════════════════════════════════════════════════════
-- FIN
-- ══════════════════════════════════════════════════════════════════════════
