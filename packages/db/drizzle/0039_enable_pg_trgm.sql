-- Trigram indexes for course and degree name/acronym search.
--
-- Why now: entity resolution is the load-bearing part of the AI chat, and every
-- lookup today is `unaccent(name) ILIKE '%...%'`, which is a sequential scan over
-- 8,070 courses. It also cannot match a student's variant against ours: Phase 0
-- failed on "LEIC-A" (stored "LEIC") and "AM3" (stored "AM-I"/"AM-II").
--
-- A token-relaxation fallback recovered most of those without trigrams, so this
-- is an improvement rather than a fix. What it buys:
--   * the existing ILIKE '%...%' searches become index-assisted
--   * similarity() ranking becomes available for the variants relaxation misses
--
-- Re-runnable: extension, function and indexes are all guarded or CREATE OR REPLACE.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- `unaccent()` is STABLE, not IMMUTABLE, because it depends on a dictionary that
-- could in principle be changed. Postgres therefore refuses to build an
-- expression index on it. This wrapper pins the dictionary explicitly and asserts
-- immutability, which is the standard workaround and safe as long as the
-- unaccent dictionary is not redefined underneath us.
CREATE OR REPLACE FUNCTION "immutable_unaccent"(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  STRICT
AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, $1)
$$;

CREATE INDEX IF NOT EXISTS "courses_name_trgm_idx"
  ON "courses" USING gin ("immutable_unaccent"("name") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "courses_acronym_trgm_idx"
  ON "courses" USING gin ("immutable_unaccent"("acronym") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "degrees_name_trgm_idx"
  ON "degrees" USING gin ("immutable_unaccent"("name") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "degrees_acronym_trgm_idx"
  ON "degrees" USING gin ("immutable_unaccent"("acronym") gin_trgm_ops);

-- NOTE for whoever wires this into queries: an index on
-- `immutable_unaccent(name)` is only used when the query says
-- `immutable_unaccent(name) ILIKE ...`, not `unaccent(name) ILIKE ...`.
-- The retrieval layer must call the same function name the index was built on.
