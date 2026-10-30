-- How to apply to a degree (prds/content_rich_pages.md, "Ingresso v2: how to apply"): the
-- route(s) in, the application rounds with their dates, what a student needs, and where to
-- apply. Shown on the Ingresso sub-page.
--
-- Both tables share one scope, from most to least specific:
--   degree_id set                          this degree only
--   faculty_id set, degree_type set        every degree of that type at the faculty
--   faculty_id set, degree_type NULL       every degree at the faculty
--   both NULL (route 'cna' only)           national: every licenciatura / MI in the
--                                          Concurso Nacional (DGES runs one calendar)
-- For a degree, the most specific scope with rows wins per (route, audience).
--
--   route     'cna' (Concurso Nacional de Acesso, DGES), 'direct' (applied to the faculty:
--             mestrados, pós-graduações, international students), 'special' (concursos
--             especiais: maiores de 23, mudança de par instituição/curso, ...)
--   audience  'all', 'national', 'international', or 'internal' (students finishing a
--             first cycle at the same school, when they follow their own process)
--
-- admission_guides: our own text, one row per language, written from the official pages and
-- shown only once reviewed (reviewed_at set), like degree_details. `body` is markdown: what
-- the student needs and the steps. `apply_url` is where they submit the application. For the
-- summary at the top of the Ingresso page (and the degree page's Ingresso section):
-- `summary`, one plain sentence with the requirements, and the application fee as
-- `application_fee_eur` (the first or usual amount) with `application_fee_note` for the rest
-- ("100€ a partir da 3.ª candidatura"). All three optional.
--
-- admission_rounds: one row per round (fase) of one intake. school_year is the intake (2027 =
-- 2027/2028). A date we don't have is NULL, never guessed; every row keeps its source.
-- Refreshed yearly (docs/runbooks/degree_data_refresh.md).
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "admission_guides" (
  "id" serial PRIMARY KEY,
  "faculty_id" integer REFERENCES "faculties"("id") ON DELETE CASCADE,
  "degree_id" integer REFERENCES "degrees"("id") ON DELETE CASCADE,
  "degree_type" "degree_type",
  "route" text NOT NULL,
  "audience" text NOT NULL DEFAULT 'all',
  "lang" text NOT NULL,
  "body" text NOT NULL,
  "summary" text,
  "application_fee_eur" numeric(10, 2),
  "application_fee_note" text,
  "apply_url" text,
  "source_urls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admission_guides_valid_route" CHECK ("route" IN ('cna', 'direct', 'special')),
  CONSTRAINT "admission_guides_valid_audience" CHECK ("audience" IN ('all', 'national', 'international', 'internal')),
  CONSTRAINT "admission_guides_valid_lang" CHECK ("lang" IN ('pt', 'en')),
  CONSTRAINT "admission_guides_valid_scope" CHECK (
    ("degree_id" IS NOT NULL AND "faculty_id" IS NULL AND "degree_type" IS NULL)
    OR ("degree_id" IS NULL AND "faculty_id" IS NOT NULL)
    OR ("degree_id" IS NULL AND "faculty_id" IS NULL AND "degree_type" IS NULL AND "route" = 'cna')
  ),
  -- NULLS NOT DISTINCT (Postgres 15+): a NULL scope column still counts as one value
  CONSTRAINT "admission_guides_scope_unique" UNIQUE NULLS NOT DISTINCT
    ("faculty_id", "degree_id", "degree_type", "route", "audience", "lang")
);

CREATE INDEX IF NOT EXISTS "admission_guides_degree_id_idx" ON "admission_guides" ("degree_id");
CREATE INDEX IF NOT EXISTS "admission_guides_faculty_id_idx" ON "admission_guides" ("faculty_id");

CREATE TABLE IF NOT EXISTS "admission_rounds" (
  "id" serial PRIMARY KEY,
  "faculty_id" integer REFERENCES "faculties"("id") ON DELETE CASCADE,
  "degree_id" integer REFERENCES "degrees"("id") ON DELETE CASCADE,
  "degree_type" "degree_type",
  "route" text NOT NULL,
  "audience" text NOT NULL DEFAULT 'all',
  "school_year" integer NOT NULL,
  "position" integer NOT NULL,
  "label_pt" text NOT NULL,
  "label_en" text NOT NULL,
  "opens_on" date,
  "closes_on" date,
  "results_on" date,
  "notes" text,
  "source_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admission_rounds_valid_route" CHECK ("route" IN ('cna', 'direct', 'special')),
  CONSTRAINT "admission_rounds_valid_audience" CHECK ("audience" IN ('all', 'national', 'international', 'internal')),
  CONSTRAINT "admission_rounds_valid_school_year" CHECK ("school_year" BETWEEN 2000 AND 2100),
  CONSTRAINT "admission_rounds_valid_dates" CHECK ("opens_on" IS NULL OR "closes_on" IS NULL OR "opens_on" <= "closes_on"),
  CONSTRAINT "admission_rounds_valid_scope" CHECK (
    ("degree_id" IS NOT NULL AND "faculty_id" IS NULL AND "degree_type" IS NULL)
    OR ("degree_id" IS NULL AND "faculty_id" IS NOT NULL)
    OR ("degree_id" IS NULL AND "faculty_id" IS NULL AND "degree_type" IS NULL AND "route" = 'cna')
  ),
  CONSTRAINT "admission_rounds_scope_unique" UNIQUE NULLS NOT DISTINCT
    ("faculty_id", "degree_id", "degree_type", "route", "audience", "school_year", "position")
);

CREATE INDEX IF NOT EXISTS "admission_rounds_degree_id_idx" ON "admission_rounds" ("degree_id");
CREATE INDEX IF NOT EXISTS "admission_rounds_faculty_id_idx" ON "admission_rounds" ("faculty_id");
