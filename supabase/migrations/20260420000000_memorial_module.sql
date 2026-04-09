-- Memorial module: lifecycle_status + memorial tables
-- NO aplicar automáticamente. El dueño aplica desde Supabase Dashboard > SQL Editor.

-- 1. Extend pets table with lifecycle status
ALTER TABLE pets ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active'
  CHECK (lifecycle_status IN ('active', 'memorial'));

ALTER TABLE pets ADD COLUMN IF NOT EXISTS passed_away_at TIMESTAMPTZ NULL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS passed_away_registered_at TIMESTAMPTZ NULL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS passed_away_cause TEXT NULL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS memorial_visibility TEXT NULL DEFAULT 'memorial_section_only'
  CHECK (memorial_visibility IN ('dashboard_main', 'memorial_section_only', 'hidden'));
ALTER TABLE pets ADD COLUMN IF NOT EXISTS memorial_remembrance_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS memorial_message TEXT NULL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS memorial_photo_url TEXT NULL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS memorial_undo_until TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_pets_lifecycle_status ON pets(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_pets_owner_lifecycle ON pets(owner_id, lifecycle_status);

-- 2. Memorial events log
CREATE TABLE IF NOT EXISTS memorial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'passing_registered',
    'passing_unregistered',
    'tribute_added',
    'photo_added',
    'message_added',
    'vet_notified',
    'visibility_changed',
    'remembrance_enabled',
    'remembrance_disabled'
  )),
  content TEXT NULL,
  media_url TEXT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memorial_events_pet ON memorial_events(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memorial_events_owner ON memorial_events(owner_id);

ALTER TABLE memorial_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access_memorial_events"
ON memorial_events FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 3. Safety logs for bereavement assistant (admin-only)
CREATE TABLE IF NOT EXISTS bereavement_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'self_harm_mention',
    'suicidal_ideation',
    'extreme_distress',
    'crisis_keywords',
    'derived_to_resources'
  )),
  detected_phrase TEXT NULL,
  resources_provided TEXT[],
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_logs_unreviewed ON bereavement_safety_logs(reviewed) WHERE reviewed = FALSE;

ALTER TABLE bereavement_safety_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can see safety logs
CREATE POLICY "admin_only_safety_logs"
ON bereavement_safety_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
  )
);
