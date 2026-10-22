-- Curated FAQ per degree and language, shown on the degree page before the questions the
-- page generates from its own data (admission grade, fees, employability, ...). A curated
-- row with the same `topic` as a generated question replaces it. Only reviewed rows are shown
-- (reviewed_at set), like degree_details. Written by us, from what students actually ask
-- (AI chat, Reddit), the descriptions and the official sources (source_urls).
--
--   position  order within (degree, lang), ascending
--   topic     optional key matching a generated question (admission_grade, fees,
--             employability, continuation_master, heaviest_course, ...), NULL for new ones
--   answer    markdown
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "degree_faqs" (
  "id" serial PRIMARY KEY,
  "degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "position" integer NOT NULL,
  "topic" text,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "source_urls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_faqs_degree_lang_position_unique" UNIQUE ("degree_id", "lang", "position"),
  CONSTRAINT "degree_faqs_valid_lang" CHECK ("lang" IN ('pt', 'en'))
);

CREATE INDEX IF NOT EXISTS "degree_faqs_degree_id_idx" ON "degree_faqs" ("degree_id");
