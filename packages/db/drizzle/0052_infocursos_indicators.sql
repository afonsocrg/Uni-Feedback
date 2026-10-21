-- InfoCursos indicators (DGEEC), raw and national: one row per (unit code, course code,
-- edition, indicator), the values as JSON in the shape of that indicator's sheet in the
-- yearly InfoCursos_<edition>.xlsx (unemployment, completion in expected time, status
-- one year after entering, gender, enrolments, entry percentile, final grades, ...).
-- Joined to our degrees through sources.degree_external_ids (source 'dges' or
-- 'infocursos', '<unit>/<course>'). Covers licenciaturas, integrated masters and
-- mestrados. How it is shown is decided later (prds/content_rich_pages.md).
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "sources"."infocursos_indicators" (
  "unit_code" text NOT NULL,
  "course_code" text NOT NULL,
  "edition" integer NOT NULL,
  "indicator" text NOT NULL,
  "degree_level" text,
  "data" jsonb NOT NULL,
  "source_file" text NOT NULL,
  "imported_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "infocursos_indicators_pk" PRIMARY KEY ("unit_code", "course_code", "edition", "indicator")
);
