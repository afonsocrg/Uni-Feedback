-- Campuses, and the facts about a degree that don't depend on language.
--
-- CAMPUSES. Each campus belongs to one faculty: two faculties of the same university
-- have their own buildings, addresses, contacts and map locations (FLUL and FDUL are
-- both ULisboa). A faculty can have several (IST: Alameda, Taguspark). Degrees link to
-- campuses many-to-many: a degree can run on several campuses, or on another faculty's
-- campus (some Nova SBE degrees run at the FCT campus in Caparica). No link means we
-- don't know. Contacts and coordinates come from the DGES guide and the faculties' sites.
-- degrees.campus (free text) stays until the code reads these tables, then goes.
--
-- DEGREE FACTS. Nullable columns on degrees: NULL means unknown, never guessed and never
-- an empty string. Filled from the faculties' pages and the DGES guide
-- (prds/content_rich_pages.md).
--   ects                total ECTS of the degree
--   duration_semesters  normal duration
--   teaching_language   'pt', 'en' or 'pt_en' (taught in both, or switches to English
--                       when international students enrol)
--   schedule            'daytime', 'after_work' (pós-laboral) or 'both'
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "campuses" (
  "id" serial PRIMARY KEY,
  "faculty_id" integer NOT NULL REFERENCES "faculties"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "address" text,
  "postal_code" text,
  "city" text,
  "latitude" double precision,
  "longitude" double precision,
  "phone" text,
  "email" text,
  "url" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "campuses_faculty_id_slug_unique" UNIQUE ("faculty_id", "slug")
);

CREATE TABLE IF NOT EXISTS "mtm_degrees__campuses" (
  "degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "campus_id" integer NOT NULL REFERENCES "campuses"("id") ON DELETE CASCADE,
  CONSTRAINT "mtm_degrees__campuses_pk" PRIMARY KEY ("degree_id", "campus_id")
);

CREATE INDEX IF NOT EXISTS "mtm_degrees__campuses_campus_id_idx" ON "mtm_degrees__campuses" ("campus_id");

ALTER TABLE "degrees" ADD COLUMN IF NOT EXISTS "ects" real;
ALTER TABLE "degrees" ADD COLUMN IF NOT EXISTS "duration_semesters" integer;
ALTER TABLE "degrees" ADD COLUMN IF NOT EXISTS "teaching_language" text;
ALTER TABLE "degrees" ADD COLUMN IF NOT EXISTS "schedule" text;

DO $$ BEGIN
  ALTER TABLE "degrees" ADD CONSTRAINT "degrees_valid_teaching_language"
    CHECK ("teaching_language" IS NULL OR "teaching_language" IN ('pt', 'en', 'pt_en'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "degrees" ADD CONSTRAINT "degrees_valid_schedule"
    CHECK ("schedule" IS NULL OR "schedule" IN ('daytime', 'after_work', 'both'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "degrees" ADD CONSTRAINT "degrees_valid_facts"
    CHECK (("ects" IS NULL OR "ects" > 0) AND ("duration_semesters" IS NULL OR "duration_semesters" BETWEEN 1 AND 14));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
