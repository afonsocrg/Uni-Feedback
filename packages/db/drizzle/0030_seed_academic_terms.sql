-- Seed academic_terms per faculty (Phase 2 of 4).
-- Ticks are abstract integers: an academic year spans 8 ticks
-- (semester = 4, half/period = 2). Sub-terms nest inside their container.
-- Faculty resolved by short_name so this is environment-independent.
-- Idempotent: re-running is a no-op thanks to the (faculty_id, name) unique key.

INSERT INTO "academic_terms" ("faculty_id", "name", "start_tick", "end_tick")
SELECT f.id, v.name, v.start_tick, v.end_tick
FROM (
  VALUES
    -- IST: periods P1-P4 nest inside semesters S1/S2
    ('IST',          'S1',              1, 4),
    ('IST',          'S2',              5, 8),
    ('IST',          'P1',              1, 2),
    ('IST',          'P2',              3, 4),
    ('IST',          'P3',              5, 6),
    ('IST',          'P4',              7, 8),

    -- Nova SBE: halves nest inside Fall/Spring
    ('Nova SBE',     'Fall',            1, 4),
    ('Nova SBE',     'Fall 1st Half',   1, 2),
    ('Nova SBE',     'Fall 2nd Half',   3, 4),
    ('Nova SBE',     'Spring',          5, 8),
    ('Nova SBE',     'Spring 1st Half', 5, 6),
    ('Nova SBE',     'Spring 2nd Half', 7, 8),

    -- Nova FCT: term labels also encoded curriculum year -> normalized here.
    -- The "N.º Semestre" year is derived during backfill (0031), not stored here.
    ('Nova FCT',     'Semester 1',      1, 4),
    ('Nova FCT',     'Semester 2',      5, 8),
    ('Nova FCT',     'Full Year',       1, 8),   -- for "2.º Ano" (annual courses)
    ('Nova FCT',     '2nd Trimester',   3, 5),   -- handful of trimester courses

    -- Nova IMS
    ('Nova IMS',     'Fall',            1, 4),
    ('Nova IMS',     'Spring',          5, 8),

    -- ISCTE - ESSP
    ('ISCTE - ESSP', 'S1',              1, 4),
    ('ISCTE - ESSP', 'S2',              5, 8),

    -- FCUP
    ('FCUP',         '1st Semester',    1, 4),
    ('FCUP',         '2nd Semester',    5, 8)
) AS v(faculty_short_name, name, start_tick, end_tick)
JOIN "faculties" f ON f.short_name = v.faculty_short_name
ON CONFLICT ("faculty_id", "name") DO NOTHING;
