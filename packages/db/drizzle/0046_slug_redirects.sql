-- Slug redirects: old faculty and degree URLs keep working after a rename.
--
-- Faculty and degree pages live at /<faculty slug>/<degree slug>. Renaming a
-- slug (IST 2026/2027: LEAN became LENO, so /ist/lean should become /ist/leno)
-- used to break every URL with the old one: Google results, shared links, the
-- last degree each student's browser remembers. These tables keep the old
-- slugs, and the website answers them with a 301 to the current URL.
--
-- Rows are written by the triggers below, never by hand: rename the slug with a
-- plain UPDATE (SQL or dashboard) and the old one is recorded in the same
-- transaction. Each row points at the entity's id, not at its new slug, so a
-- chain of renames (a -> b -> c) still lands on the current slug in one hop.
--
-- A live slug always wins: the website only looks here when no faculty or
-- degree has the slug, and the triggers delete a redirect as soon as a live
-- row takes its slug (renaming back, or a new degree reusing it).
--
-- Degree slugs are only unique within a faculty, so degree redirects are keyed
-- by (faculty_id, old_slug). Moving a degree to another faculty records its old
-- (faculty, slug) too. Faculty and degree redirects compose:
-- /old-faculty/old-degree resolves both in one 301.
--
-- Redirects never expire. Re-runnable.

CREATE TABLE IF NOT EXISTS "faculty_slug_redirects" (
  "id" serial PRIMARY KEY,
  "old_slug" text NOT NULL,
  "faculty_id" integer NOT NULL REFERENCES "faculties"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "faculty_slug_redirects_old_slug_unique" UNIQUE ("old_slug")
);

CREATE TABLE IF NOT EXISTS "degree_slug_redirects" (
  "id" serial PRIMARY KEY,
  "faculty_id" integer NOT NULL REFERENCES "faculties"("id") ON DELETE CASCADE,
  "old_slug" text NOT NULL,
  "degree_id" integer NOT NULL REFERENCES "degrees"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "degree_slug_redirects_faculty_old_slug_unique" UNIQUE ("faculty_id", "old_slug")
);

CREATE OR REPLACE FUNCTION record_faculty_slug_redirect() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL AND OLD.slug IS DISTINCT FROM NEW.slug THEN
    INSERT INTO faculty_slug_redirects (old_slug, faculty_id)
    VALUES (OLD.slug, NEW.id)
    ON CONFLICT (old_slug) DO UPDATE SET faculty_id = EXCLUDED.faculty_id;
  END IF;
  IF NEW.slug IS NOT NULL THEN
    DELETE FROM faculty_slug_redirects WHERE old_slug = NEW.slug;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_degree_slug_redirect() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL AND OLD.faculty_id IS NOT NULL
     AND (OLD.slug IS DISTINCT FROM NEW.slug OR OLD.faculty_id IS DISTINCT FROM NEW.faculty_id) THEN
    INSERT INTO degree_slug_redirects (faculty_id, old_slug, degree_id)
    VALUES (OLD.faculty_id, OLD.slug, NEW.id)
    ON CONFLICT (faculty_id, old_slug) DO UPDATE SET degree_id = EXCLUDED.degree_id;
  END IF;
  IF NEW.slug IS NOT NULL AND NEW.faculty_id IS NOT NULL THEN
    DELETE FROM degree_slug_redirects
    WHERE faculty_id = NEW.faculty_id AND old_slug = NEW.slug;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS faculties_slug_redirect ON "faculties";
CREATE TRIGGER faculties_slug_redirect
  AFTER INSERT OR UPDATE OF slug ON "faculties"
  FOR EACH ROW EXECUTE FUNCTION record_faculty_slug_redirect();

DROP TRIGGER IF EXISTS degrees_slug_redirect ON "degrees";
CREATE TRIGGER degrees_slug_redirect
  AFTER INSERT OR UPDATE OF slug, faculty_id ON "degrees"
  FOR EACH ROW EXECUTE FUNCTION record_degree_slug_redirect();
