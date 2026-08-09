-- AI chat: conversations, messages, the entities each message touched, per-answer
-- feedback, and the waitlist for faculties the chat is not enabled for yet.
--
-- Plan: afonsocrg/prds/2026-08-09_ai_chat.md (Phase 1)
--
-- Two rules run through this file:
--
-- 1. FKs to `users` are RESTRICT, never CASCADE. Account deletion anonymises by
--    transferring foreign keys to a fresh `deleted-user-*` row (see
--    AuthService.deleteUserAccount). If a transfer is ever forgotten, we want the
--    delete to FAIL LOUDLY rather than silently destroy chat history. A failing
--    delete is a bug we can see; a silent cascade is data we never get back.
--    This matches feedback_full.user_id, which declares no ON DELETE for the
--    same reason.
--
-- 2. Inside the chat aggregate, CASCADE is correct: chats are only ever
--    soft-deleted, so a hard delete of a chat row is a deliberate admin act that
--    wants its messages gone too.
--
-- Re-runnable: every statement is guarded.

-- ---------------------------------------------------------------------------
-- chats
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "chats" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,

  -- Generated from the first exchange by a cheap model, so NULL until then.
  "title" text,

  -- UI locale when the chat was created. The assistant answers in the language
  -- of the question, not this, but it is worth knowing which surface it came from.
  "language" text,

  -- Context variables: what this chat is scoped to. Set automatically when the
  -- student arrives from a course or degree page, or manually via the selector.
  -- Retrieval defaults to this scope, which removes most of the entity ambiguity
  -- that dominated the Phase 0 failures. Nullable: an unscoped chat is valid.
  "context_faculty_id" integer REFERENCES "faculties" ("id") ON DELETE SET NULL,
  "context_degree_id" integer REFERENCES "degrees" ("id") ON DELETE SET NULL,
  "context_course_id" integer REFERENCES "courses" ("id") ON DELETE SET NULL,
  -- 'course_page' | 'degree_page' | 'manual' | NULL. Kept so we can ask whether
  -- students arriving with context got better answers than those starting cold.
  "context_source" text,

  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  -- Denormalised for cheap "recent chats" ordering without touching messages.
  "last_message_at" timestamp with time zone,
  -- Soft delete, same convention as feedback_full. Deleting a chat hides it and
  -- stops it being used; it never destroys the record.
  "deleted_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "chats_user_recent_idx"
  ON "chats" ("user_id", "last_message_at" DESC);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "chat_message_role" AS ENUM ('user', 'assistant', 'system', 'tool');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" serial PRIMARY KEY NOT NULL,
  "chat_id" integer NOT NULL REFERENCES "chats" ("id") ON DELETE CASCADE,
  -- Position within the chat. Unique per chat so ordering never depends on ids.
  "seq" integer NOT NULL,
  "role" "chat_message_role" NOT NULL,
  "content" text NOT NULL,

  -- Everything we will want when debugging but never filter on: tool calls and
  -- their arguments, resolved entity candidates, finish reason, guardrail
  -- verdicts, cache hits, provider request id. Kept as jsonb so the schema does
  -- not churn every time the alpha needs one more field.
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,

  -- Promoted out of metadata because these get aggregated constantly.
  "model" text,
  "input_tokens" integer,
  "output_tokens" integer,
  -- Integer micro-euros. Never a float: costs get summed.
  "cost_micros" integer,
  "latency_ms" integer,

  "created_at" timestamp with time zone DEFAULT now() NOT NULL,

  CONSTRAINT "chat_messages_chat_seq_unique" UNIQUE ("chat_id", "seq")
);

CREATE INDEX IF NOT EXISTS "chat_messages_chat_idx"
  ON "chat_messages" ("chat_id", "seq");

-- ---------------------------------------------------------------------------
-- chat_message_entities
-- ---------------------------------------------------------------------------
--
-- Polymorphic on purpose. The query we will run every week is "what are students
-- asking about", which is one GROUP BY here and a five-way UNION ALL if this were
-- one link table per type. The cost is losing FK integrity, which is acceptable:
-- courses and degrees are never hard-deleted in this codebase, and a dangling row
-- in an analytics table is harmless.
--
-- `relation` separates two different questions:
--   mentioned  (on a user message)      -> what the student asked about
--   retrieved  (on an assistant message) -> what the system fed the model
--   cited                                -> what the answer actually linked to
-- Validated by the Phase 0 spike, which populates exactly this shape.

