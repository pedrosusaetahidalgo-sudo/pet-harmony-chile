-- =====================================================
-- v3: Adds vet_clinical_notes and paw_card_id to the
-- medical summary RPC for the chronological PDF.
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
        -- Clinical fields
        'blood_type', p.blood_type,
        'neutered_date', p.neutered_date,
        'allergies', p.allergies,
        'allergies_food', p.allergies_food,
        'allergies_medication', p.allergies_medication,
        'allergies_environmental', p.allergies_environmental,
        'chronic_conditions', p.chronic_conditions,
        'chronic_conditions_detail', p.chronic_conditions_detail,
        'current_medications', p.current_medications,
        -- Diet & lifestyle
        'diet_type', p.diet_type,
        'diet_brand', p.diet_brand,
        'diet_frequency', p.diet_frequency,
        'activity_level', p.activity_level,
        'living_environment', p.living_environment,
        'behavior_notes', p.behavior_notes,
        'weight_history', p.weight_history,
        -- Contact & insurance
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
          'provider_name', sp.business_name
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

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_medical_summary_data(UUID)
  IS 'v3: Chronological ASC order, includes vet_clinical_notes, batch/serial for vaccines, paw_card_id';
