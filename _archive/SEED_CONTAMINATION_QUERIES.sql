-- ============================================================================
-- Paw Friend — Diagnóstico de contaminación de seed (UN SOLO PASTE)
-- ============================================================================
-- Uso:
--   1. Abrir: https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/sql/new
--   2. Pegar TODO este archivo.
--   3. Click "Run" (o Ctrl+Enter).
--   4. Mirar la tabla de resultados final — 1 fila por check, columna "status":
--        - OK       → 0 afectados, ignorar
--        - REVIEW   → < 10 afectados, revisar manualmente (drill-down)
--        - CRITICAL → ≥ 10 afectados, aplicar limpieza
--
-- IMPORTANTE — check #2 (reminders) produce FALSOS POSITIVOS:
--   El 2026-04-11 corrimos este diagnóstico sobre prod y el check #2 devolvió
--   7 filas afectadas a 5 usuarios. Drill-down confirmó que eran datos
--   legítimos: beta testers + mascota Kai (del dueño) con títulos tipo
--   "Baño en la peluquería" y "Revisar vacunas de Kai" — patrones demasiado
--   genéricos. El heurístico del reporte original (audits/2026-04-09) era
--   paranoico. Mantener el check solo como referencia histórica; si vuelve
--   a dar > 0, drill-down SIEMPRE antes de borrar.
--
-- Schema verificado contra migraciones reales 2026-04-11.
--   - pets.owner_id → profiles.id → auth.users.id
--   - pet_reminders.owner_id (NO user_id)
--   - vet_reviews.owner_id + vet_reviews.vet_id (NO provider_id)
--   - medical_records.pet_id + .title + .notes + .description
--   - posts.user_id
--
-- Esta query es READ-ONLY. No modifica nada.
-- ============================================================================

WITH
-- Lista fija de checks para que el summary siempre muestre las 6 filas
check_list AS (
  SELECT * FROM (VALUES
    ('1_pets_seed_names'),
    ('2_reminders_seed_titles'),
    ('3_medical_records_garbage'),
    ('4_vet_reviews_seed_window'),
    ('5_posts_seed_patterns'),
    ('6_pets_invalid_microchip')
  ) AS t(check_name)
),

-- Union de todas las filas sospechosas con schema común
findings AS (
  -- 1. Dueños REALES con mascotas con nombres de seed
  SELECT
    '1_pets_seed_names'::text AS check_name,
    p.id::text AS affected_id,
    u.email AS user_email,
    format('pet "%s" created %s', p.name, p.created_at::date) AS detail,
    p.created_at AS when_created
  FROM public.pets p
  JOIN auth.users u ON u.id = p.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND p.name IN ('Pelusa','Bruno','Luli','Capitán','Coco','Chocolate','Bella','Cachorro Curioso')
    AND p.created_at >= '2026-04-07'::timestamptz

  UNION ALL

  -- 2. Dueños REALES con recordatorios de seed
  SELECT
    '2_reminders_seed_titles',
    r.id::text,
    u.email,
    format('reminder "%s" due %s', r.title, r.due_date),
    r.created_at
  FROM public.pet_reminders r
  JOIN auth.users u ON u.id = r.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND r.title ~* '(baño.*peluquería|revisar vacunas de kai)'
    AND r.created_at >= '2026-04-07'::timestamptz

  UNION ALL

  -- 3. medical_records con strings basura
  SELECT
    '3_medical_records_garbage',
    m.id::text,
    u.email,
    format('title="%s" notes="%s"', left(m.title, 40), left(coalesce(m.notes, m.description, ''), 40)),
    m.created_at
  FROM public.medical_records m
  JOIN public.pets p ON p.id = m.pet_id
  JOIN auth.users u ON u.id = p.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND (
      m.title IN ('JKKSNFKEUFJNNS L','SADSAD')
      OR m.notes IN ('SADSAD','test','asdf')
      OR m.description IN ('SADSAD','test','asdf')
      OR m.notes ~* '^[a-z]{15,}$'
      OR m.title ~* '^[A-Z]{5,}$'
    )

  UNION ALL

  -- 4. Reviews creadas en la ventana del seed sobre owners/vets reales
  SELECT
    '4_vet_reviews_seed_window',
    v.id::text,
    u.email,
    format('rating=%s comment="%s"', v.rating, left(coalesce(v.comment, '(none)'), 40)),
    v.created_at
  FROM public.vet_reviews v
  JOIN auth.users u ON u.id = v.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND v.created_at >= '2026-04-07'::timestamptz
    AND v.created_at <  '2026-04-10'::timestamptz

  UNION ALL

  -- 5. Feed posts de users REALES con patrones de seed
  SELECT
    '5_posts_seed_patterns',
    fp.id::text,
    u.email,
    format('content="%s"', left(fp.content, 60)),
    fp.created_at
  FROM public.posts fp
  JOIN auth.users u ON u.id = fp.user_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND fp.content ~* '(tuvo un paseo|tuvo una visita al vet|tuvo un baño|tuvo una vacuna)'
    AND fp.created_at >= '2026-04-07'::timestamptz

  UNION ALL

  -- 6. Microchips inválidos (todos ceros o longitud < 15)
  SELECT
    '6_pets_invalid_microchip',
    p.id::text,
    u.email,
    format('pet "%s" microchip="%s"', p.name, p.microchip_number),
    p.created_at
  FROM public.pets p
  JOIN auth.users u ON u.id = p.owner_id
  WHERE p.microchip_number IS NOT NULL
    AND (
      p.microchip_number ~ '^0+$'
      OR (length(p.microchip_number) > 0 AND length(p.microchip_number) < 15)
    )
),

