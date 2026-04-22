-- ==========================================================================
-- Fix rpc_pet_health_summary: type mismatch VARCHAR vs TEXT
-- 2026-05-21
--
-- Error reportado 2026-04-21 (F12 Home):
--   code: 42804
--   message: structure of query does not match function result type
--   details: Returned type character varying does not match expected
--            type text in column 5
--
-- Column 5 = holo_pattern. pets.holo_pattern es VARCHAR (mig
-- 20260412180000), pero el RETURNS TABLE declaraba TEXT. Otras columnas
-- como p.name, p.species, p.photo_url tambien podrian ser varchar.
--
-- Fix: castear explicitamente todas las columnas TEXT con ::TEXT.
-- Es seguro: VARCHAR a TEXT es conversion implicita en Postgres.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_pet_health_summary()
RETURNS TABLE (
  pet_id UUID,
  pet_name TEXT,
  species TEXT,
  photo_url TEXT,
  holo_pattern TEXT,
  overdue_count INTEGER,
  upcoming_count INTEGER,
  last_vet_visit DATE,
  vaccines_up_to_date BOOLEAN,
  has_weight BOOLEAN,
  has_photo BOOLEAN,
  has_microchip BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $fnbody$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    p.id AS pet_id,
    p.name::TEXT AS pet_name,
    p.species::TEXT AS species,
    p.photo_url::TEXT AS photo_url,
    p.holo_pattern::TEXT AS holo_pattern,
    COALESCE((
      SELECT COUNT(*)::INTEGER FROM public.pet_reminders r
      WHERE r.pet_id = p.id
        AND r.due_date < CURRENT_DATE
        AND (r.is_completed IS NULL OR r.is_completed = FALSE)
    ), 0) AS overdue_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER FROM public.pet_reminders r
      WHERE r.pet_id = p.id
        AND r.due_date >= CURRENT_DATE
        AND r.due_date <= CURRENT_DATE + INTERVAL '7 days'
        AND (r.is_completed IS NULL OR r.is_completed = FALSE)
    ), 0) AS upcoming_count,
    (
      SELECT MAX(mr.date)::DATE FROM public.medical_records mr
      WHERE mr.pet_id = p.id
        AND mr.record_type IN ('consulta', 'consulta_general', 'control_sano', 'vacuna')
    ) AS last_vet_visit,
    COALESCE(p.vaccination_status = 'up_to_date', FALSE) AS vaccines_up_to_date,
    (p.weight IS NOT NULL) AS has_weight,
    (p.photo_url IS NOT NULL AND p.photo_url <> '') AS has_photo,
    (p.microchip_number IS NOT NULL AND p.microchip_number <> '') AS has_microchip
  FROM public.pets p
  WHERE p.owner_id = auth.uid()
    AND p.lifecycle_status = 'active'
  ORDER BY p.created_at ASC;
END;
$fnbody$;

GRANT EXECUTE ON FUNCTION public.rpc_pet_health_summary() TO authenticated;

-- Smoke test: ejecutar con auth.uid() NULL (desde SQL editor sin JWT).
-- Debe retornar 0 filas sin error.
DO $smoke$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.rpc_pet_health_summary();
  RAISE NOTICE 'Smoke rpc_pet_health_summary OK: % filas', v_count;
END
$smoke$;