DO $$ BEGIN
  CREATE TYPE "chat_entity_type" AS ENUM ('course', 'degree', 'faculty', 'university', 'feedback');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "chat_entity_relation" AS ENUM ('mentioned', 'retrieved', 'cited');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "chat_message_entities" (
  "id" serial PRIMARY KEY NOT NULL,
  "message_id" integer NOT NULL REFERENCES "chat_messages" ("id") ON DELETE CASCADE,
  "entity_type" "chat_entity_type" NOT NULL,
  "entity_id" integer NOT NULL,
  "relation" "chat_entity_relation" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,

  CONSTRAINT "chat_message_entities_unique"
    UNIQUE ("message_id", "entity_type", "entity_id", "relation")
);

-- "everything students asked about course X"
CREATE INDEX IF NOT EXISTS "chat_message_entities_entity_idx"
  ON "chat_message_entities" ("entity_type", "entity_id");

-- "what were students asking about in July"
CREATE INDEX IF NOT EXISTS "chat_message_entities_entity_time_idx"
  ON "chat_message_entities" ("entity_type", "created_at");

-- ---------------------------------------------------------------------------
-- chat_message_feedback
-- ---------------------------------------------------------------------------
--
-- Per assistant message, not per chat: "this chat was bad" is not actionable,
-- "this answer was bad" points at one message, one set of tool calls and one set
-- of retrieved entities.
--
-- This is the cheapest detector we have for the failure mode Phase 0 showed
-- matters most: confident, well-formatted, wrong answers, which are invisible to
-- every other dashboard.

DO $$ BEGIN
  CREATE TYPE "chat_feedback_rating" AS ENUM ('helpful', 'not_helpful');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "chat_message_feedback" (
  "id" serial PRIMARY KEY NOT NULL,
  "message_id" integer NOT NULL REFERENCES "chat_messages" ("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "rating" "chat_feedback_rating" NOT NULL,
  -- Optional, and only ever asked for after a thumbs down.
  "comment" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,

  CONSTRAINT "chat_message_feedback_unique" UNIQUE ("message_id", "user_id")
);

-- ---------------------------------------------------------------------------
-- chat_access_requests
-- ---------------------------------------------------------------------------
--
-- The coverage wall turned into a demand signal. A student whose faculty is not
-- chat-enabled is asked to help or to join the waitlist, and that waitlist tells
-- us which university to enrich next, sorted by real demand instead of guesswork.
--
-- user_id is NULLABLE: applicants and high-school students cannot create an
-- account at all under the current auth model, so the one CTA aimed at them has
-- to work without one. See afonsocrg/prds/2026-08-09_identity_and_affiliation.md.

CREATE TABLE IF NOT EXISTS "chat_access_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer REFERENCES "users" ("id") ON DELETE RESTRICT,
  -- Always present: without an account this is how we reach them.
  "email" text NOT NULL,
  "faculty_id" integer NOT NULL REFERENCES "faculties" ("id") ON DELETE CASCADE,
  "degree_id" integer REFERENCES "degrees" ("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  -- Set when the faculty is switched on and the waitlist is emailed. This is
  -- what closes the loop and makes the list a re-engagement asset.
  "notified_at" timestamp with time zone,

  CONSTRAINT "chat_access_requests_email_faculty_unique" UNIQUE ("email", "faculty_id")
);

CREATE INDEX IF NOT EXISTS "chat_access_requests_faculty_idx"
  ON "chat_access_requests" ("faculty_id");

-- ---------------------------------------------------------------------------
-- faculties.chat_enabled
-- ---------------------------------------------------------------------------
--
-- The alpha opens on IST only: it is the only faculty where both the structural
-- data and the opinion data are dense (1,850 courses, 1,769 with a description,
-- 2,061 approved reviews). Faculties with no course descriptions would answer
-- "I don't have that information" to almost everything and read as broken.
--
-- A flag rather than a constant so widening coverage is a DB update, not a deploy.

ALTER TABLE "faculties"
  ADD COLUMN IF NOT EXISTS "chat_enabled" boolean DEFAULT false NOT NULL;