-- Agrupar por check para el summary
grouped AS (
  SELECT
    check_name,
    COUNT(*) AS affected_rows,
    COUNT(DISTINCT user_email) AS affected_users,
    MIN(when_created) AS first_seen,
    MAX(when_created) AS last_seen
  FROM findings
  GROUP BY check_name
)

-- === RESULTADO PRINCIPAL: summary con 6 filas garantizadas ===
SELECT
  cl.check_name,
  COALESCE(g.affected_rows, 0)  AS affected_rows,
  COALESCE(g.affected_users, 0) AS affected_users,
  g.first_seen,
  g.last_seen,
  CASE
    WHEN COALESCE(g.affected_rows, 0) = 0  THEN 'OK'
    WHEN COALESCE(g.affected_rows, 0) < 10 THEN 'REVIEW'
    ELSE 'CRITICAL'
  END AS status
FROM check_list cl
LEFT JOIN grouped g USING (check_name)
ORDER BY COALESCE(g.affected_rows, 0) DESC, cl.check_name;


-- ============================================================================
-- DETAIL DRILL-DOWN (descomentar sólo si algún status != 'OK')
-- ============================================================================
-- Descomentar desde el "/*" hasta el "*/" para ver las filas exactas:

/*
WITH findings AS (
  SELECT '1_pets_seed_names'::text AS check_name, p.id::text AS affected_id, u.email AS user_email,
         format('pet "%s" created %s', p.name, p.created_at::date) AS detail, p.created_at AS when_created
  FROM public.pets p JOIN auth.users u ON u.id = p.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND p.name IN ('Pelusa','Bruno','Luli','Capitán','Coco','Chocolate','Bella','Cachorro Curioso')
    AND p.created_at >= '2026-04-07'::timestamptz
  UNION ALL
  SELECT '2_reminders_seed_titles', r.id::text, u.email,
         format('reminder "%s" due %s', r.title, r.due_date), r.created_at
  FROM public.pet_reminders r JOIN auth.users u ON u.id = r.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND r.title ~* '(baño.*peluquería|revisar vacunas de kai)'
    AND r.created_at >= '2026-04-07'::timestamptz
  UNION ALL
  SELECT '3_medical_records_garbage', m.id::text, u.email,
         format('title="%s" notes="%s"', left(m.title, 40), left(coalesce(m.notes, m.description, ''), 40)), m.created_at
  FROM public.medical_records m JOIN public.pets p ON p.id = m.pet_id JOIN auth.users u ON u.id = p.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND (m.title IN ('JKKSNFKEUFJNNS L','SADSAD')
         OR m.notes IN ('SADSAD','test','asdf')
         OR m.description IN ('SADSAD','test','asdf')
         OR m.notes ~* '^[a-z]{15,}$'
         OR m.title ~* '^[A-Z]{5,}$')
  UNION ALL
  SELECT '4_vet_reviews_seed_window', v.id::text, u.email,
         format('rating=%s comment="%s"', v.rating, left(coalesce(v.comment, '(none)'), 40)), v.created_at
  FROM public.vet_reviews v JOIN auth.users u ON u.id = v.owner_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND v.created_at >= '2026-04-07'::timestamptz
    AND v.created_at <  '2026-04-10'::timestamptz
  UNION ALL
  SELECT '5_posts_seed_patterns', fp.id::text, u.email,
         format('content="%s"', left(fp.content, 60)), fp.created_at
  FROM public.posts fp JOIN auth.users u ON u.id = fp.user_id
  WHERE u.email NOT LIKE '%@demo.pawfriend.cl'
    AND fp.content ~* '(tuvo un paseo|tuvo una visita al vet|tuvo un baño|tuvo una vacuna)'
    AND fp.created_at >= '2026-04-07'::timestamptz
  UNION ALL
  SELECT '6_pets_invalid_microchip', p.id::text, u.email,
         format('pet "%s" microchip="%s"', p.name, p.microchip_number), p.created_at
  FROM public.pets p JOIN auth.users u ON u.id = p.owner_id
  WHERE p.microchip_number IS NOT NULL
    AND (p.microchip_number ~ '^0+$'
         OR (length(p.microchip_number) > 0 AND length(p.microchip_number) < 15))
)
SELECT * FROM findings ORDER BY check_name, when_created DESC;
*/
