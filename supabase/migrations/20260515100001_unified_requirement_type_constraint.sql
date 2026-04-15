-- Paw Friend migration — 2026-05-15
-- Unifies the requirement_type CHECK constraint on paw_missions to include ALL 14 valid types.
-- Previous constraints only covered subsets (original 11 from 20260504100000,
-- then extended to 14 in 20260515000002). This migration ensures the canonical
-- list is applied regardless of which prior migrations ran.

DO $$
BEGIN
  ALTER TABLE paw_missions DROP CONSTRAINT IF EXISTS paw_missions_requirement_type_check;

  ALTER TABLE paw_missions ADD CONSTRAINT paw_missions_requirement_type_check
    CHECK (requirement_type IN (
      'collect_count',
      'collect_species',
      'collect_species_count',
      'collect_rarity',
      'collect_all_rarities',
      'be_collected',
      'collect_owners',
      'complete_reminders',
      'book_vet',
      'complete_profile',
      'memorial',
      'log_vaccine',
      'leave_review',
      'complete_checklist'
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'paw_missions_requirement_type_check constraint update failed: %', SQLERRM;
END $$;
