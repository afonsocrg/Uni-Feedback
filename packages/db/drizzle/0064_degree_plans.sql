-- Curricular plans: what a degree asks of a student, independent of course_offerings (when a
-- course runs) and course_groups (how /cadeiras filters). Domain model and rationale:
-- docs/data-model/curricular_plan.md and prds/curricular_plan.md in the workspace repo.
--
--   degree_plans              one per (degree, school year); school_year as in feedback.school_year
--   degree_plan_texts         "Como funciona" and the rule over the tracks, per language
--   degree_plan_versions      alternative orderings of the same plan (Nova SBE A/B, FDUL turmas)
--   degree_plan_items         the blocks: a 'course' (fixed) or a 'pool' (a choice)
--   degree_plan_item_texts    a pool's description, per language
--   degree_plan_pool_options  every course a pool lets a student take, in order
--   degree_tracks             specializations, Majors, Minors, paths
--   degree_track_texts        a track's description and rules, per language
--   degree_track_courses      a track's courses, with which are mandatory
--
-- Items and options point at courses by id when the course has a page, and otherwise carry a
-- name (a dissertation, a FLUL option at another school). The plan is descriptive: nothing here
-- checks that a row adds up to 60 ECTS.
--
-- Texts: `translated_from` is set on a translation (NULL for an original), as in course_texts.
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "degree_plans" (
  "id" serial PRIMARY KEY,
  "degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "school_year" integer NOT NULL,
  "source_urls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_plans_degree_id_school_year_unique" UNIQUE ("degree_id", "school_year")
);

CREATE TABLE IF NOT EXISTS "degree_plan_texts" (
  "plan_id" integer NOT NULL REFERENCES "degree_plans"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "description" text,
  "track_rules" text,
  "translated_from" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_plan_texts_pk" PRIMARY KEY ("plan_id", "lang"),
  CONSTRAINT "degree_plan_texts_lang" CHECK ("lang" IN ('pt', 'en')),
  CONSTRAINT "degree_plan_texts_translated_from_other_lang" CHECK ("translated_from" IS NULL OR "translated_from" <> "lang")
);

