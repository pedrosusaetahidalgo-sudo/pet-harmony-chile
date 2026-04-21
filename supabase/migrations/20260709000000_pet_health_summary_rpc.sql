-- ==========================================================================
-- RPC: resumen health score por mascota del usuario
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- Para el widget Home "Panel de mis mascotas", retorna por cada mascota
-- del usuario autenticado los datos que computeHealthScore() necesita:
--   - overdue/upcoming reminders count.
--   - last medical_record date.
--   - vaccination status.
--   - profile completeness flags.
--
-- Un solo query evita N+1 desde frontend.
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
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    p.id AS pet_id,
    p.name AS pet_name,
    p.species,
    p.photo_url,
    p.holo_pattern,
    -- Overdue: reminders con due_date pasada y no completados
    COALESCE((
      SELECT COUNT(*)::INTEGER FROM public.pet_reminders r
      WHERE r.pet_id = p.id
        AND r.due_date < CURRENT_DATE
        AND (r.is_completed IS NULL OR r.is_completed = FALSE)
    ), 0) AS overdue_count,
    -- Upcoming: próximos 7 días
    COALESCE((
      SELECT COUNT(*)::INTEGER FROM public.pet_reminders r
      WHERE r.pet_id = p.id
        AND r.due_date >= CURRENT_DATE
        AND r.due_date <= CURRENT_DATE + INTERVAL '7 days'
        AND (r.is_completed IS NULL OR r.is_completed = FALSE)
    ), 0) AS upcoming_count,
    -- Last vet visit: última medical_record consulta
    (
      SELECT MAX(mr.date)::DATE FROM public.medical_records mr
      WHERE mr.pet_id = p.id
        AND mr.record_type IN ('consulta', 'consulta_general', 'control_sano', 'vacuna')
    ) AS last_vet_visit,
    -- Vacunas al día: vaccination_status del pet o proxy por vacunas recientes
    COALESCE(p.vaccination_status = 'up_to_date', FALSE) AS vaccines_up_to_date,
    (p.weight IS NOT NULL) AS has_weight,
    (p.photo_url IS NOT NULL AND p.photo_url <> '') AS has_photo,
    (p.microchip_number IS NOT NULL AND p.microchip_number <> '') AS has_microchip
  FROM public.pets p
  WHERE p.owner_id = auth.uid()
    AND p.lifecycle_status = 'active'
  ORDER BY p.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.rpc_pet_health_summary() IS
  'Retorna health summary por pet del usuario autenticado. Datos para computeHealthScore() en un solo query.';

GRANT EXECUTE ON FUNCTION public.rpc_pet_health_summary() TO authenticated;
