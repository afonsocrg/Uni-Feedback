-- Manual migration to convert all timestamp columns to timezone-aware timestamps
-- This migration assumes the existing data was stored in UTC (typical for web applications)

BEGIN;

-- Users table
ALTER TABLE "users" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "users" ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';

-- Course Groups table
ALTER TABLE "course_groups" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "course_groups" ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';

-- Courses table
ALTER TABLE "courses" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "courses" ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';

-- Feedback Drafts table
ALTER TABLE "feedback_drafts" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "feedback_drafts" ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "feedback_drafts" ALTER COLUMN "used_at" TYPE timestamp with time zone USING "used_at" AT TIME ZONE 'UTC';

-- Password Reset Tokens table
ALTER TABLE "password_reset_tokens" ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "password_reset_tokens" ALTER COLUMN "used_at" TYPE timestamp with time zone USING "used_at" AT TIME ZONE 'UTC';
ALTER TABLE "password_reset_tokens" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';

-- Sessions table
ALTER TABLE "sessions" ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "sessions" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';

-- User Creation Tokens table
ALTER TABLE "user_creation_tokens" ALTER COLUMN "expires_at" TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "user_creation_tokens" ALTER COLUMN "used_at" TYPE timestamp with time zone USING "used_at" AT TIME ZONE 'UTC';
ALTER TABLE "user_creation_tokens" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';

-- Degrees table
ALTER TABLE "degrees" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "degrees" ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';

-- Course Relationships table
ALTER TABLE "course_relationships" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';

-- Faculties table
ALTER TABLE "faculties" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "faculties" ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';

-- Feedback table (already has timezone awareness in schema, but let's ensure data consistency)
-- If the existing data was stored without timezone, convert it
ALTER TABLE "feedback" ALTER COLUMN "approved_at" TYPE timestamp with time zone USING
  CASE
    WHEN "approved_at" IS NOT NULL THEN "approved_at" AT TIME ZONE 'UTC'
    ELSE NULL
  END;
ALTER TABLE "feedback" ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';

-- Update default values to use timezone-aware now()
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "course_groups" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "course_groups" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "courses" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "courses" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "feedback_drafts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "password_reset_tokens" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "user_creation_tokens" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "degrees" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "degrees" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "course_relationships" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "faculties" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "faculties" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "feedback" ALTER COLUMN "created_at" SET DEFAULT now();

COMMIT;