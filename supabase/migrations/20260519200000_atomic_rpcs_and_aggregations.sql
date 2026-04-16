-- ══════════════════════════════════════════════════════════════
-- Atomic RPCs + Server-side aggregations
-- Replaces multi-step client mutations with single transactions
-- and moves heavy client-side logic to Postgres.
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────
-- P0: claim_pet_by_invitation — atomic claim (was 5 steps)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_pet_by_invitation(
  p_invitation_token TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet RECORD;
  v_provider_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Find pet by invitation token
  SELECT id, name, owner_id, created_by_vet_id, owner_invitation_accepted_at
  INTO v_pet
  FROM pets
  WHERE owner_invitation_token = p_invitation_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  -- 2. Already claimed?
  IF v_pet.owner_invitation_accepted_at IS NOT NULL THEN
    IF v_pet.owner_id = p_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_yours', 'pet_name', v_pet.name);
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'claimed_by_other');
    END IF;
  END IF;

  -- 3. Assign owner (atomic)
  UPDATE pets
  SET owner_id = p_user_id,
      owner_invitation_accepted_at = now()
  WHERE id = v_pet.id;

  -- 4. Create pet_vet_link if vet exists
  IF v_pet.created_by_vet_id IS NOT NULL THEN
    SELECT id INTO v_provider_id
    FROM service_providers
    WHERE user_id = v_pet.created_by_vet_id
    LIMIT 1;

    IF v_provider_id IS NOT NULL THEN
      INSERT INTO pet_vet_links (pet_id, owner_id, provider_id, status, responded_at)
      VALUES (v_pet.id, p_user_id, v_provider_id, 'active', now())
      ON CONFLICT (pet_id, provider_id) DO UPDATE
        SET status = 'active', owner_id = p_user_id, responded_at = now();
    END IF;
  END IF;

  -- 5. Create default reminders
  INSERT INTO pet_reminders (pet_id, owner_id, type, title, due_date)
  VALUES
    (v_pet.id, p_user_id, 'checkup',
     'Control veterinario de ' || v_pet.name,
     (CURRENT_DATE + INTERVAL '90 days')::date),
    (v_pet.id, p_user_id, 'grooming',
     'Baño y peluquería de ' || v_pet.name,
     (CURRENT_DATE + INTERVAL '30 days')::date);

  RETURN jsonb_build_object(
    'success', true,
    'pet_id', v_pet.id,
    'pet_name', v_pet.name,
    'vet_linked', v_provider_id IS NOT NULL
  );
END;
$$;


-- ────────────────────────────────────────────────────────
-- P0: auto_claim_pets_by_email — atomic batch claim
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_claim_pets_by_email(
  p_user_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet RECORD;
  v_provider_id UUID;
  v_claimed_count INT := 0;
  v_claimed_names TEXT[] := '{}';
BEGIN
  FOR v_pet IN
    SELECT id, name, created_by_vet_id
    FROM pets
    WHERE pending_owner_email = lower(p_email)
      AND owner_id IS NULL
      AND owner_invitation_accepted_at IS NULL
  LOOP
    -- Assign owner
    UPDATE pets
    SET owner_id = p_user_id,
        owner_invitation_accepted_at = now()
    WHERE id = v_pet.id;

    v_claimed_count := v_claimed_count + 1;
    v_claimed_names := array_append(v_claimed_names, v_pet.name);

    -- Create vet link if applicable
    IF v_pet.created_by_vet_id IS NOT NULL THEN
      SELECT id INTO v_provider_id
      FROM service_providers
      WHERE user_id = v_pet.created_by_vet_id
      LIMIT 1;

      IF v_provider_id IS NOT NULL THEN
        INSERT INTO pet_vet_links (pet_id, owner_id, provider_id, status, responded_at)
        VALUES (v_pet.id, p_user_id, v_provider_id, 'active', now())
        ON CONFLICT (pet_id, provider_id) DO UPDATE
          SET status = 'active', owner_id = p_user_id, responded_at = now();
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'claimed_count', v_claimed_count,
    'claimed_names', to_jsonb(v_claimed_names)
  );
