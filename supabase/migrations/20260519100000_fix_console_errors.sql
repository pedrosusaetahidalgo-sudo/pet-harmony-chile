-- Fix console errors: feedback_in_app RLS, vet_clinical_notes pet FK
-- These tables exist but are missing RLS policies or FK constraints
-- that cause 403/400 errors in the provider dashboard.

-- ══════════════════════════════════════════════════════════════
-- 1. feedback_in_app — create table if not exists + RLS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.feedback_in_app (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bug', 'idea', 'experience')),
  description text NOT NULL,
  route text,
  role text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'dismissed')),
  admin_notes text,
  admin_response text,
  admin_responded_at timestamptz,
  admin_liked boolean DEFAULT false,
  paw_points_awarded integer DEFAULT 0,
  user_display_name text,
  app_rating integer CHECK (app_rating IS NULL OR (app_rating >= 1 AND app_rating <= 5)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback_in_app ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback
DROP POLICY IF EXISTS "Users can read own feedback" ON public.feedback_in_app;
CREATE POLICY "Users can read own feedback"
  ON public.feedback_in_app FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback_in_app;
CREATE POLICY "Users can insert own feedback"
  ON public.feedback_in_app FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback (using SECURITY DEFINER helper to avoid RLS recursion on admin_access)
DROP POLICY IF EXISTS "Admins can read all feedback" ON public.feedback_in_app;
CREATE POLICY "Admins can read all feedback"
  ON public.feedback_in_app FOR SELECT
  USING (public.is_active_admin(auth.uid()));

-- Admins can update feedback (status, response, etc.)
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback_in_app;
CREATE POLICY "Admins can update feedback"
  ON public.feedback_in_app FOR UPDATE
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ══════════════════════════════════════════════════════════════
-- 2. vet_clinical_notes — add FK to pets if missing
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vet_clinical_notes_pet_id_fkey'
      AND table_name = 'vet_clinical_notes'
  ) THEN
    ALTER TABLE public.vet_clinical_notes
      ADD CONSTRAINT vet_clinical_notes_pet_id_fkey
      FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;
  END IF;
END $$;
