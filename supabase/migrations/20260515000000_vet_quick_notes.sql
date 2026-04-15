-- Quick notes: post-it style notes per patient for vets
-- Not a formal clinical record, just quick reminders (e.g., "prefiere bozal azul")

CREATE TABLE IF NOT EXISTS vet_quick_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  color TEXT DEFAULT 'yellow' CHECK (color IN ('yellow', 'blue', 'green', 'pink', 'gray')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by provider+pet
CREATE INDEX IF NOT EXISTS idx_vet_quick_notes_provider_pet
  ON vet_quick_notes(provider_id, pet_id);

-- RLS
ALTER TABLE vet_quick_notes ENABLE ROW LEVEL SECURITY;

-- Vet can CRUD their own notes
CREATE POLICY "vet_quick_notes_owner"
  ON vet_quick_notes
  FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- Pet owner can read notes about their pet
CREATE POLICY "vet_quick_notes_pet_owner_read"
  ON vet_quick_notes
  FOR SELECT
  USING (
    pet_id IN (
      SELECT id FROM pets WHERE owner_id = auth.uid()
    )
  );