CREATE TABLE IF NOT EXISTS "degree_plan_versions" (
  "id" serial PRIMARY KEY,
  "plan_id" integer NOT NULL REFERENCES "degree_plans"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "name_en" text,
  "position" integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "degree_plan_versions_plan_id_idx" ON "degree_plan_versions" ("plan_id");

CREATE TABLE IF NOT EXISTS "degree_plan_items" (
  "id" serial PRIMARY KEY,
  "plan_id" integer NOT NULL REFERENCES "degree_plans"("id") ON DELETE CASCADE,
  -- NULL: the item is in every version
  "version_id" integer REFERENCES "degree_plan_versions"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "course_id" integer REFERENCES "courses"("id"),
  "label" text,
  "label_en" text,
  "year_from" integer NOT NULL,
  "year_to" integer NOT NULL,
  -- the recommended term, a term of the degree's faculty; NULL when the plan gives none
  "academic_term_id" integer REFERENCES "academic_terms"("id") ON DELETE SET NULL,
  "ects" real NOT NULL,
  "ects_min" real,
  "ects_max" real,
  "courses_min" integer,
  "courses_max" integer,
  "position" integer NOT NULL DEFAULT 0,
  CONSTRAINT "degree_plan_items_kind" CHECK ("kind" IN ('course', 'pool')),
  CONSTRAINT "degree_plan_items_course_or_label" CHECK (("course_id" IS NULL) <> ("label" IS NULL)),
  CONSTRAINT "degree_plan_items_pool_has_label" CHECK ("kind" <> 'pool' OR "label" IS NOT NULL),
  CONSTRAINT "degree_plan_items_years" CHECK ("year_from" >= 1 AND "year_to" >= "year_from"),
  CONSTRAINT "degree_plan_items_ects" CHECK ("ects" > 0),
  CONSTRAINT "degree_plan_items_ects_range" CHECK (("ects_min" IS NULL OR "ects_min" <= "ects") AND ("ects_max" IS NULL OR "ects" <= "ects_max")),
  CONSTRAINT "degree_plan_items_courses_range" CHECK ("courses_min" IS NULL OR "courses_max" IS NULL OR "courses_min" <= "courses_max")
);
CREATE INDEX IF NOT EXISTS "degree_plan_items_plan_id_idx" ON "degree_plan_items" ("plan_id");
CREATE INDEX IF NOT EXISTS "degree_plan_items_course_id_idx" ON "degree_plan_items" ("course_id");

CREATE TABLE IF NOT EXISTS "degree_plan_item_texts" (
  "item_id" integer NOT NULL REFERENCES "degree_plan_items"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "description" text NOT NULL,
  "translated_from" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_plan_item_texts_pk" PRIMARY KEY ("item_id", "lang"),
  CONSTRAINT "degree_plan_item_texts_lang" CHECK ("lang" IN ('pt', 'en')),
  CONSTRAINT "degree_plan_item_texts_translated_from_other_lang" CHECK ("translated_from" IS NULL OR "translated_from" <> "lang")
);

CREATE TABLE IF NOT EXISTS "degree_plan_pool_options" (
  "id" serial PRIMARY KEY,
  "item_id" integer NOT NULL REFERENCES "degree_plan_items"("id") ON DELETE CASCADE,
  "position" integer NOT NULL DEFAULT 0,
  "course_id" integer REFERENCES "courses"("id"),
  -- a course with no page of ours
  "name" text,
  "name_en" text,
  "ects" real,
  -- a heading in the list (the Major a course belongs to, a language)
  "group_label" text,
  "group_label_en" text,
  CONSTRAINT "degree_plan_pool_options_course_or_name" CHECK (("course_id" IS NULL) <> ("name" IS NULL))
);
CREATE INDEX IF NOT EXISTS "degree_plan_pool_options_item_id_idx" ON "degree_plan_pool_options" ("item_id");
CREATE INDEX IF NOT EXISTS "degree_plan_pool_options_course_id_idx" ON "degree_plan_pool_options" ("course_id");

CREATE TABLE IF NOT EXISTS "degree_tracks" (
  "id" serial PRIMARY KEY,
  "plan_id" integer NOT NULL REFERENCES "degree_plans"("id") ON DELETE CASCADE,
  -- 'specialization', 'secondary' (an IST secondary area), 'major', 'minor', 'path'
  "kind" text NOT NULL,
  "name" text NOT NULL,
  "name_en" text,
  "ects_min" real,
  "courses_min" integer,
  "position" integer NOT NULL DEFAULT 0,
  "source_urls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "verified_at" timestamp with time zone,
  CONSTRAINT "degree_tracks_kind" CHECK ("kind" IN ('specialization', 'secondary', 'major', 'minor', 'path'))
);
CREATE INDEX IF NOT EXISTS "degree_tracks_plan_id_idx" ON "degree_tracks" ("plan_id");

CREATE TABLE IF NOT EXISTS "degree_track_texts" (
  "track_id" integer NOT NULL REFERENCES "degree_tracks"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "description" text,
  "rules" text,
  "translated_from" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_track_texts_pk" PRIMARY KEY ("track_id", "lang"),
  CONSTRAINT "degree_track_texts_lang" CHECK ("lang" IN ('pt', 'en')),
  CONSTRAINT "degree_track_texts_translated_from_other_lang" CHECK ("translated_from" IS NULL OR "translated_from" <> "lang")
);

CREATE TABLE IF NOT EXISTS "degree_track_courses" (
  "id" serial PRIMARY KEY,
  "track_id" integer NOT NULL REFERENCES "degree_tracks"("id") ON DELETE CASCADE,
  "position" integer NOT NULL DEFAULT 0,
  "course_id" integer REFERENCES "courses"("id"),
  "name" text,
  "name_en" text,
  "ects" real,
  "group_label" text,
  "group_label_en" text,
  "is_mandatory" boolean NOT NULL DEFAULT false,
  CONSTRAINT "degree_track_courses_course_or_name" CHECK (("course_id" IS NULL) <> ("name" IS NULL))
);
CREATE INDEX IF NOT EXISTS "degree_track_courses_track_id_idx" ON "degree_track_courses" ("track_id");
CREATE INDEX IF NOT EXISTS "degree_track_courses_course_id_idx" ON "degree_track_courses" ("course_id");
