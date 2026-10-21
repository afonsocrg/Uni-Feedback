-- Degree relationships, like course_relationships but for degrees (decision 23 in
-- prds/content_rich_pages.md). Types:
--   equivalent      the same degree at another faculty or university (symmetric)
--   similar         related degrees, mostly in the same faculty (symmetric)
--   campus_sibling  the same degree on another campus, e.g. LEIC-A / LEIC-T (symmetric)
--   continues_to    directed: this licenciatura usually leads to this mestrado
-- Symmetric types are stored in both directions, like course_relationships. `source` says
-- how the link was found ('dges_codc', 'cnaef', 'catalogue', 'manual', ...).
--
-- Re-runnable.

CREATE TABLE IF NOT EXISTS "degree_relationships" (
  "source_degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "target_degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "relationship_type" text NOT NULL,
  "source" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_relationships_pk" PRIMARY KEY ("source_degree_id", "target_degree_id", "relationship_type"),
  CONSTRAINT "degree_relationships_not_self" CHECK ("source_degree_id" <> "target_degree_id"),
  CONSTRAINT "degree_relationships_valid_type" CHECK ("relationship_type" IN ('equivalent', 'similar', 'campus_sibling', 'continues_to'))
);

CREATE INDEX IF NOT EXISTS "degree_relationships_target_idx" ON "degree_relationships" ("target_degree_id", "relationship_type");
