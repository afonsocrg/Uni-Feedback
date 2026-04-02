-- Create course_stats table
CREATE TABLE IF NOT EXISTS "course_stats" (
  "course_id" integer PRIMARY KEY NOT NULL,
  "average_rating" real,
  "average_workload" real,
  "total_feedback_count" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Create degree_stats table
CREATE TABLE IF NOT EXISTS "degree_stats" (
  "degree_id" integer PRIMARY KEY NOT NULL,
  "course_count" integer NOT NULL DEFAULT 0,
  "feedback_count" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "course_stats" ADD CONSTRAINT "course_stats_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "degree_stats" ADD CONSTRAINT "degree_stats_degree_id_degrees_id_fk"
  FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id")
  ON DELETE cascade ON UPDATE no action;

-- Create indexes for refresh queries
CREATE INDEX IF NOT EXISTS "course_stats_updated_at_idx" ON "course_stats" ("updated_at");
CREATE INDEX IF NOT EXISTS "degree_stats_updated_at_idx" ON "degree_stats" ("updated_at");

-- Populate initial course_stats data
-- This uses the same logic as getEnhancedFeedbackJoinCondition for course relationships
INSERT INTO "course_stats" ("course_id", "average_rating", "average_workload", "total_feedback_count", "updated_at")
SELECT
  c.id AS course_id,
  AVG(f.rating)::real AS average_rating,
  AVG(f.workload_rating)::real AS average_workload,
  COUNT(DISTINCT f.id)::integer AS total_feedback_count,
  NOW() AS updated_at
FROM courses c
LEFT JOIN feedback f ON (
  f.approved_at IS NOT NULL
  AND (
    f.course_id = c.id
    OR f.course_id IN (
      SELECT target_course_id
      FROM course_relationships
      WHERE source_course_id = c.id
        AND relationship_type = 'identical'
    )
  )
)
GROUP BY c.id
ON CONFLICT (course_id) DO NOTHING;

-- Populate initial degree_stats data
INSERT INTO "degree_stats" ("degree_id", "course_count", "feedback_count", "updated_at")
SELECT
  d.id AS degree_id,
  COUNT(DISTINCT c.id)::integer AS course_count,
  COUNT(DISTINCT f.id)::integer AS feedback_count,
  NOW() AS updated_at
FROM degrees d
LEFT JOIN courses c ON c.degree_id = d.id
LEFT JOIN feedback f ON (
  f.approved_at IS NOT NULL
  AND (
    f.course_id = c.id
    OR f.course_id IN (
      SELECT target_course_id
      FROM course_relationships
      WHERE source_course_id = c.id
        AND relationship_type = 'identical'
    )
  )
)
GROUP BY d.id
ON CONFLICT (degree_id) DO NOTHING;
