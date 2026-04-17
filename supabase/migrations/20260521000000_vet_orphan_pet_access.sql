-- =============================================================================
-- Allow vets full clinical access to orphan pets they created (no owner yet)
-- =============================================================================
-- Problem: when a vet creates a pet via create-patient, owner_id is NULL and
-- no pet_vet_links record exists (requires owner_id NOT NULL). The vet can
-- read/update the pet record via existing RLS but cannot write clinical notes
-- or medical records.

-- 1. vet_clinical_notes: allow insert for creator vets
DROP POLICY IF EXISTS "Provider can insert notes" ON public.vet_clinical_notes;

CREATE POLICY "Provider can insert notes"
  ON public.vet_clinical_notes FOR INSERT
  WITH CHECK (
    -- Must be the provider's own record
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = vet_clinical_notes.provider_id
        AND service_providers.user_id = auth.uid()
    )
    AND (
      -- Has a valid share token
      (
        vet_clinical_notes.share_token_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.medical_share_tokens
          WHERE medical_share_tokens.id = vet_clinical_notes.share_token_id
            AND medical_share_tokens.expires_at > now()
            AND medical_share_tokens.is_revoked = false
        )
      )
      OR
      -- Has an active pet_vet_link
      EXISTS (
        SELECT 1 FROM public.pet_vet_links
        WHERE pet_vet_links.pet_id = vet_clinical_notes.pet_id
          AND pet_vet_links.provider_id = vet_clinical_notes.provider_id
          AND pet_vet_links.status = 'active'
      )
      OR
      -- Is the creator vet of an orphan pet (no owner yet)
      EXISTS (
        SELECT 1 FROM public.pets
        WHERE pets.id = vet_clinical_notes.pet_id
          AND pets.created_by_vet_id = auth.uid()
          AND pets.owner_id IS NULL
      )
    )
  );

-- 2. vet_clinical_notes: allow select for creator vets
DROP POLICY IF EXISTS "Creator vet can view orphan pet notes" ON public.vet_clinical_notes;

CREATE POLICY "Creator vet can view orphan pet notes"
  ON public.vet_clinical_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = vet_clinical_notes.pet_id
        AND pets.created_by_vet_id = auth.uid()
        AND pets.owner_id IS NULL
    )
  );

-- 3. medical_records: allow vet to read records of their orphan pets
DROP POLICY IF EXISTS "Creator vet can view orphan pet records" ON public.medical_records;

CREATE POLICY "Creator vet can view orphan pet records"
  ON public.medical_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = medical_records.pet_id
        AND pets.created_by_vet_id = auth.uid()
        AND pets.owner_id IS NULL
    )
  );

-- 4. medical_records: allow vet to insert records for their orphan pets
DROP POLICY IF EXISTS "Creator vet can insert orphan pet records" ON public.medical_records;

CREATE POLICY "Creator vet can insert orphan pet records"
  ON public.medical_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = medical_records.pet_id
        AND pets.created_by_vet_id = auth.uid()
        AND pets.owner_id IS NULL
    )
  );

-- 5. medical_records: allow vet to update records of their orphan pets
DROP POLICY IF EXISTS "Creator vet can update orphan pet records" ON public.medical_records;

CREATE POLICY "Creator vet can update orphan pet records"
  ON public.medical_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = medical_records.pet_id
        AND pets.created_by_vet_id = auth.uid()
        AND pets.owner_id IS NULL
    )
  );

-- 6. vet_clinical_notes: allow update for creator vets (edit own notes)
DROP POLICY IF EXISTS "Creator vet can update orphan pet notes" ON public.vet_clinical_notes;

CREATE POLICY "Creator vet can update orphan pet notes"
  ON public.vet_clinical_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = vet_clinical_notes.provider_id
        AND service_providers.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = vet_clinical_notes.pet_id
        AND pets.created_by_vet_id = auth.uid()
        AND pets.owner_id IS NULL
    )
  );
