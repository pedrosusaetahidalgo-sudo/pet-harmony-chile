-- ==========================================================================
-- AUDIT: detectar trigger functions con referencias a columnas/tablas rotas
-- ==========================================================================
-- Lazy-validation de plpgsql significa que `CREATE FUNCTION` valida syntax
-- pero NO valida referencias a tablas/columnas del cuerpo. El error solo
-- aparece cuando la funcion corre por primera vez con datos reales.
--
-- Ejemplo historico: sync_vaccination_status() referencio
-- pets.vaccines_up_to_date (columna inexistente) por 4 meses — nadie lo
-- noto hasta que un user intento insertar un medical_record tipo vacuna.
--
-- Esta query detecta refs potencialmente rotas escaneando el cuerpo de
-- cada funcion del esquema public y buscando patterns `<tabla>.<columna>`
-- que no existan en information_schema. Falsos positivos posibles — los
-- que salgan FAIL deben validarse manualmente.
--
-- Uso: correr cada vez que se aplica una tanda de migraciones nuevas, o
-- periodicamente (ej: cada release).
-- ==========================================================================

WITH pg_funcs AS (
  SELECT
    p.proname AS func_name,
    p.prosrc AS func_body,
    n.nspname AS schema_name
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
),
-- Listado de columnas existentes por tabla (referencia)
existing_cols AS (
  SELECT
    table_schema || '.' || table_name AS full_table,
    table_name,
    column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
),
-- Listado de funciones que referencian `pets.<algo>` pero ese algo no existe
pets_refs AS (
  SELECT
    f.func_name,
    -- Extraer todas las ocurrencias `pets.<word>` del cuerpo
    (regexp_matches(f.func_body, 'pets\.([a-z_]+)', 'g'))[1] AS referenced_col
  FROM pg_funcs f
)
SELECT
  pr.func_name,
  pr.referenced_col,
  CASE
    WHEN ec.column_name IS NOT NULL THEN 'OK'
    ELSE 'MAYBE_BROKEN'
  END AS status,
  'pets.' || pr.referenced_col AS suspicious_ref
FROM pets_refs pr
LEFT JOIN existing_cols ec
  ON ec.table_name = 'pets'
  AND ec.column_name = pr.referenced_col
WHERE pr.referenced_col NOT IN (
  -- Palabras reservadas / falsos positivos conocidos
  'id', 'created_at', 'updated_at', 'owner_id', 'deleted_at',
  'table', 'row', 'type'
)
ORDER BY status DESC, pr.func_name;

-- ==========================================================================
-- Interpretacion:
-- - status='OK'          → la columna existe, trigger referencia algo valido.
-- - status='MAYBE_BROKEN' → la columna NO existe en pets. Revisar
--                           manualmente (puede ser falso positivo si la
--                           referencia esta en un comentario, string literal,
--                           o si hay RENAME pendiente).
--
-- Si sale MAYBE_BROKEN: abrir la funcion con \sf <nombre> en psql, o
-- SELECT prosrc FROM pg_proc WHERE proname='<nombre>'; y verificar el
-- contexto.
-- ==========================================================================
