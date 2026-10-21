-- Degree types: a closed set instead of free text.
--
-- `degrees.type` held whatever each faculty's scraper wrote: "Bachelor" and
-- "Licenciatura" for the same thing, "Master" next to "Mestrado Integrado",
-- "Postgraduate", "PhD", and IST's "HACS" (an elective catalogue, not a degree).
-- The faculty page showed those raw strings in its type filter, and the degree
-- type pages planned in prds/content_rich_pages.md need one value per type.
--
-- Display labels live in the website's locale files, per language.
--
-- Re-runnable.

DO $$ BEGIN
  CREATE TYPE "degree_type" AS ENUM (
    'bachelor',
    'integrated_master',
    'master',
    'minor',
    'postgraduate',
    'phd',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'degrees' AND column_name = 'type') = 'text' THEN
    UPDATE "degrees" SET "type" = CASE "type"
      WHEN 'Bachelor' THEN 'bachelor'
      WHEN 'Licenciatura' THEN 'bachelor'
      WHEN 'Mestrado Integrado' THEN 'integrated_master'
      WHEN 'Master' THEN 'master'
      WHEN 'Minor' THEN 'minor'
      WHEN 'Postgraduate' THEN 'postgraduate'
      WHEN 'PhD' THEN 'phd'
      WHEN 'HACS' THEN 'other'
      ELSE "type"
    END;

    -- Fails loudly on any spelling not mapped above, leaving the column as it was.
    ALTER TABLE "degrees"
      ALTER COLUMN "type" TYPE "degree_type" USING "type"::"degree_type";
  END IF;
END $$;
