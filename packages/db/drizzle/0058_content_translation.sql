-- Content translation (prds/content_translation.md, "Design"): the schema for every entity
-- in one migration. The data is filled one entity type at a time, top down.
--
-- Names. `name` stays the official Portuguese name; `name_en` is the English one, NULL when
-- we have none, and EN pages fall back to `name`. short_name / acronym are the same in both
-- languages.
--
-- Our own text, one row per language, only shown once reviewed (reviewed_at set):
--   university_details, faculty_details   the hand-written intros (content_rich_pages
--                                         decision 12), same shape as degree_details
--   degree_details                        already exists (0049); its EN rows come later
--
-- The faculty's own course text, one row per language: course_details. Courses carry three
-- copy fields today, courses.description / assessment / bibliography, scraped as the faculty
-- publishes them and in whatever language that is (Nova SBE's are English). They stay where
-- they are for now (the app reads them); course_details holds the per-language versions as
-- they are fetched (Fenix EN, guia.unl.pt pt/en, the Nova IMS API) or translated, and the
-- three columns move out once every course has its rows. `source` says which, and a
-- translated row is shown only once reviewed.
--
-- Provenance: sources.entity_names keeps every raw name per entity and language as an outside
-- source publishes it (or as we translated it, source = 'translation'). The curated value is
-- the name / name_en column.
--
-- Not covered (no copy beyond a label): campuses.name, course_groups.name, academic_terms.name.
--
-- Re-runnable.

ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "name_en" text;
ALTER TABLE "faculties" ADD COLUMN IF NOT EXISTS "name_en" text;
ALTER TABLE "degrees" ADD COLUMN IF NOT EXISTS "name_en" text;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "name_en" text;

CREATE TABLE IF NOT EXISTS "university_details" (
  "university_id" integer NOT NULL REFERENCES "universities"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "description" text NOT NULL,
  "source_urls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "university_details_university_id_lang_pk" PRIMARY KEY ("university_id", "lang")
);

CREATE TABLE IF NOT EXISTS "faculty_details" (
  "faculty_id" integer NOT NULL REFERENCES "faculties"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "description" text NOT NULL,
  "source_urls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "faculty_details_faculty_id_lang_pk" PRIMARY KEY ("faculty_id", "lang")
);

CREATE TABLE IF NOT EXISTS "course_details" (
  "course_id" integer NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "description" text,
  "assessment" text,
  "bibliography" text,
  -- 'fenix', 'guia_unl', 'nova_ims', 'sigarra', ... or 'translation'
  "source" text NOT NULL,
  "source_url" text,
  "fetched_at" timestamp with time zone,
  -- Required before a translated row is shown; official rows may be shown as fetched
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "course_details_course_id_lang_pk" PRIMARY KEY ("course_id", "lang")
);

DO $$ BEGIN
  ALTER TABLE "university_details" ADD CONSTRAINT "university_details_valid_lang"
    CHECK ("lang" IN ('pt', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "faculty_details" ADD CONSTRAINT "faculty_details_valid_lang"
    CHECK ("lang" IN ('pt', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "course_details" ADD CONSTRAINT "course_details_valid_lang"
    CHECK ("lang" IN ('pt', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "sources"."entity_names" (
  "entity" text NOT NULL,
  "entity_id" integer NOT NULL,
  "lang" text NOT NULL,
  "name" text NOT NULL,
  -- The site or API it came from ('ulisboa.pt', 'fenix', 'guia_unl', 'nova_ims', 'dges',
  -- ...), or 'translation' for a name we translated and reviewed
  "source" text NOT NULL,
  "source_url" text,
  "fetched_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "entity_names_pk" PRIMARY KEY ("entity", "entity_id", "lang", "source"),
  CONSTRAINT "entity_names_valid_entity"
    CHECK ("entity" IN ('university', 'faculty', 'degree', 'course')),
  CONSTRAINT "entity_names_valid_lang" CHECK ("lang" IN ('pt', 'en'))
);
