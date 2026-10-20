-- Final grades per course and school year: what students actually got.
--
-- Rating and workload say how a course felt; this says how it went. A student
-- choosing between two heavy courses asked for exactly this (chat, 2026-10-19),
-- and we had nothing to give them.
--
-- Entered by hand for now, from official sources (IST's QUC results, a
-- faculty's published grade stats, or a link a student sends us). One row per
-- (course, school year). Distributions and pass rates can become columns here
-- later without changing what a row means.
--
-- school_year uses the feedback.school_year encoding (2025 = 2025/2026).
-- average_grade is on the Portuguese 0-20 scale.
--
-- Stored against one course row, read across its `identical` set, like reviews.
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "course_grade_stats" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "school_year" integer NOT NULL,
  "average_grade" real NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "course_grade_stats_course_year_unique" UNIQUE ("course_id", "school_year"),
  CONSTRAINT "course_grade_stats_valid_grade" CHECK (
    "average_grade" >= 0 AND "average_grade" <= 20
  )
);
