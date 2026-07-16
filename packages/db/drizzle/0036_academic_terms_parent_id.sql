-- Academic terms: make the grouping parent explicit, and drop the
-- "8 ticks per academic year" convention.
--
-- Why: grouping used to be inferred from tick geometry (a 4-tick term is a
-- semester, so a 2-tick term inside one is its period). That guessed wrong
-- twice. Nova FCT's "Full Year" contains both semesters without being their
-- display parent, and its "2nd Trimester" runs *between* the semesters, which
-- a fixed 8-tick year cannot express at all: with S1 = 1-4 and S2 = 5-8 there
-- is no integer strictly between them. Geometry cannot separate "contains" from
-- "is the parent of", so the parent becomes data.
--
-- Ticks stay per-faculty intervals and keep doing what ADR-0001 wants of them
-- (order, duration, end position). They just no longer carry a fixed scale, so
-- a faculty numbers its own timeline as densely as it needs.

-- Re-runnable, like the 0030 seed: the UPDATEs below set absolute values, so
-- guarding the two DDL statements makes the whole file safe to replay.
ALTER TABLE "academic_terms"
  ADD COLUMN IF NOT EXISTS "parent_id" integer
    REFERENCES "academic_terms"("id") ON DELETE SET NULL;

-- A term cannot be its own parent. Deeper cycles are not reachable in practice:
-- every parent here is a top-level term, and the admin UI only offers those.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'academic_terms_parent_not_self'
  ) THEN
    ALTER TABLE "academic_terms"
      ADD CONSTRAINT "academic_terms_parent_not_self"
      CHECK ("parent_id" IS NULL OR "parent_id" <> "id");
  END IF;
END $$;

-- Backfill the nesting that was previously inferred from containment. Only
-- sub-terms get a parent: a term with no parent is a bucket in its own right,
-- which is exactly what Nova FCT's "Full Year", its "2nd Trimester" and every
-- plain semester need. Faculty resolved by short_name, so this is
-- environment-independent.
UPDATE "academic_terms" child
SET "parent_id" = parent."id"
FROM "academic_terms" parent, "faculties" f
WHERE child."faculty_id" = f."id"
  AND parent."faculty_id" = f."id"
  AND (f."short_name", child."name", parent."name") IN (
    VALUES
      -- IST: periods nest inside their semester.
      ('IST',      'P1',              'S1'),
      ('IST',      'P2',              'S1'),
      ('IST',      'P3',              'S2'),
      ('IST',      'P4',              'S2'),
      -- Nova SBE: halves nest inside Fall/Spring.
      ('Nova SBE', 'Fall 1st Half',   'Fall'),
      ('Nova SBE', 'Fall 2nd Half',   'Fall'),
      ('Nova SBE', 'Spring 1st Half', 'Spring'),
      ('Nova SBE', 'Spring 2nd Half', 'Spring')
  );

-- Nova FCT: renumber so the timeline stops lying. "2nd Trimester" is an interim
-- period that runs after Semester 1 ends and before Semester 2 starts, with a
-- break on each side. Its old 3-5 claimed it overlapped the back half of
-- Semester 1 and the start of Semester 2; it overlaps neither. The breaks
-- themselves are implied rather than given their own ticks: nothing reads gaps,
-- and only order and containment are load-bearing today.
--
--   Semester 1      1-4
--   2nd Trimester   5-6    <- inside neither semester
--   Semester 2      7-10
--   Full Year       1-10   <- still spans the year, still parents nothing
UPDATE "academic_terms" t
SET "start_tick" = v.start_tick, "end_tick" = v.end_tick
FROM (
  VALUES
    ('Semester 1',    1,  4),
    ('2nd Trimester', 5,  6),
    ('Semester 2',    7, 10),
    ('Full Year',     1, 10)
) AS v(name, start_tick, end_tick), "faculties" f
WHERE t."faculty_id" = f."id"
  AND f."short_name" = 'Nova FCT'
  AND t."name" = v.name;
