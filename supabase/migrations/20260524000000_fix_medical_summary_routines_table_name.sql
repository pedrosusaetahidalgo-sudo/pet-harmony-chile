-- =====================================================
-- FIX: get_medical_summary_data referenciaba tabla 'routines' (inexistente).
-- La tabla real se llama 'pet_routines' (ver 20260504000000_pet_routines.sql).
--
-- Sin este fix, descargar "ficha completa" (p_mode='complete') falla con:
--   relation "routines" does not exist
--
-- Solo se cambia el nombre de la tabla en el bloque de rutinas; el resto
-- de la funcion queda identico al de la migracion 20260516000001.
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_medical_summary_data(
  p_pet_id UUID,
  p_mode TEXT DEFAULT 'medical'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_routines JSONB;
BEGIN
  -- Base data (always included)
  SELECT jsonb_build_object(
    'pet', (
      SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'species', p.species,
        'breed', p.breed,
        'gender', p.gender,
        'birth_date', p.birth_date,
        'weight', p.weight,
        'photo_url', p.photo_url,
        'microchip_number', p.microchip_number,
        'neutered', p.neutered,
        'paw_card_id', p.paw_card_id,
        'blood_type', p.blood_type,
        'neutered_date', p.neutered_date,
        'allergies', p.allergies,
        'allergies_food', p.allergies_food,
        'allergies_medication', p.allergies_medication,
        'allergies_environmental', p.allergies_environmental,
        'chronic_conditions', p.chronic_conditions,
        'chronic_conditions_detail', p.chronic_conditions_detail,
        'current_medications', p.current_medications,
        'diet_type', p.diet_type,
        'diet_brand', p.diet_brand,
        'diet_frequency', p.diet_frequency,
        'activity_level', p.activity_level,
        'living_environment', p.living_environment,
        'behavior_notes', p.behavior_notes,
        'weight_history', p.weight_history,
        'emergency_vet_name', p.emergency_vet_name,
        'emergency_vet_phone', p.emergency_vet_phone,
        'insurance_provider', p.insurance_provider,
        'insurance_policy', p.insurance_policy,
        'preferred_clinic', p.preferred_clinic
      )
      FROM pets p
      WHERE p.id = p_pet_id
    ),
    'owner', (
      SELECT jsonb_build_object(
        'display_name', pr.display_name,
        'email', au.email
      )
      FROM pets p
      JOIN profiles pr ON pr.id = p.owner_id
      JOIN auth.users au ON au.id = pr.id
      WHERE p.id = p_pet_id
    ),
    'all_records', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', mr.id,
          'record_type', mr.record_type,
          'title', mr.title,
          'description', mr.description,
          'date', COALESCE(mr.visit_date, mr.date),
          'next_date', mr.next_date,
          'veterinarian_name', COALESCE(mr.vet_name, mr.veterinarian_name),
          'clinic_name', mr.clinic_name,
          'reason', mr.reason,
          'diagnosis', mr.diagnosis,
          'treatment', mr.treatment,
          'notes', mr.notes,
          'batch_number', mr.batch_number,
          'serial_number', mr.serial_number
        )
        ORDER BY COALESCE(mr.visit_date, mr.date) ASC
      ), '[]'::jsonb)
      FROM medical_records mr
      WHERE mr.pet_id = p_pet_id
    ),
    'vet_notes', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', vcn.id,
          'note_type', vcn.note_type,
          'title', vcn.title,
          'description', vcn.description,
          'consultation_date', vcn.consultation_date,
          'followup_required', vcn.followup_required,
          'followup_date', vcn.followup_date,
          'followup_reason', vcn.followup_reason,
          'provider_name', sp.display_name
        )
        ORDER BY vcn.consultation_date ASC
      ), '[]'::jsonb)
      FROM vet_clinical_notes vcn
      JOIN service_providers sp ON sp.id = vcn.provider_id
      WHERE vcn.pet_id = p_pet_id
    ),
    'documents_count', (
      SELECT COUNT(*)
      FROM medical_documents
      WHERE pet_id = p_pet_id
    )
  ) INTO v_result;

  -- If mode is 'complete', add routines (tabla correcta: pet_routines)
  IF p_mode = 'complete' THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'title', r.title,
        'category', r.category,
        'days_of_week', r.days_of_week,
        'time_of_day', r.time_of_day,
        'duration_minutes', r.duration_minutes,
        'is_active', r.is_active
      )
      ORDER BY r.category, r.time_of_day
    ), '[]'::jsonb)
    INTO v_routines
    FROM pet_routines r
    WHERE r.pet_id = p_pet_id AND r.is_active = true;

    v_result = v_result || jsonb_build_object('routines', v_routines);
  END IF;

  RETURN v_result;
END;
$$;

-- Mantener REVOKE de 20260518000000_security_revoke_and_rls_hardening.sql
-- (solo service_role puede ejecutar, edge function valida ownership antes).
REVOKE EXECUTE ON FUNCTION public.get_medical_summary_data(UUID, TEXT) FROM public, anon, authenticated;

COMMENT ON FUNCTION public.get_medical_summary_data(UUID, TEXT)
  IS 'v5: Fix 2026-05-24 — referencia tabla pet_routines (antes decia routines, no existia).';
