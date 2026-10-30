-- A course's own texts, one row per (course, field, language), replacing course_details (0058),
-- which held one row per language with a column per field. One row per text so that each text
-- carries its own provenance: a Fenix EN row could hold the official description next to an
-- assessment we translated, and nothing said which was which. More fields or languages are new
-- values, not new columns.
--
--   field            'description', 'assessment', 'bibliography'
--   lang             the language the text is written in
--   source           where the text comes from: 'fenix', 'guia_unl', 'nova_ims', 'legacy_columns'
--                    (the old courses.* columns), ... or 'translation'
--   translated_from  for a translation, the language of the text it was made from; NULL for
--                    an original. The course page says so under the text.
--   reviewed_at      a translation shows only once set; other sources show regardless
--
-- Copied from course_details with the row's source on each of its fields (that table kept one
-- source per row). Translations that filled a field of an official row are marked by a data fix,
-- dev/20261024_content_translation_courses/sql/04_course_texts_translations.sql.
-- course_details is dropped in a later migration, once the pages read from here.
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "course_texts" (
  "course_id" integer NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "field" text NOT NULL,
  "lang" text NOT NULL,
  "text" text NOT NULL,
  "source" text NOT NULL,
  "source_url" text,
  "translated_from" text,
  "fetched_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "course_texts_pk" PRIMARY KEY ("course_id", "field", "lang"),
  CONSTRAINT "course_texts_translated_from_other_lang" CHECK ("translated_from" IS NULL OR "translated_from" <> "lang")
);

INSERT INTO "course_texts" ("course_id", "field", "lang", "text", "source", "source_url",
  "translated_from", "fetched_at", "reviewed_at", "created_at", "updated_at")
SELECT d."course_id", f."field", d."lang", f."text", d."source", d."source_url",
  CASE WHEN d."source" = 'translation' THEN (CASE d."lang" WHEN 'pt' THEN 'en' ELSE 'pt' END) END,
  d."fetched_at", d."reviewed_at", d."created_at", d."updated_at"
FROM "course_details" d
CROSS JOIN LATERAL (VALUES
  ('description', d."description"),
  ('assessment', d."assessment"),
  ('bibliography', d."bibliography")
) AS f("field", "text")
WHERE nullif(trim(f."text"), '') IS NOT NULL
ON CONFLICT ("course_id", "field", "lang") DO NOTHING;
