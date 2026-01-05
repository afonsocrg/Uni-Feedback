-- Rename analyzed_at to created_at in feedback_analysis table
ALTER TABLE "public"."feedback_analysis"
  RENAME COLUMN "analyzed_at" TO "created_at";

-- Add reviewed_at column to feedback_analysis table
-- This column tracks when a moderator first reviewed/modified the analysis
-- NULL means the analysis was auto-generated and never manually reviewed
ALTER TABLE "public"."feedback_analysis"
  ADD COLUMN "reviewed_at" timestamp with time zone;
