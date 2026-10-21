-- Tuition fees (propinas) per degree and school year, kept as history: a new year adds rows,
-- old ones stay. Shown in the Ingresso section always with the year they apply to
-- (prds/content_rich_pages.md). Refreshed yearly (ops/checklist.md reminder,
-- docs/runbooks/degree_data_refresh.md section 6).
--
--   school_year   first calendar year of the school year (2026 = 2026/2027), as elsewhere
--   student_type  'national' (Portuguese and EU students), 'international' (estatuto de
--                 estudante internacional), or 'all' when the faculty states one value
--   period        what the amount covers: 'year' (annual propina), 'total' (whole degree),
--                 'semester', or 'ects' (per credit)
--   amount_eur    as published, in euros
--
-- NULL / no row means we don't know. Re-runnable.

CREATE TABLE IF NOT EXISTS "degree_fees" (
  "id" serial PRIMARY KEY,
  "degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "school_year" integer NOT NULL,
  "student_type" text NOT NULL,
  "period" text NOT NULL,
  "amount_eur" numeric(10, 2) NOT NULL,
  "notes" text,
  "source_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_fees_unique" UNIQUE ("degree_id", "school_year", "student_type", "period"),
  CONSTRAINT "degree_fees_valid_student_type" CHECK ("student_type" IN ('national', 'international', 'all')),
  CONSTRAINT "degree_fees_valid_period" CHECK ("period" IN ('year', 'total', 'semester', 'ects')),
  CONSTRAINT "degree_fees_valid_amount" CHECK ("amount_eur" >= 0),
  CONSTRAINT "degree_fees_valid_school_year" CHECK ("school_year" BETWEEN 2000 AND 2100)
);

CREATE INDEX IF NOT EXISTS "degree_fees_degree_id_idx" ON "degree_fees" ("degree_id");
