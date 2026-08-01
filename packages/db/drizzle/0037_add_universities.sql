-- Group faculties under the university they belong to.
--
-- Why: the faculty list is the first screen of the browse funnel and it is now
-- 13 entries with no structure. Students think "I'm at NOVA" long before they
-- think "I'm at NOVA FCT", so the university is the cheapest way to cut that
-- list down. It stays a *grouping* only: the faculty remains the unit a student
-- picks, since courses, degrees and email suffixes are all faculty-scoped.
--
-- Re-runnable: the DDL is guarded, the seed is an idempotent upsert on slug,
-- and the backfill sets absolute values resolved by short_name, so replaying
-- this file is a no-op.

CREATE TABLE IF NOT EXISTS "universities" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "short_name" text NOT NULL,
  "slug" text NOT NULL,
  "logo" text,
  "logo_horizontal" text,
  "url" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- The slug is what the faculty-page filter selects on, so duplicates would make
-- the chip ambiguous. Also what makes the seed below an upsert.
CREATE UNIQUE INDEX IF NOT EXISTS "universities_slug_idx"
  ON "universities" ("slug");

-- Seed the five universities the current 13 faculties belong to.
-- Logos are left NULL: we have no university-level assets yet, and every place
-- that renders one already falls back to no image (see SelectionCard).
INSERT INTO "universities" ("name", "short_name", "slug", "url")
VALUES
  ('Universidade de Lisboa',                    'ULisboa', 'ulisboa', 'https://www.ulisboa.pt'),
  ('Universidade NOVA de Lisboa',               'NOVA',    'nova',    'https://www.unl.pt'),
  ('ISCTE - Instituto Universitário de Lisboa', 'ISCTE',   'iscte',   'https://www.iscte-iul.pt'),
  ('Universidade do Porto',                     'U.Porto', 'u-porto', 'https://www.up.pt'),
  ('Instituto Politécnico do Porto',            'IPP',     'ipp',     'https://www.ipp.pt')
ON CONFLICT ("slug") DO UPDATE
  SET "name"       = EXCLUDED."name",
      "short_name" = EXCLUDED."short_name",
      "url"        = EXCLUDED."url",
      "updated_at" = now();

-- Nullable on purpose: a faculty added before we know where to file it still
-- works everywhere, it just answers to no university chip. ON DELETE SET NULL
-- for the same reason: dropping a university must never take faculties with it.
ALTER TABLE "faculties"
  ADD COLUMN IF NOT EXISTS "university_id" integer
    REFERENCES "universities"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "faculties_university_id_idx"
  ON "faculties" ("university_id");

-- Backfill all 13. Faculties are resolved by short_name and universities by
-- slug, so this is environment-independent (ids differ between local and prod).
UPDATE "faculties" f
SET "university_id" = u."id"
FROM "universities" u, (
  VALUES
    -- Universidade de Lisboa
    ('IST',          'ulisboa'),
    ('FDUL',         'ulisboa'),
    ('FMDUL',        'ulisboa'),
    ('FLUL',         'ulisboa'),
    -- Universidade NOVA de Lisboa
    ('Nova SBE',     'nova'),
    ('Nova FCT',     'nova'),
    ('Nova IMS',     'nova'),
    ('NMS',          'nova'),
    -- ISCTE
    ('ISCTE - ESSP', 'iscte'),
    ('ISCTE - ISTA', 'iscte'),
    ('ISCTE - IBS',  'iscte'),
    -- Universidade do Porto
    ('FCUP',         'u-porto'),
    -- Instituto Politécnico do Porto
    ('ISEP',         'ipp')
) AS m(faculty_short_name, university_slug)
WHERE f."short_name" = m.faculty_short_name
  AND u."slug" = m.university_slug;
