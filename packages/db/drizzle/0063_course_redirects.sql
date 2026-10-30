-- Course redirects: URLs of deleted courses land on the course that replaced them.
--
-- Course pages live at /cadeiras/<id> (and /en/courses/<id>, plus the feedback
-- form under each). Ids never change, but rows do get deleted: two rows merged
-- into one (604 fixes, 2026-07-30), or a degree dropped with its courses while
-- an identical course lives on in another degree (IST minors, 2026-10-20).
-- Every URL of the deleted id then 404s: Google results, shared links, old
-- feedback-form links. The website looks the id up here when no course has it
-- and answers with a 301 to the same page of the surviving course.
--
-- Unlike the slug redirect tables (0046) there is no trigger: a DELETE does not
-- say where the course went. Whoever deletes a course that has a successor
-- inserts the row in the same script. Deleting a course that is itself a
-- target cascades its redirects away, so repoint them first.
--
-- A live course always wins (ids are never reused, so this is only a guard).
-- Redirects never expire. Re-runnable.

CREATE TABLE IF NOT EXISTS "course_redirects" (
  "old_course_id" integer PRIMARY KEY,
  "course_id" integer NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "course_redirects_course_id_idx" ON "course_redirects" ("course_id");
