-- "O meu percurso" v1: the degrees a student says they take or took.
--
-- Declared data, not verified. Only rows the student confirmed or entered live
-- here: the guess we make from their reviews is computed on read, never stored.
--
-- School years use the feedback.school_year encoding (2025 = 2025/2026). Both
-- are optional. end_school_year is the last year enrolled; NULL = ongoing or
-- unknown.
--
-- user_id cascades: this is profile data about the person, so deleting the
-- account deletes it instead of transferring it to the anonymised user.
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "user_degrees" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "start_school_year" integer,
  "end_school_year" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_degrees_user_degree_unique" UNIQUE ("user_id", "degree_id"),
  CONSTRAINT "user_degrees_years_order" CHECK (
    "end_school_year" IS NULL
    OR "start_school_year" IS NULL
    OR "end_school_year" >= "start_school_year"
  )
);

CREATE INDEX IF NOT EXISTS "user_degrees_degree_id_idx"
  ON "user_degrees" ("degree_id");

-- We guess a student's degree from their reviews exactly once. Any answer
-- (confirm, edit, or "not my degree") sets this, and the guess never comes back,
-- even if they later remove every degree.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "degree_inference_resolved_at" timestamp with time zone;
