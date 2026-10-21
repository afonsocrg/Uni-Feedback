-- Degree details: our own text about each degree, per language.
--
-- The descriptions scraped into degrees.description were reviewed on
-- 2026-10-21 and only ~10 of 221 were fit to show (English where Portuguese
-- was expected, stale admission notices, broken markdown, faculty marketing).
-- So we write them ourselves, from the university's pages and the official
-- facts, in a neutral voice. This table holds that text. Only rows with
-- reviewed_at set are shown on the degree page ("Sobre o curso").
--
-- degrees.description stays as the old scraped text, unused by the website.
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "degree_details" (
  "degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "lang" text NOT NULL,
  "description" text NOT NULL,
  "source_urls" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_details_degree_id_lang_pk" PRIMARY KEY ("degree_id", "lang")
);

DO $$ BEGIN
  ALTER TABLE "degree_details" ADD CONSTRAINT "degree_details_valid_lang"
    CHECK ("lang" IN ('pt', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
