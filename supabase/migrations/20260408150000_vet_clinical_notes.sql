-- Notas clinicas escritas por veterinarios sobre mascotas compartidas via token.
-- Cierra el loop B2C->B2B: el vet agrega notas a la ficha del dueno.

CREATE TABLE IF NOT EXISTS public.vet_clinical_notes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token_id uuid        NOT NULL REFERENCES public.medical_share_tokens(id) ON DELETE CASCADE,
  provider_id    uuid        NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  pet_id         uuid        NOT NULL,
  note_type      text        NOT NULL CHECK (note_type IN ('consulta','vacuna','control','cirugia','urgencia','otro')),
  title          text        NOT NULL,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indices para queries frecuentes
CREATE INDEX idx_vet_clinical_notes_pet_date
  ON public.vet_clinical_notes (pet_id, created_at DESC);

CREATE INDEX idx_vet_clinical_notes_provider
  ON public.vet_clinical_notes (provider_id);

-- RLS
ALTER TABLE public.vet_clinical_notes ENABLE ROW LEVEL SECURITY;

-- El dueno de la mascota puede ver las notas
CREATE POLICY "Pet owner can view vet notes"
  ON public.vet_clinical_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = vet_clinical_notes.pet_id
        AND pets.owner_id = auth.uid()
    )
  );

-- El provider que creo la nota puede verla
CREATE POLICY "Provider can view own notes"
  ON public.vet_clinical_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = vet_clinical_notes.provider_id
        AND service_providers.user_id = auth.uid()
    )
  );

-- Solo el provider puede insertar notas (requiere share token valido)
CREATE POLICY "Provider can insert notes with valid token"
  ON public.vet_clinical_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = vet_clinical_notes.provider_id
        AND service_providers.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.medical_share_tokens
      WHERE medical_share_tokens.id = vet_clinical_notes.share_token_id
        AND medical_share_tokens.expires_at > now()
        AND medical_share_tokens.is_revoked = false
    )
  );

-- Solo el provider puede actualizar sus propias notas
CREATE POLICY "Provider can update own notes"
  ON public.vet_clinical_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = vet_clinical_notes.provider_id
        AND service_providers.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.vet_clinical_notes IS 'Notas clinicas escritas por veterinarios sobre mascotas compartidas via token de sharing.';
