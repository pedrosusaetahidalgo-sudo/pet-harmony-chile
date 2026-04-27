-- ══════════════════════════════════════════════════════════════════════════
-- Table audit RPC (Refactor Maestro §9.0.bis.4)
-- ══════════════════════════════════════════════════════════════════════════
-- RPC para correr en el ritual mensual de limpieza (§2.10.3): detecta
-- tablas zombies (0 filas) y dormidas (filas pero sin actividad reciente).
--
-- Pedro corre desde Admin → Sistema → Migraciones (futuro widget) o via
-- SQL Editor directo. Output ayuda a decidir qué tablas eliminar
-- definitivamente en el siguiente ciclo.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.audit_table_health()
RETURNS TABLE (
  table_name TEXT,
  rows_live BIGINT,
  rows_dead BIGINT,
  last_autovacuum TIMESTAMPTZ,
  last_analyze TIMESTAMPTZ,
  classification TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.relname::TEXT AS table_name,
    s.n_live_tup AS rows_live,
    s.n_dead_tup AS rows_dead,
    s.last_autovacuum,
    s.last_analyze,
    CASE
      WHEN s.n_live_tup = 0 THEN 'zombie'
      WHEN s.n_live_tup < 10 THEN 'tiny'
      WHEN s.n_live_tup BETWEEN 10 AND 99
        AND (s.last_autovacuum IS NULL OR s.last_autovacuum < NOW() - INTERVAL '60 days')
        THEN 'dormant'
      WHEN s.n_live_tup >= 100
        AND (s.last_autovacuum IS NULL OR s.last_autovacuum < NOW() - INTERVAL '30 days')
        THEN 'stale'
      WHEN s.relname LIKE '%_deprecated_%' THEN 'deprecated'
      ELSE 'active'
    END AS classification
  FROM pg_stat_user_tables s
  WHERE s.schemaname = 'public'
  ORDER BY s.n_live_tup ASC;
$$;

REVOKE ALL ON FUNCTION public.audit_table_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_table_health() TO authenticated;

COMMENT ON FUNCTION public.audit_table_health() IS
  'Refactor Maestro §9.0.bis.4. Auditoria mensual de tablas: detecta zombies '
  '(0 filas), tiny (<10), dormant (10-99 sin vacuum 60d), stale (>=100 sin '
  'vacuum 30d), deprecated (renamed). Para ritual mensual de limpieza.';

COMMIT;

DO $$
DECLARE
  v_zombie_count INT;
  v_total_count INT;
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'audit_table_health';
  IF NOT FOUND THEN RAISE EXCEPTION 'audit_table_health no creada'; END IF;

  -- Test la RPC: contar zombies actuales
  SELECT COUNT(*) FILTER (WHERE classification = 'zombie'),
         COUNT(*)
    INTO v_zombie_count, v_total_count
  FROM public.audit_table_health();

  RAISE NOTICE 'Smoke test OK: audit_table_health detecta % tablas, % zombies', v_total_count, v_zombie_count;
END $$;
