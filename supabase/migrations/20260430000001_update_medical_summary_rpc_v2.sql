-- =====================================================
-- Actualiza get_medical_summary_data para incluir todos
-- los campos clinicos (migracion 20260402), devolver
-- TODOS los registros medicos agrupables, y datos de
-- contacto de emergencia + seguro + dieta.
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_medical_summary_data(p_pet_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pet', (
      SELECT jsonb_build_object(
        -- Datos basicos
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
        -- Campos clinicos (migracion 20260402)
        'blood_type', p.blood_type,
        'neutered_date', p.neutered_date,
        'allergies', p.allergies,
        'allergies_food', p.allergies_food,
        'allergies_medication', p.allergies_medication,
        'allergies_environmental', p.allergies_environmental,
        'chronic_conditions', p.chronic_conditions,
        'chronic_conditions_detail', p.chronic_conditions_detail,
        'current_medications', p.current_medications,
        -- Dieta y estilo de vida
        'diet_type', p.diet_type,
        'diet_brand', p.diet_brand,
        'diet_frequency', p.diet_frequency,
        'activity_level', p.activity_level,
        'living_environment', p.living_environment,
        'behavior_notes', p.behavior_notes,
        'weight_history', p.weight_history,
        -- Contacto y seguro
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
          'notes', mr.notes
        )
        ORDER BY COALESCE(mr.visit_date, mr.date) DESC
      ), '[]'::jsonb)
      FROM medical_records mr
      WHERE mr.pet_id = p_pet_id
    ),
    'documents_count', (
      SELECT COUNT(*)
      FROM medical_documents
      WHERE pet_id = p_pet_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_medical_summary_data(UUID)
  IS 'v2: Returns comprehensive medical summary data including all clinical fields, all record types, and contact/insurance info';
