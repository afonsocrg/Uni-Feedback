-- Migration: Add soft deletion to feedback table
-- This migration:
-- 1. Adds deleted_at column to feedback table
-- 2. Renames feedback table to feedback_full
-- 3. Creates a feedback view that filters out deleted feedback

-- Step 1: Add deleted_at column to feedback table
ALTER TABLE "feedback" ADD COLUMN "deleted_at" timestamp with time zone;

-- Step 2: Rename feedback table to feedback_full
ALTER TABLE "feedback" RENAME TO "feedback_full";

-- Step 3: Create a view that filters out deleted feedback
CREATE VIEW "feedback" AS
SELECT
  id,
  user_id,
  email,
  school_year,
  course_id,
  rating,
  workload_rating,
  comment,
  original_comment,
  approved_at,
  created_at,
  updated_at
FROM "feedback_full"
WHERE deleted_at IS NULL;

-- Note: Foreign keys that referenced feedback(id) will automatically be updated
-- to reference feedback_full(id) when the table is renamed.
-- The view cannot be referenced by foreign keys, but queries can join to it.
