-- Allow vets to create pet records for patients whose owners don't have accounts yet
ALTER TABLE pets ADD COLUMN IF NOT EXISTS pending_owner_email TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS created_by_vet_id UUID REFERENCES auth.users(id);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owner_invitation_sent_at TIMESTAMPTZ;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owner_invitation_accepted_at TIMESTAMPTZ;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owner_invitation_token TEXT UNIQUE;

-- QR token for each pet (unique, regenerable)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
CREATE INDEX IF NOT EXISTS idx_pets_qr_token ON pets(qr_token);
CREATE INDEX IF NOT EXISTS idx_pets_pending ON pets(pending_owner_email) WHERE owner_id IS NULL;
