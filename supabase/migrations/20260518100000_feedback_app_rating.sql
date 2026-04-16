-- Add app_rating column to feedback_in_app for post-feedback star rating
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.

ALTER TABLE feedback_in_app
  ADD COLUMN IF NOT EXISTS app_rating SMALLINT CHECK (app_rating BETWEEN 1 AND 5);

-- Index for quick average calculation in admin dashboard
CREATE INDEX IF NOT EXISTS idx_feedback_in_app_rating
  ON feedback_in_app(app_rating) WHERE app_rating IS NOT NULL;
