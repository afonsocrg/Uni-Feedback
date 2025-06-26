-- Migration: Add faculties table and update degrees table

-- Disable foreign key checks temporarily
PRAGMA foreign_keys = OFF;

-- 1. Create faculties table
CREATE TABLE faculties (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
short_name TEXT NOT NULL,
url TEXT NOT NULL,
created_at INTEGER,
updated_at INTEGER
);

-- 2. Insert default faculty (update values as needed)
INSERT INTO faculties (name, short_name, url, created_at, updated_at)
VALUES
    ('Instituto Superior Técnico', 'IST', 'https://tecnico.ulisboa.pt', strftime('%s', 'now'), strftime('%s', 'now')),
    ('NOVA School of Business and Economics', 'Nova SBE', 'https://guia.unl.pt/en/2025/novasbe', strftime('%s', 'now'), strftime('%s', 'now'))
;

-- 3. Create new degrees table with faculty_id
CREATE TABLE degrees_new (
id INTEGER PRIMARY KEY AUTOINCREMENT,
external_id TEXT,
type TEXT NOT NULL,
name TEXT NOT NULL,
acronym TEXT NOT NULL,
campus TEXT NOT NULL,
faculty_id INTEGER REFERENCES faculties(id),
created_at INTEGER,
updated_at INTEGER
);

-- 4. Copy all data from old table to new table, setting faculty_id to the IST faculty we just created
INSERT INTO degrees_new (id, external_id, type, name, acronym, campus, faculty_id, created_at, updated_at)
SELECT id, external_id, type, name, acronym, campus, (SELECT id from faculties where short_name = 'IST'), created_at, updated_at FROM degrees;

-- 5. Drop the old table
DROP TABLE degrees;

-- 6. Rename the new table
ALTER TABLE degrees_new RENAME TO degrees;

-- 7. Add ECTS column to courses table
ALTER TABLE courses ADD COLUMN ects REAL;

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;