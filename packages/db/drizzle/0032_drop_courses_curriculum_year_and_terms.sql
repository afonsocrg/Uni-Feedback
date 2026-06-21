-- Drop the legacy course scheduling columns (Phase 4 of 4, FINAL).
--
-- ⚠️  DO NOT RUN until the code switchover is fully deployed:
--   * No read path selects courses.curriculum_year / courses.terms anymore
--     (offerings are read via course_offerings + academic_terms).
--   * Admin endpoints write offerings, not the terms array.
--   * api-client / frontends consume offerings[].
-- Running this earlier breaks every course read. Verify 0029-0031 are applied
-- and the new model is live first.
--
-- Pre-drop sanity check (should both be 0 before dropping):
--   SELECT
--     count(*) FILTER (
--       WHERE c.terms IS NOT NULL AND c.terms <> '[]'::jsonb
--         AND NOT EXISTS (SELECT 1 FROM course_offerings o WHERE o.course_id = c.id)
--     ) AS terms_without_offerings,
--     count(*) FILTER (
--       WHERE c.curriculum_year IS NOT NULL
--         AND NOT EXISTS (
--           SELECT 1 FROM course_offerings o
--           WHERE o.course_id = c.id AND o.curriculum_year = c.curriculum_year
--         )
--     ) AS years_without_offerings
--   FROM courses c;

ALTER TABLE "courses" DROP COLUMN "curriculum_year";
ALTER TABLE "courses" DROP COLUMN "terms";
