-- Migration: create post_saves and content_reports tables
-- These tables are referenced by the feed system (useFeedActions.ts)
-- but were never created, causing silent 42P01 errors.

-- ──────────────────────────────────────────────────
-- post_saves — users save/bookmark posts
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saves"
  ON post_saves FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_post_saves_user ON post_saves(user_id);
CREATE INDEX idx_post_saves_post ON post_saves(post_id);

-- ──────────────────────────────────────────────────
-- content_reports — users report inappropriate posts
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'other',
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can see own reports
CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can see all reports (via admin_access)
CREATE POLICY "Admins can manage reports"
  ON content_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_access WHERE user_id = auth.uid())
  );

CREATE INDEX idx_content_reports_post ON content_reports(post_id);
CREATE INDEX idx_content_reports_status ON content_reports(status) WHERE status = 'pending';
