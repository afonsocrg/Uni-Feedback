-- More raw national data in the sources schema (prds/content_rich_pages.md), all keyed the
-- way the source keys it and joined to our degrees through sources.degree_external_ids.
--
-- dges_degrees       the national catalogue of degrees in the Concurso Nacional (DGES guide
--                    index): every (unit, course) pair, its institution, name, grau, CNAEF
--                    area. Lets us link to degrees we don't cover yet (equivalent degrees
--                    elsewhere, comparisons).
-- simges_courses     DGES SIMGES registry: every registered degree per organic unit, its
--                    state (Ativo / A Cessar / Inativo), cycle, ECTS, accreditation, and
--                    the registry's own id. The discontinuation signal; covers mestrados.
-- dges_pair_stats    per-pair statistics PDFs (one per year and fase): candidates and
--                    placements by option, by contingente with their last grades, district
--                    of origin, secondary-school track, sex, grade histogram.
-- a3es_accreditations  A3ES accreditation decisions per study cycle (matched by name and
--                    unit, no shared codes): decision, years, date, process number.
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "sources"."dges_degrees" (
  "unit_code" text NOT NULL,
  "course_code" text NOT NULL,
  "year" integer NOT NULL,
  "institution_name" text,
  "unit_name" text,
  "course_name" text NOT NULL,
  "degree_level" text,
  "cnaef_code" text,
  "cnaef_name" text,
  "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "source_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  CONSTRAINT "dges_degrees_pk" PRIMARY KEY ("unit_code", "course_code", "year")
);

CREATE TABLE IF NOT EXISTS "sources"."simges_courses" (
  "simges_id" text NOT NULL,
  "unit_id" text,
  "unit_name" text,
  "course_name" text NOT NULL,
  "dges_course_code" text,
  "cycle" text,
  "state" text,
  "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "source_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  CONSTRAINT "simges_courses_pk" PRIMARY KEY ("simges_id")
);

CREATE TABLE IF NOT EXISTS "sources"."dges_pair_stats" (
  "unit_code" text NOT NULL,
  "course_code" text NOT NULL,
  "year" integer NOT NULL,
  "fase" integer NOT NULL,
  "data" jsonb NOT NULL,
  "source_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  CONSTRAINT "dges_pair_stats_pk" PRIMARY KEY ("unit_code", "course_code", "year", "fase")
);

CREATE TABLE IF NOT EXISTS "sources"."a3es_accreditations" (
  "process_id" text NOT NULL,
  "institution_name" text,
  "unit_name" text,
  "course_name" text NOT NULL,
  "degree_level" text,
  "decision" text,
  "years" integer,
  "decision_date" date,
  "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "source_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  CONSTRAINT "a3es_accreditations_pk" PRIMARY KEY ("process_id")
);
