-- ═══════════════════════════════════════════════════════════════════════════
-- Revocar permisos peligrosos de anon en todas las tablas public (2026-05-05)
--
-- Hallazgo critico durante el dia 1 de beta:
--   181+ tablas en schema public tienen GRANT UPDATE, DELETE, TRUNCATE,
--   REFERENCES, TRIGGER a `anon`. Esto es resultado del DEFAULT que aplica
--   Supabase cuando una tabla se crea via Studio/Dashboard (no via mig SQL
--   con GRANTs explicitos). Las migs originales declaran GRANT SELECT, INSERT
--   donde corresponde — pero los demas privilegios quedaron del default.
--
-- Riesgo:
--   Cualquier visitante con la anon key (publishable, va al bundle) puede:
--     fetch('https://<proj>.supabase.co/rest/v1/<tabla>?id=eq.X', {
--       method: 'DELETE',
--       headers: { apikey: '<anon-key>', Authorization: 'Bearer <anon-key>' }
--     });
--   RLS es la segunda capa pero si una tabla tiene policy USING(true) para
--   DELETE — o si falta policy explicita y `RESTRICTIVE` no aplica — el
--   atacante borra. Vector real con users beta entrando ahora.
--
-- Cambios:
--   A. REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER de `anon` en
--      todas las tablas public (loop dinamico via DO block).
--   B. REVOKE TRUNCATE, REFERENCES, TRIGGER de `authenticated` (nunca
--      legitimo via REST API; UPDATE y DELETE quedan porque users
--      legitimamente editan/borran sus propios rows con RLS filtrando).
--   C. Mantener intactos los GRANT SELECT, INSERT que estaban — esos son
--      legitimos: anon necesita SELECT en landings publicas (/qr/:token,
--      /paw-card/:id, /memoria/:petId, /refugios/:slug, etc.) y INSERT en
--      formularios publicos (/aplicar, donaciones, log-error rate-limit).
--
-- Idempotente: re-ejecutar es no-op (REVOKE silenciosamente skipea grants
-- que ya no existen). Aplicar desde Supabase Dashboard > SQL Editor.
--
-- Smoke test: al final, verifica que NO quedan grants peligrosos en anon.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- A. REVOKE masivo en anon (UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_table RECORD;
  v_revoked_count INT := 0;
BEGIN
  FOR v_table IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format(
      'REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM anon',
      v_table.schemaname,
      v_table.tablename
    );
    v_revoked_count := v_revoked_count + 1;
  END LOOP;

  -- Tambien views (las del output original incluian profiles_public,
  -- all_bookings_view, providers_with_services, clinic_active_seats_view).
  FOR v_table IN
    SELECT schemaname, viewname
    FROM pg_views
    WHERE schemaname = 'public'
    ORDER BY viewname
  LOOP
    -- Views solo soportan SELECT/INSERT/UPDATE/DELETE/REFERENCES/TRIGGER (no TRUNCATE).
    EXECUTE format(
      'REVOKE UPDATE, DELETE, REFERENCES, TRIGGER ON %I.%I FROM anon',
      v_table.schemaname,
      v_table.viewname
    );
    v_revoked_count := v_revoked_count + 1;
  END LOOP;

  -- Materialized views (pg_matviews) — separadas del SELECT pg_views.
  FOR v_table IN
    SELECT schemaname, matviewname AS viewname
    FROM pg_matviews
    WHERE schemaname = 'public'
    ORDER BY matviewname
  LOOP
    -- MV soportan los mismos privilegios que tablas pero no DELETE/UPDATE
    -- (son read-only desde queries; refresh es por owner). Igual REVOKE
    -- defensivo por si fueron concedidos.
    EXECUTE format(
      'REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM anon',
      v_table.schemaname,
      v_table.viewname
    );
    v_revoked_count := v_revoked_count + 1;
  END LOOP;

  -- Fallback: si information_schema reporta grants peligrosos en algo que
  -- no aparezca en pg_tables/pg_views/pg_matviews (ej: foreign tables o
  -- partitioned tables), iterar sobre eso directamente.
  FOR v_table IN
    SELECT DISTINCT 'public' AS schemaname, table_name AS tablename
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee = 'anon'
      AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE')
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM anon',
        v_table.schemaname,
        v_table.tablename
      );
      v_revoked_count := v_revoked_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Si TRUNCATE no aplica (view), reintentar sin TRUNCATE.
      EXECUTE format(
        'REVOKE UPDATE, DELETE, REFERENCES, TRIGGER ON %I.%I FROM anon',
        v_table.schemaname,
        v_table.tablename
      );
      v_revoked_count := v_revoked_count + 1;
    END;
  END LOOP;

  RAISE NOTICE 'REVOKE anon dangerous grants: aplicado en % tables/views/matviews', v_revoked_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- B. REVOKE en authenticated (TRUNCATE, REFERENCES, TRIGGER no son
--    legitimos via REST). UPDATE y DELETE quedan porque users editan
--    sus propios rows con RLS filtrando.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_table RECORD;
  v_revoked_count INT := 0;
BEGIN
  FOR v_table IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM authenticated',
      v_table.schemaname,
      v_table.tablename
    );
    v_revoked_count := v_revoked_count + 1;
  END LOOP;

  FOR v_table IN
    SELECT schemaname, viewname
    FROM pg_views
    WHERE schemaname = 'public'
    ORDER BY viewname
  LOOP
    EXECUTE format(
      'REVOKE REFERENCES, TRIGGER ON %I.%I FROM authenticated',
      v_table.schemaname,
      v_table.viewname
    );
    v_revoked_count := v_revoked_count + 1;
  END LOOP;

  -- Materialized views
  FOR v_table IN
    SELECT schemaname, matviewname AS viewname
    FROM pg_matviews
    WHERE schemaname = 'public'
    ORDER BY matviewname
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM authenticated',
      v_table.schemaname,
      v_table.viewname
    );
    v_revoked_count := v_revoked_count + 1;
  END LOOP;

  RAISE NOTICE 'REVOKE authenticated dangerous grants: aplicado en % tables/views/matviews', v_revoked_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- C. Smoke test: verificar que NO quedan grants peligrosos en anon
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_dangerous_count INT;
  v_first_table TEXT;
BEGIN
  SELECT COUNT(*), MIN(table_name)
    INTO v_dangerous_count, v_first_table
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee = 'anon'
      AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE');

  IF v_dangerous_count > 0 THEN
    RAISE EXCEPTION 'Smoke FAILED: % tables aun tienen grants peligrosos en anon (ej: %)',
      v_dangerous_count, v_first_table;
  END IF;

  RAISE NOTICE 'Smoke test OK: 0 grants peligrosos en anon';
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Nota: ALTER DEFAULT PRIVILEGES (si Pedro crea tablas nuevas via Studio
-- en el futuro, los GRANTs default volveran a aplicar). Para evitar eso
-- a futuro, ejecutar manualmente UNA VEZ desde el Dashboard como postgres
-- superuser:
--
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public
--     REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER FROM anon;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public
--     REVOKE TRUNCATE, REFERENCES, TRIGGER FROM authenticated;
--
-- Esto solo afecta tablas creadas DESPUES del comando, no las existentes.
-- Por eso esta mig hace REVOKE explicito sobre las que ya existen.
-- ═══════════════════════════════════════════════════════════════════════════
