-- Vet-pet relationship types
DO $$ BEGIN
  CREATE TYPE vet_pet_relationship_type AS ENUM ('primary_vet', 'consulting', 'emergency', 'specialist');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vet_pet_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  relationship_type vet_pet_relationship_type NOT NULL DEFAULT 'consulting',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vet_id, pet_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_vet_pet_rel_vet ON vet_pet_relationships(vet_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vet_pet_rel_pet ON vet_pet_relationships(pet_id) WHERE revoked_at IS NULL;

ALTER TABLE vet_pet_relationships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "vets_see_their_relationships" ON vet_pet_relationships FOR SELECT USING (vet_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "owners_see_relationships_for_their_pets" ON vet_pet_relationships FOR SELECT USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "owners_can_revoke" ON vet_pet_relationships FOR UPDATE USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "vets_can_insert" ON vet_pet_relationships FOR INSERT WITH CHECK (vet_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
