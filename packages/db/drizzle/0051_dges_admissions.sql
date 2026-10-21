-- DGES admissions data (Concurso Nacional de Acesso), raw and national.
--
-- dges_admissions: one row per (unit code, course code, year, fase), from DGES's yearly
-- results files ("Vagas, colocados e classificação do último colocado", 2002 onwards).
-- Loaded for the whole country, so any degree we map later already has its history;
-- joined to our degrees through sources.degree_external_ids (source 'dges',
-- external_id '<unit>/<course>').
--
-- dges_guide: one snapshot per (unit, course, year) of the DGES guide page
-- (detcursopi.asp): entry exams, formula, minimum grades, next year's vagas, CNAEF area,
-- and the last years' averages and first-option counts the results files lack.
--
-- Grades are on DGES's 0-200 scale with one decimal (e.g. 166.3). NULL means DGES gave no
-- value (no candidates placed, course not offered that year).
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "sources"."dges_admissions" (
  "unit_code" text NOT NULL,
  "course_code" text NOT NULL,
  "year" integer NOT NULL,
  "fase" integer NOT NULL,
  "institution_name" text,
  "course_name" text,
  "degree_level" text,
  "vagas" integer,
  "colocados" integer,
  "last_grade" numeric(4, 1),
  "leftover_vagas" integer,
  "source_file" text NOT NULL,
  "imported_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "dges_admissions_pk" PRIMARY KEY ("unit_code", "course_code", "year", "fase"),
  CONSTRAINT "dges_admissions_valid_fase" CHECK ("fase" BETWEEN 1 AND 3),
  CONSTRAINT "dges_admissions_valid_grade" CHECK ("last_grade" IS NULL OR ("last_grade" >= 0 AND "last_grade" <= 200))
);

CREATE TABLE IF NOT EXISTS "sources"."dges_guide" (
  "unit_code" text NOT NULL,
  "course_code" text NOT NULL,
  "year" integer NOT NULL,
  "data" jsonb NOT NULL,
  "source_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  CONSTRAINT "dges_guide_pk" PRIMARY KEY ("unit_code", "course_code", "year")
);
