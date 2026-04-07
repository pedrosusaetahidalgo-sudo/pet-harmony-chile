-- =====================================================
-- FIX SOCIAL VISIBILITY POLICIES
-- =====================================================
-- Ensure all social content is visible to authenticated users
-- while maintaining write restrictions to owners only

-- =====================================================
-- 1. PETS: ensure public pets are visible to all authenticated users
-- =====================================================
DROP POLICY IF EXISTS "Public pets viewable by all" ON public.pets;
DROP POLICY IF EXISTS "Owners can view their own pets" ON public.pets;
DROP POLICY IF EXISTS "Dueños pueden ver sus propias mascotas" ON public.pets;
DROP POLICY IF EXISTS "Pets are viewable by authenticated users" ON public.pets;

-- All authenticated users can see public pets + owners see all their own
CREATE POLICY "Pets are viewable by authenticated users"
  ON public.pets FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = owner_id);

-- Owners can insert their own pets
DROP POLICY IF EXISTS "Owners can insert pets" ON public.pets;
DROP POLICY IF EXISTS "Dueños pueden crear mascotas" ON public.pets;
CREATE POLICY "Owners can insert pets"
  ON public.pets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own pets
DROP POLICY IF EXISTS "Owners can update their pets" ON public.pets;
DROP POLICY IF EXISTS "Dueños pueden actualizar sus mascotas" ON public.pets;
CREATE POLICY "Owners can update their pets"
  ON public.pets FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Owners can delete their own pets
DROP POLICY IF EXISTS "Owners can delete their pets" ON public.pets;
DROP POLICY IF EXISTS "Dueños pueden eliminar sus mascotas" ON public.pets;
CREATE POLICY "Owners can delete their pets"
  ON public.pets FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =====================================================
-- 2. POSTS: ensure all posts are visible to authenticated users
-- =====================================================
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by authenticated users" ON public.posts;

CREATE POLICY "Posts are viewable by authenticated users"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 3. USER_FOLLOWS: allow reading follow counts publicly
-- =====================================================
DROP POLICY IF EXISTS "Users can view who they follow" ON public.user_follows;
DROP POLICY IF EXISTS "Users can view their followers" ON public.user_follows;
DROP POLICY IF EXISTS "Follows are viewable by authenticated users" ON public.user_follows;

-- All authenticated users can see follow relationships (needed for follower counts, follow buttons)
CREATE POLICY "Follows are viewable by authenticated users"
  ON public.user_follows FOR SELECT
  TO authenticated
  USING (true);

-- Keep insert/delete restricted to the follower
DROP POLICY IF EXISTS "Users can follow others" ON public.user_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- =====================================================
-- 4. POST_LIKES: ensure likes are readable
-- =====================================================
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.post_likes;
DROP POLICY IF EXISTS "Likes are viewable by authenticated users" ON public.post_likes;

CREATE POLICY "Likes are viewable by authenticated users"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 5. POST_COMMENTS: ensure comments are readable
-- =====================================================
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.post_comments;
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.post_comments;

CREATE POLICY "Comments are viewable by authenticated users"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 6. PROFILES: ensure all profiles visible to authenticated
-- =====================================================
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles son visibles por todos" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile (for new signups)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 7. ADOPTION_POSTS: visible to all authenticated
-- =====================================================
DROP POLICY IF EXISTS "Adoption posts are viewable by all" ON public.adoption_posts;
DROP POLICY IF EXISTS "Adoption posts viewable by authenticated" ON public.adoption_posts;

CREATE POLICY "Adoption posts viewable by authenticated"
  ON public.adoption_posts FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 8. SERVICE_PROVIDERS: visible to all authenticated
-- =====================================================
DROP POLICY IF EXISTS "Approved providers viewable by all" ON public.service_providers;
DROP POLICY IF EXISTS "Service providers viewable by authenticated" ON public.service_providers;

CREATE POLICY "Service providers viewable by authenticated"
  ON public.service_providers FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 9. CONVERSATIONS & MESSAGES: participants only
-- =====================================================
-- These should stay restricted to participants (already correct)

-- =====================================================
-- 10. LOST_PETS: visible to all authenticated
-- =====================================================
DROP POLICY IF EXISTS "Lost pets viewable by all" ON public.lost_pets;
DROP POLICY IF EXISTS "Lost pets viewable by authenticated" ON public.lost_pets;

CREATE POLICY "Lost pets viewable by authenticated"
  ON public.lost_pets FOR SELECT
  TO authenticated
  USING (true);
