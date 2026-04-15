-- ============================================================================
-- RLS AUDIT: Missing tables
-- Generated: 2026-04-15
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- ============================================================================
--
-- FULL TABLE INVENTORY (126 tables from migrations):
--
-- TABLES WITH RLS ALREADY ENABLED (124 tables):
--   profiles, pets, medical_records, appointments, lost_pets, user_achievements,
--   user_stats, posts, post_likes, post_comments, places, adoption_posts,
--   adoption_interests, adoption_messages, user_roles, verification_requests,
--   activities, user_activities, daily_challenges, user_challenges, virtual_routes,
--   user_routes, rewards, user_rewards, dog_walker_profiles, walk_bookings,
--   walk_routes, walk_reports, walk_reviews, vet_profiles, vet_bookings,
--   vet_visits, vet_documents, vet_reviews, pet_documents, shared_walks,
--   shared_walk_participants, dogsitter_profiles, dogsitter_bookings,
--   dogsitter_reports, dogsitter_reviews, dogsitter_messages, service_promotions,
--   conversations, messages, review_helpful_votes, trainer_profiles,
--   training_bookings, training_reviews, training_reports, provider_availability,
--   platform_config, cart_items, orders, order_items, provider_balances,
--   balance_transactions, service_providers, provider_service_offerings,
--   adoption_shelters, guardian_levels, user_guardian_progress, pet_paw_progress,
--   user_mission_progress, paw_badges, user_paw_badges, paw_shop_rewards,
--   user_shop_redemptions, paw_point_transactions, achievements, missions,
--   user_missions, points_history, user_follows, user_blocks, user_reports,
--   subscriptions, partners, medical_documents, medical_share_tokens,
--   pet_reminders, review_invitations, provider_verifications, groomer_profiles,
--   vet_service_prices, vet_clinical_notes, paw_card_collections, content_reports,
--   ai_cache, partner_submissions, consultation_templates, periodic_reports,
--   memorial_events, bereavement_safety_logs, bereavement_chat_messages,
--   vet_pet_relationships, paw_game_monthly_rankings, pending_reviews,
--   community_groups, community_group_members, community_group_messages,
--   vet_reference_prices, post_saves, pet_stories, post_reports, pet_vet_links,
--   pet_routines, routine_completions, ai_usage, notifications, admin_access,
--   admin_audit_log, system_health_log, vet_verification_results, error_logs,
--   analytics_events, vet_quick_notes, feedback_in_app
--
-- TABLES MISSING RLS (2 tables):
--   1. paw_missions — DROPped and re-created in 20260504100000 without
--      re-enabling RLS. Seed/definition table (no user_id) but needs
--      RLS + authenticated read policy for defense in depth.
--   2. vaccination_protocols — Lookup/seed table (no user_id). Created
--      in 20260423000001 without RLS. Needs RLS + authenticated read.
--
-- TABLES INTENTIONALLY WITHOUT RLS (0):
--   All user-data tables already have RLS. The two tables above are
--   seed/lookup tables being added for defense in depth.
-- ============================================================================

-- 1. paw_missions — re-enable RLS lost during DROP+CREATE in 20260504100000
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'paw_missions') THEN
    ALTER TABLE public.paw_missions ENABLE ROW LEVEL SECURITY;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'paw_missions: RLS enable failed: %', SQLERRM;
END $$;

-- Policy: any authenticated user can read missions (seed/definition data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'paw_missions' AND policyname = 'Authenticated users can read paw_missions'
  ) THEN
    CREATE POLICY "Authenticated users can read paw_missions"
      ON public.paw_missions FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'paw_missions SELECT policy failed: %', SQLERRM;
END $$;

-- 2. vaccination_protocols — enable RLS (defense in depth for lookup table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vaccination_protocols') THEN
    ALTER TABLE public.vaccination_protocols ENABLE ROW LEVEL SECURITY;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'vaccination_protocols: RLS enable failed: %', SQLERRM;
END $$;

-- Policy: any authenticated user can read vaccination protocols (lookup data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vaccination_protocols' AND policyname = 'Authenticated users can read vaccination_protocols'
  ) THEN
    CREATE POLICY "Authenticated users can read vaccination_protocols"
      ON public.vaccination_protocols FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'vaccination_protocols SELECT policy failed: %', SQLERRM;
END $$;
