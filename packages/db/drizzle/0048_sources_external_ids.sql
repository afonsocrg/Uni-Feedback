-- External ids: how our universities, faculties and degrees are known to
-- outside systems (DGES, InfoCursos, Fenix, ...).
--
-- They live in their own Postgres schema, `sources`, apart from the app's own
-- data in `public`. It is import plumbing: filled by import scripts, joined on
-- when the national data arrives (DGES admissions, InfoCursos outcomes, see
-- prds/content_rich_pages.md). `degrees.external_id` and `courses.external_id`
-- stay for now: they mean something different per faculty (Fenix id, DGES
-- course code, SIGARRA id) and move here once the scrapers read from here.
--
-- One entity can have several ids in one system (IST Alameda and Taguspark are
-- two DGES units), but an outside id belongs to one entity of ours, hence
-- UNIQUE (source, external_id). DGES and InfoCursos degree ids are the
-- (unit code, course code) pair written as '1518/9121'.
--
-- Re-runnable.

CREATE SCHEMA IF NOT EXISTS "sources";

CREATE TABLE IF NOT EXISTS "sources"."university_external_ids" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL REFERENCES "public"."universities"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "external_id" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "university_external_ids_source_external_id_unique" UNIQUE ("source", "external_id")
);

CREATE TABLE IF NOT EXISTS "sources"."faculty_external_ids" (
  "id" serial PRIMARY KEY,
  "faculty_id" integer NOT NULL REFERENCES "public"."faculties"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "external_id" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "faculty_external_ids_source_external_id_unique" UNIQUE ("source", "external_id")
);

CREATE TABLE IF NOT EXISTS "sources"."degree_external_ids" (
  "id" serial PRIMARY KEY,
  "degree_id" integer NOT NULL REFERENCES "public"."degrees"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "external_id" text NOT NULL,
  "url" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_external_ids_source_external_id_unique" UNIQUE ("source", "external_id")
);

CREATE INDEX IF NOT EXISTS "university_external_ids_university_id_idx"
  ON "sources"."university_external_ids" ("university_id");
CREATE INDEX IF NOT EXISTS "faculty_external_ids_faculty_id_idx"
  ON "sources"."faculty_external_ids" ("faculty_id");
CREATE INDEX IF NOT EXISTS "degree_external_ids_degree_id_idx"
  ON "sources"."degree_external_ids" ("degree_id");
