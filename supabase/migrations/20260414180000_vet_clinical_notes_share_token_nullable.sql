-- Allow vet clinical notes without a share token.
-- Vets with active pet_vet_links should be able to create notes
-- even if the owner hasn't explicitly shared their ficha.

-- 1. Make share_token_id nullable
ALTER TABLE public.vet_clinical_notes
  ALTER COLUMN share_token_id DROP NOT NULL;

-- 2. Replace the insert policy to also allow linked vets
DROP POLICY IF EXISTS "Provider can insert notes with valid token" ON public.vet_clinical_notes;

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
      -- Either has a valid share token
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
      -- Or has an active pet_vet_link
      EXISTS (
        SELECT 1 FROM public.pet_vet_links
        WHERE pet_vet_links.pet_id = vet_clinical_notes.pet_id
          AND pet_vet_links.provider_id = vet_clinical_notes.provider_id
          AND pet_vet_links.status = 'active'
      )
    )
  );

-- 3. Also allow linked vets to view notes of their linked patients
CREATE POLICY "Linked vet can view patient notes"
  ON public.vet_clinical_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_vet_links
      JOIN public.service_providers ON service_providers.id = pet_vet_links.provider_id
      WHERE pet_vet_links.pet_id = vet_clinical_notes.pet_id
        AND service_providers.user_id = auth.uid()
        AND pet_vet_links.status = 'active'
    )
  );
