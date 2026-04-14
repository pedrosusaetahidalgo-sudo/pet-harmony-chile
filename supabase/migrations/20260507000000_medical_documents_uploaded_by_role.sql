-- Add uploaded_by_role column to medical_documents
-- Tracks whether a document was uploaded by the pet owner or a linked vet.
ALTER TABLE public.medical_documents
  ADD COLUMN IF NOT EXISTS uploaded_by_role TEXT DEFAULT 'owner'
  CHECK (uploaded_by_role IN ('owner', 'vet'));

-- Backfill existing rows as owner-uploaded
UPDATE public.medical_documents SET uploaded_by_role = 'owner' WHERE uploaded_by_role IS NULL;

-- Update RLS: allow linked vets to SELECT documents for pets they are linked to
DROP POLICY IF EXISTS "Vets can view linked pet medical documents" ON public.medical_documents;
CREATE POLICY "Vets can view linked pet medical documents"
  ON public.medical_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pet_vet_links pvl
      JOIN service_providers sp ON sp.id = pvl.provider_id
      WHERE pvl.pet_id = medical_documents.pet_id
        AND sp.user_id = auth.uid()
        AND pvl.status = 'active'
    )
  );

-- Allow linked vets to INSERT documents for pets they are linked to
DROP POLICY IF EXISTS "Vets can insert linked pet medical documents" ON public.medical_documents;
CREATE POLICY "Vets can insert linked pet medical documents"
  ON public.medical_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pet_vet_links pvl
      JOIN service_providers sp ON sp.id = pvl.provider_id
      WHERE pvl.pet_id = medical_documents.pet_id
        AND sp.user_id = auth.uid()
        AND pvl.status = 'active'
    )
  );

-- Allow pet owners to delete any document on their pet (including vet-uploaded)
DROP POLICY IF EXISTS "Owners can delete their medical documents" ON public.medical_documents;
CREATE POLICY "Owners can delete their medical documents"
  ON public.medical_documents FOR DELETE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = medical_documents.pet_id
        AND pets.owner_id = auth.uid()
    )
  );
