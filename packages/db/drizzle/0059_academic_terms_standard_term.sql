-- Which standard term an academic term is, so the site can label semesters the same way at
-- every faculty ("1º Semestre" / "1st Semester", "S1" in compact tags) in the reader's
-- language, instead of whatever each catalogue called them ("S1", "1.º Semestre",
-- "1st Semester", "Semester 1").
--
--   semester_1  first semester
--   semester_2  second semester
--   annual      the whole school year
--
-- NULL for terms particular to a faculty (IST's P1-P4, Nova FCT's "2nd Trimester", Nova
-- SBE's half-semesters), and for Fall/Spring, which is what Nova SBE and Nova IMS students
-- call their terms. Those keep showing their own name.
--
-- Also normalizes the stored names of tagged terms to S1 / S2 / Anual, so the dashboard and
-- the chat, which show `name`, read the same everywhere too. Scrapers look terms up by these
-- names.
--
-- Re-runnable.

ALTER TABLE "academic_terms" ADD COLUMN IF NOT EXISTS "standard_term" text;

DO $$ BEGIN
  ALTER TABLE "academic_terms" ADD CONSTRAINT "academic_terms_valid_standard_term"
    CHECK ("standard_term" IN ('semester_1', 'semester_2', 'annual'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE "academic_terms"
SET "standard_term" = 'semester_1', "name" = 'S1', "updated_at" = now()
WHERE "name" IN ('S1', '1.º Semestre', '1st Semester', 'Semester 1');

UPDATE "academic_terms"
SET "standard_term" = 'semester_2', "name" = 'S2', "updated_at" = now()
WHERE "name" IN ('S2', '2.º Semestre', '2nd Semester', 'Semester 2');

UPDATE "academic_terms"
SET "standard_term" = 'annual', "name" = 'Anual', "updated_at" = now()
WHERE "name" IN ('Anual', 'Full Year');