END;
$$;


-- ────────────────────────────────────────────────────────
-- P2: get_paw_card_ranking — server-side aggregation
-- (replaces client-side 500-row fallback)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_paw_card_ranking(
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  "petId" UUID,
  "petName" TEXT,
  species TEXT,
  "photoUrl" TEXT,
  "pawCardId" TEXT,
  "holoPattern" TEXT,
  "ownerName" TEXT,
  "collectorCount" BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS "petId",
    p.name AS "petName",
    p.species,
    p.photo_url AS "photoUrl",
    COALESCE(p.paw_card_id, '') AS "pawCardId",
    COALESCE(p.holo_pattern, 'holo-none') AS "holoPattern",
    pr.display_name AS "ownerName",
    COUNT(pcc.id) AS "collectorCount"
  FROM paw_card_collections pcc
  JOIN pets p ON p.id = pcc.pet_id
  LEFT JOIN profiles pr ON pr.id = p.owner_id
  GROUP BY p.id, p.name, p.species, p.photo_url, p.paw_card_id, p.holo_pattern, pr.display_name
  ORDER BY COUNT(pcc.id) DESC
  LIMIT result_limit;
$$;


-- ────────────────────────────────────────────────────────
-- P3: archive_pet_memorial — atomic memorial + reminders
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.archive_pet_memorial(
  p_pet_id UUID,
  p_passed_away_at TIMESTAMPTZ,
  p_cause TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Verify ownership
  SELECT owner_id INTO v_owner_id
  FROM pets WHERE id = p_pet_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 1. Update pet to memorial status
  UPDATE pets
  SET lifecycle_status = 'memorial',
      passed_away_at = p_passed_away_at,
      passed_away_registered_at = now(),
      passed_away_cause = p_cause,
      memorial_message = p_message,
      memorial_undo_until = now() + INTERVAL '24 hours',
      memorial_visibility = 'memorial_section_only',
      memorial_remembrance_enabled = false
  WHERE id = p_pet_id;

  -- 2. Complete all pending reminders
  UPDATE pet_reminders
  SET is_completed = true, completed_at = now()
  WHERE pet_id = p_pet_id AND is_completed = false;

  RETURN TRUE;
END;
$$;


-- ────────────────────────────────────────────────────────
-- P1: get_mission_progress — server-side mission calc
-- (replaces ~200 lines of client-side logic)
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_mission_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_missions JSONB;
  v_own_pet_count INT;
  v_collected_count INT;
  v_distinct_species INT;
  v_be_collected_count INT;
  v_distinct_owners INT;
  v_completed_reminders INT;
  v_bookings_count INT;
  v_reviews_count INT;
  v_vaccine_count INT;
  v_has_complete_profile BOOLEAN;
  v_own_pet_ids UUID[];
  v_collected_species TEXT[];
  v_collected_rarities TEXT[];
  v_distinct_rarities INT;
BEGIN
  -- Get own pet IDs
  SELECT array_agg(id) INTO v_own_pet_ids
  FROM pets
  WHERE owner_id = p_user_id AND lifecycle_status = 'active';

  v_own_pet_ids := COALESCE(v_own_pet_ids, '{}');

  -- Collected cards count
  SELECT COUNT(*) INTO v_collected_count
  FROM paw_card_collections WHERE collector_id = p_user_id;

  -- Distinct species (own + collected)
  SELECT COUNT(DISTINCT lower(p.species)) INTO v_distinct_species
  FROM (
    SELECT species FROM pets WHERE owner_id = p_user_id AND lifecycle_status = 'active'
    UNION ALL
    SELECT p2.species FROM paw_card_collections pcc
    JOIN pets p2 ON p2.id = pcc.pet_id
    WHERE pcc.collector_id = p_user_id
  ) p;

  -- Be-collected count (how many times user's pets were collected)
  SELECT COUNT(*) INTO v_be_collected_count
  FROM paw_card_collections
  WHERE pet_id = ANY(v_own_pet_ids);

  -- Distinct owners from collected pets
  SELECT COUNT(DISTINCT p.owner_id) INTO v_distinct_owners
  FROM paw_card_collections pcc
  JOIN pets p ON p.id = pcc.pet_id
  WHERE pcc.collector_id = p_user_id;

  -- Core action counts
  SELECT COUNT(*) INTO v_completed_reminders
  FROM pet_reminders WHERE owner_id = p_user_id AND is_completed = true;

  SELECT COUNT(*) INTO v_bookings_count
  FROM bookings WHERE user_id = p_user_id AND status = 'confirmed';

  SELECT COUNT(*) INTO v_reviews_count
  FROM service_reviews WHERE reviewer_id = p_user_id;

  SELECT COUNT(*) INTO v_vaccine_count
  FROM medical_records WHERE owner_id = p_user_id AND record_type = 'vacuna';

  -- Complete profile check (any pet with >=80% fields filled)
  SELECT EXISTS(
    SELECT 1 FROM pets
    WHERE owner_id = p_user_id AND lifecycle_status = 'active'
      AND (
        (CASE WHEN species IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN breed IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN birth_date IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN gender IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN weight IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN photo_url IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN microchip_number IS NOT NULL THEN 1 ELSE 0 END
        )::float / 7.0 >= 0.8
      )
  ) INTO v_has_complete_profile;

  -- Distinct rarity count from collected pets
  SELECT COUNT(DISTINCT
    CASE
      WHEN COALESCE(us.total_points, 0) >= 95 THEN 'mythic'
      WHEN COALESCE(us.total_points, 0) >= 80 THEN 'legendary'
      WHEN COALESCE(us.total_points, 0) >= 60 THEN 'epic'
      WHEN COALESCE(us.total_points, 0) >= 40 THEN 'rare'
      WHEN COALESCE(us.total_points, 0) >= 20 THEN 'uncommon'
      ELSE 'common'
    END
  ) INTO v_distinct_rarities
  FROM paw_card_collections pcc
  JOIN pets p ON p.id = pcc.pet_id
  LEFT JOIN user_stats us ON us.user_id = p.owner_id
  WHERE pcc.collector_id = p_user_id;

  RETURN jsonb_build_object(
    'collected_count', v_collected_count,
    'distinct_species', v_distinct_species,
    'be_collected_count', v_be_collected_count,
    'distinct_owners', v_distinct_owners,
    'completed_reminders', v_completed_reminders,
    'bookings_count', v_bookings_count,
    'reviews_count', v_reviews_count,
    'vaccine_count', v_vaccine_count,
    'has_complete_profile', v_has_complete_profile,
    'distinct_rarities', v_distinct_rarities
  );
END;
$$;


-- ────────────────────────────────────────────────────────
-- Fix: feedback_in_app admin policies use is_active_admin
-- (replaces broken migration 20260519100000)
-- ────────────────────────────────────────────────────────

-- Ensure the helper function exists (idempotent)
CREATE OR REPLACE FUNCTION public.is_active_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = check_user_id
      AND is_active = true
  );
$$;

-- Drop old policies (both naming conventions)
DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback_in_app;
DROP POLICY IF EXISTS "feedback_own_insert" ON public.feedback_in_app;
DROP POLICY IF EXISTS "feedback_own_read" ON public.feedback_in_app;
DROP POLICY IF EXISTS "Users can read own feedback" ON public.feedback_in_app;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback_in_app;
DROP POLICY IF EXISTS "Admins can read all feedback" ON public.feedback_in_app;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback_in_app;

-- Recreate clean policies
CREATE POLICY "feedback_own_read"
  ON public.feedback_in_app FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "feedback_own_insert"
  ON public.feedback_in_app FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feedback_admin_select"
  ON public.feedback_in_app FOR SELECT
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "feedback_admin_update"
  ON public.feedback_in_app FOR UPDATE
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));
