-- Official links of universities and faculties: their profiles on LinkedIn, X, TikTok,
-- Instagram, Facebook and YouTube, shown as icons in the page header and as JSON-LD sameAs.
-- One table for both entities (like sources.entity_names), one row per kind.
--
-- The website stays in universities.url / faculties.url: it is a fact about the school the
-- app already uses everywhere (the "Site oficial" button), not one of a list of profiles.
--
-- Only the school's own account belongs here, taken from its own site (header, footer,
-- contact page); `source_url` is the page it was found on. A faculty that only links to its
-- university's accounts (ISCTE's ESPP and ISTA) gets no rows. A link is shown only once
-- reviewed (reviewed_at set).
--
-- Additive and re-runnable: safe to apply before the code that reads it deploys.

CREATE TABLE IF NOT EXISTS "entity_links" (
  "entity" text NOT NULL,
  "entity_id" integer NOT NULL,
  "kind" text NOT NULL,
  "url" text NOT NULL,
  "source_url" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "entity_links_pk" PRIMARY KEY ("entity", "entity_id", "kind"),
  CONSTRAINT "entity_links_valid_entity" CHECK ("entity" IN ('university', 'faculty')),
  CONSTRAINT "entity_links_valid_kind"
    CHECK ("kind" IN ('linkedin', 'x', 'tiktok', 'instagram', 'facebook', 'youtube'))
);
