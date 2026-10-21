-- Discontinued courses: the last school year a course was taught.
--
-- When a faculty drops a course from its plan, the row stays: it carries
-- reviews, its page is indexed, and students who took it should still be able
-- to review it. Until now the only trace was "no course_offerings", which also
-- means "taught, semester unknown" (FLUL language options, Nova IMS degrees
-- with no published calendar). This column says it explicitly.
--
-- NULL means the course is still taught. A value uses the feedback.school_year
-- encoding (2025 = 2025/2026): the course was last taught in that school year
-- and is not taught from the next one on.
--
-- What it changes:
--   - Degree pages list it in a collapsed "no longer taught" section, never
--     under a year/semester, and the year/term filters never match it.
--   - Its course page says it is no longer taught, and since when.
--   - Search still finds it, ranked after courses still taught, with a tag.
--   - Feedback is accepted for school years up to last_taught_year only.
--   - The AI chat is told, so it doesn't recommend taking it.
-- A course that comes back is set to NULL again.
--
-- A discontinued course should have no course_offerings (check 605).
--
-- Re-runnable.

ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "last_taught_year" integer;

DO $$ BEGIN
  ALTER TABLE "courses" ADD CONSTRAINT "courses_valid_last_taught_year"
    CHECK ("last_taught_year" IS NULL OR ("last_taught_year" >= 2000 AND "last_taught_year" <= 2100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
