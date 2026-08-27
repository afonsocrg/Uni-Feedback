-- Give chats an opaque public id for URLs.
--
-- `/chat/7` has two problems. The small one is that it looks like plumbing.
-- The larger one is that a sequential id tells anyone who visits how many chats
-- the platform has ever had, and invites walking the range. Reads are scoped by
-- user, so this is not an access hole, but it leaks volume for nothing.
--
-- A uuid rather than a slug: a slug would have to come from the title, which
-- does not exist until after the first exchange, so it would either be missing
-- exactly when the URL is first written or change under the student afterwards.
--
-- The integer `id` stays the primary key. Every foreign key already points at
-- it, and rewriting those to gain a prettier URL would be a large change for no
-- benefit: `public_id` is an addressing concern, not an identity one.

ALTER TABLE "chats"
  ADD COLUMN IF NOT EXISTS "public_id" uuid NOT NULL DEFAULT gen_random_uuid();

-- What the URL resolves on, so it has to be unique and fast.
CREATE UNIQUE INDEX IF NOT EXISTS "chats_public_id_idx"
  ON "chats" ("public_id");
