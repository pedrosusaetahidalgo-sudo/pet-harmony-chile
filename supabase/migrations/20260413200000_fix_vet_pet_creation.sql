-- =============================================================================
-- Fix: permitir que veterinarios creen mascotas sin owner_id
-- Bug: NewPatientForm falla con "null value in column owner_id violates
--      not-null constraint" porque el dueno aun no tiene cuenta.
-- =============================================================================

-- 1. Hacer owner_id nullable (el dueno se asigna cuando acepta la invitacion)
ALTER TABLE public.pets ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Constraint: toda mascota debe tener owner_id O created_by_vet_id
--    (no puede quedar huerfana sin ningun responsable)
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS chk_pet_has_responsible;
ALTER TABLE public.pets ADD CONSTRAINT chk_pet_has_responsible
  CHECK (owner_id IS NOT NULL OR created_by_vet_id IS NOT NULL);

-- 3. RLS: vets pueden ver las mascotas pending que ellos crearon
DROP POLICY IF EXISTS "Vets can view their pending pets" ON public.pets;
CREATE POLICY "Vets can view their pending pets"
  ON public.pets FOR SELECT TO authenticated
  USING (created_by_vet_id = auth.uid() AND owner_id IS NULL);

-- 4. RLS: vets pueden actualizar mascotas pending que ellos crearon
--    (ej: corregir nombre, especie, agregar datos antes de que el dueno acepte)
DROP POLICY IF EXISTS "Vets can update their pending pets" ON public.pets;
CREATE POLICY "Vets can update their pending pets"
  ON public.pets FOR UPDATE TO authenticated
  USING (created_by_vet_id = auth.uid() AND owner_id IS NULL)
  WITH CHECK (created_by_vet_id = auth.uid());

-- 5. RLS: permitir que el dueno reclame la mascota via invitation token
--    (useClaimPetInvitation hace UPDATE SET owner_id = auth.uid())
DROP POLICY IF EXISTS "Anyone can claim pet via invitation token" ON public.pets;
CREATE POLICY "Anyone can claim pet via invitation token"
  ON public.pets FOR UPDATE TO authenticated
  USING (
    owner_id IS NULL
    AND owner_invitation_token IS NOT NULL
    AND owner_invitation_accepted_at IS NULL
  )
  WITH CHECK (
    owner_id = auth.uid()
  );

-- 6. Indice para buscar mascotas pending por vet
CREATE INDEX IF NOT EXISTS idx_pets_created_by_vet
  ON public.pets(created_by_vet_id) WHERE owner_id IS NULL;
