-- Let the same address ask more than once.
--
-- The unique index made every second submission an UPDATE of the first, and an
-- update here is a deletion of whatever they told us the first time: the
-- universities they picked, the question they typed, which surface they came
-- from. The people who submit twice are precisely the ones with something to
-- add, so the tidiest-looking row was costing the most useful answer.
--
-- What the uniqueness was buying, "how many people are waiting", is a
-- `count(DISTINCT email)` away:
--
--   SELECT count(DISTINCT email) FROM chat_access_requests;
--
-- Re-runnable.

DROP INDEX IF EXISTS "chat_access_requests_email_idx";

-- Same name, no longer unique. Still wanted: the request endpoint looks the
-- address up on every submission to tell a repeat from a first ask, and the
-- notify-when-we-open pass groups by it.
CREATE INDEX IF NOT EXISTS "chat_access_requests_email_idx"
  ON "chat_access_requests" ("email");
