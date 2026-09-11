-- Open the chat to every logged-in student, and reshape the access requests
-- table around the onboarding form that replaces the coverage wall.
--
-- Plan: afonsocrg/prds/2026-08-09_ai_chat.md, "Access, walls and the coverage
-- gate: DECIDED (2026-08-27)".
--
-- Re-runnable, and safe to apply ahead of the UI:
--   * `chat_access_requests` is empty everywhere, so reshaping it loses nothing.
--   * `faculties.chat_enabled` has never been read on production.

-- ---------------------------------------------------------------------------
-- Drop the coverage gate
-- ---------------------------------------------------------------------------
--
-- The flag had exactly one live consumer, the faculty check in the send path.
-- Every job we imagined for it is already done by something else: per-faculty
-- cost by the global spend ceiling and the per-user quota, anything
-- reputational by CHAT_ENABLED. Keeping it would also keep findFacultyByEmail
-- in the send path purely to evaluate a flag that is always true, which leaves
-- the edu.ulisboa.pt / iscte-iul.pt suffix collision load-bearing for nothing.
--
-- "Which universities can we answer well about" survives as a DERIVED number
-- (courses with three or more reviews, share with a description), because a
-- hand-set boolean drifts from reality the moment new reviews land.

ALTER TABLE "faculties"
  DROP COLUMN IF EXISTS "chat_enabled";

-- ---------------------------------------------------------------------------
-- chat_access_requests: one person, several universities, free-form answers
-- ---------------------------------------------------------------------------
--
-- The table as built assumed a logged-in student wanting one faculty switched
-- on. With no coverage gate, the people who need this are the ones who cannot
-- sign up at all (applicants, high-school students, anyone without a university
-- address), and they want to hear about several universities at once.
--
-- `responses` is jsonb rather than a link table, deliberately reversing the
-- argument section 4 makes for chat_message_entities. That argument holds for
-- permanent, high-volume, aggregated data. This is low-volume and temporary: it
-- disappears when non-university signup lands. Counting still works
-- (`jsonb_array_elements_text(responses->'faculties')`), and a temporary table
-- earning schema churn is the worse trade.

ALTER TABLE "chat_access_requests"
  DROP CONSTRAINT IF EXISTS "chat_access_requests_email_faculty_unique";

DROP INDEX IF EXISTS "chat_access_requests_faculty_idx";

ALTER TABLE "chat_access_requests"
  DROP COLUMN IF EXISTS "faculty_id",
  DROP COLUMN IF EXISTS "degree_id";

-- The form answers: which universities they care about, who they are, and the
-- question they typed.
--
-- Storing the question is not a nicety. Someone who cannot sign up has no
-- `chats` row, so their question exists solely in their browser until this row
-- is written. Those are also the most valuable rows here, because every other
-- question in the system comes from an enrolled student, and they are the only
-- window into non-student demand before the identity rework lands.
ALTER TABLE "chat_access_requests"
  ADD COLUMN IF NOT EXISTS "responses" jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Where the request came from, so the login wall and the in-answer ask can be
-- told apart without digging through jsonb.
ALTER TABLE "chat_access_requests"
  ADD COLUMN IF NOT EXISTS "source" text;

-- One row per address. A second submission updates the first rather than
-- stacking duplicates, which keeps "how many people are waiting" honest.
CREATE UNIQUE INDEX IF NOT EXISTS "chat_access_requests_email_idx"
  ON "chat_access_requests" ("email");

-- The notify-when-we-open query: everyone not yet contacted, oldest first.
CREATE INDEX IF NOT EXISTS "chat_access_requests_notified_idx"
  ON "chat_access_requests" ("notified_at", "created_at");
