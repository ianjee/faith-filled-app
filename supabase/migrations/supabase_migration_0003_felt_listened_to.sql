-- ============================================================================
-- 0003 — Add "Did you feel listened to?" to the outcome survey
-- ============================================================================
-- The initial plan's outcome-based survey spec calls for this question
-- alongside pain before/after, ROM, sleep, stress, and recommendation —
-- it was the one field missing from the original 0001 schema.
-- ============================================================================

alter table surveys
  add column if not exists felt_listened_to boolean;

select 'Migration 0003 completed successfully' as status;
