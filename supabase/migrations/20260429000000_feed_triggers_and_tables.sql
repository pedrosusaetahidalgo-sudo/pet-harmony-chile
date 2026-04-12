-- Feed redesign: triggers para contadores + tablas nuevas (saves, stories, reports)
-- Aplicar manualmente desde Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Trigger: mantener posts.likes_count sincronizado
-- ============================================================
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- ============================================================
-- 2. Trigger: mantener posts.comments_count sincronizado
-- ============================================================
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ============================================================
-- 3. Tabla: post_saves (bookmarks)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saves" ON post_saves
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. Tabla: pet_stories (stories de 24h)
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_url text NOT NULL,
  media_type text DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pet_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are public while active" ON pet_stories
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users manage own stories" ON pet_stories
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pet_stories_active
  ON pet_stories (expires_at DESC) WHERE expires_at > now();

-- ============================================================
-- 5. Tabla: post_reports (moderacion)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'misinformation', 'other')),
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report posts" ON post_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- 6. Indices de performance para el feed
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts (user_id, created_at DESC);

-- ============================================================
-- 7. Sync: recalcular contadores existentes que estaban desincronizados
-- ============================================================
UPDATE posts p SET
  likes_count = (SELECT count(*) FROM post_likes pl WHERE pl.post_id = p.id),
  comments_count = (SELECT count(*) FROM post_comments pc WHERE pc.post_id = p.id);
