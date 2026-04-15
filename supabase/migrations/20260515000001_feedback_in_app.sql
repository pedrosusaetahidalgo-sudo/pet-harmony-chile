-- Feedback in-app: users can report bugs, suggest ideas, or share experiences
-- Visible to admins in the admin panel

CREATE TABLE IF NOT EXISTS feedback_in_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'idea', 'experience')),
  description TEXT NOT NULL CHECK (length(description) > 0 AND length(description) <= 2000),
  route TEXT, -- page where feedback was submitted
  role TEXT, -- owner | provider
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_in_app_status ON feedback_in_app(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_in_app_user ON feedback_in_app(user_id);

ALTER TABLE feedback_in_app ENABLE ROW LEVEL SECURITY;

-- Users can insert and read their own feedback
CREATE POLICY "feedback_own_insert"
  ON feedback_in_app FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feedback_own_read"
  ON feedback_in_app FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read and update all feedback
CREATE POLICY "feedback_admin_all"
  ON feedback_in_app FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true
    )
  );
