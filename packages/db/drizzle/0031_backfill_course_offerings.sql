-- Backfill course_offerings from courses.(curriculum_year, terms) (Phase 3 of 4).
-- Run AFTER 0030 (terms must be seeded). Idempotent via the unique constraint.
--
-- Mapping rules (raw term string -> target academic_term + optional year override):
--   * Most faculties: raw == target term name; curriculum_year carried from courses.
--   * Nova FCT: the "N.º Semestre" label encodes BOTH year and semester, so we
--     normalize it to (Semester 1|2) and DERIVE the curriculum year:
--       1.º->Y1S1  2.º->Y1S2  3.º->Y2S1  4.º->Y2S2  5.º->Y3S1  6.º->Y3S2
--     "2.º Ano" -> (year 2, Full Year); "2.º Trimestre" -> year unknown (NULL).
--   * Nova IMS dirty value "Fall, Spring" (single string) -> two offerings.

WITH term_map (faculty_short_name, raw, target_name, year_override) AS (
  VALUES
    -- IST (raw == target, year from courses.curriculum_year)
    ('IST',          'S1',                               'S1',              NULL::integer),
    ('IST',          'S2',                               'S2',              NULL),
    ('IST',          'P1',                               'P1',              NULL),
    ('IST',          'P2',                               'P2',              NULL),
    ('IST',          'P3',                               'P3',              NULL),
    ('IST',          'P4',                               'P4',              NULL),

    -- Nova SBE (raw == target)
    ('Nova SBE',     'Fall',                             'Fall',            NULL),
    ('Nova SBE',     'Spring',                           'Spring',          NULL),
    ('Nova SBE',     'Fall 1st Half',                    'Fall 1st Half',   NULL),
    ('Nova SBE',     'Fall 2nd Half',                    'Fall 2nd Half',   NULL),
    ('Nova SBE',     'Spring 1st Half',                  'Spring 1st Half', NULL),
    ('Nova SBE',     'Spring 2nd Half',                  'Spring 2nd Half', NULL),

    -- Nova FCT (normalize semester label -> term + derived curriculum year)
    ('Nova FCT',     '1.º Semestre',                     'Semester 1',      1),
    ('Nova FCT',     '2.º Semestre',                     'Semester 2',      1),
    ('Nova FCT',     '3.º Semestre',                     'Semester 1',      2),
    ('Nova FCT',     '4.º Semestre',                     'Semester 2',      2),
    ('Nova FCT',     '5.º Semestre',                     'Semester 1',      3),
    ('Nova FCT',     '6.º Semestre',                     'Semester 2',      3),
    ('Nova FCT',     '2.º Ano',                          'Full Year',       2),
    ('Nova FCT',     '2.º Trimestre',                    '2nd Trimester',   NULL),

    -- Nova IMS ("Fall, Spring" maps to two rows -> two offerings)
    ('Nova IMS',     'Fall',                             'Fall',            NULL),
    ('Nova IMS',     'Spring',                           'Spring',          NULL),
    ('Nova IMS',     'Fall, Spring',                     'Fall',            NULL),
    ('Nova IMS',     'Fall, Spring',                     'Spring',          NULL),

    -- ISCTE - ESSP
    ('ISCTE - ESSP', 'S1',                               'S1',              NULL),
    ('ISCTE - ESSP', 'S2',                               'S2',              NULL),

    -- FCUP
    ('FCUP',         '1st Semester',                     '1st Semester',    NULL),
    ('FCUP',         '2nd Semester',                     '2nd Semester',    NULL)
)
INSERT INTO "course_offerings" ("course_id", "curriculum_year", "academic_term_id")
SELECT
  c.id,
  COALESCE(m.year_override, c.curriculum_year),
  at.id
FROM "courses" c
JOIN "degrees" d            ON c.degree_id = d.id
JOIN "faculties" f          ON d.faculty_id = f.id
JOIN LATERAL jsonb_array_elements_text(c.terms) AS raw(term) ON true
JOIN term_map m             ON m.faculty_short_name = f.short_name AND m.raw = raw.term
JOIN "academic_terms" at    ON at.faculty_id = f.id AND at.name = m.target_name
WHERE c.terms IS NOT NULL
ON CONFLICT ("course_id", "curriculum_year", "academic_term_id") DO NOTHING;

-- ---------------------------------------------------------------------------
-- Verification (these SELECTs print diagnostics; they do not modify data).
-- ---------------------------------------------------------------------------

-- 1. Courses that had terms but produced NO offering (expect only known gaps:
--    unmapped raw strings). Investigate any rows returned here.
SELECT f.short_name AS faculty, c.id, c.acronym, c.terms
FROM "courses" c
JOIN "degrees" d   ON c.degree_id = d.id
JOIN "faculties" f ON d.faculty_id = f.id
WHERE c.terms IS NOT NULL
  AND c.terms <> '[]'::jsonb
  AND NOT EXISTS (SELECT 1 FROM "course_offerings" o WHERE o.course_id = c.id)
ORDER BY 1, 2;

-- 2. Distinct raw term strings that no map row covers (should be empty).
--    Keep this list of known (faculty, raw) pairs in sync with the term_map above.
SELECT DISTINCT f.short_name AS faculty, raw.term AS unmapped_term, count(*) OVER () AS _
FROM "courses" c
JOIN "degrees" d   ON c.degree_id = d.id
JOIN "faculties" f ON d.faculty_id = f.id
JOIN LATERAL jsonb_array_elements_text(c.terms) AS raw(term) ON true
WHERE c.terms IS NOT NULL
  AND (f.short_name, raw.term) NOT IN (
    VALUES
      ('IST','S1'),('IST','S2'),('IST','P1'),('IST','P2'),('IST','P3'),('IST','P4'),
      ('Nova SBE','Fall'),('Nova SBE','Spring'),
      ('Nova SBE','Fall 1st Half'),('Nova SBE','Fall 2nd Half'),
      ('Nova SBE','Spring 1st Half'),('Nova SBE','Spring 2nd Half'),
      ('Nova FCT','1.º Semestre'),('Nova FCT','2.º Semestre'),('Nova FCT','3.º Semestre'),
      ('Nova FCT','4.º Semestre'),('Nova FCT','5.º Semestre'),('Nova FCT','6.º Semestre'),
      ('Nova FCT','2.º Ano'),('Nova FCT','2.º Trimestre'),
      ('Nova IMS','Fall'),('Nova IMS','Spring'),('Nova IMS','Fall, Spring'),
      ('ISCTE - ESSP','S1'),('ISCTE - ESSP','S2'),
      ('FCUP','1st Semester'),('FCUP','2nd Semester')
  )
ORDER BY 1, 2;

-- 3. Offering counts per faculty (sanity vs. exploded term counts).
SELECT f.short_name AS faculty, count(*) AS offerings
FROM "course_offerings" o
JOIN "courses" c   ON o.course_id = c.id
JOIN "degrees" d   ON c.degree_id = d.id
JOIN "faculties" f ON d.faculty_id = f.id
GROUP BY 1 ORDER BY 1;
