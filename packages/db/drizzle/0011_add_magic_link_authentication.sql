-- Create user role enum
CREATE TYPE "public"."user_role" AS ENUM('student', 'admin', 'super_admin');

-- Create magic link tables
CREATE TABLE "magic_link_rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "magic_link_rate_limits_email_unique" UNIQUE("email")
);

CREATE TABLE "magic_link_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "magic_link_tokens_token_hash_unique" UNIQUE("token_hash")
);

-- Update users table for magic link support
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'student' NOT NULL;

-- Update timestamps to use timezone
ALTER TABLE "courses" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "courses" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "courses" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "courses" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "course_groups" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "course_groups" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "course_groups" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "course_groups" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "course_relationships" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "course_relationships" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "degrees" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "degrees" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "degrees" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "degrees" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "faculties" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "faculties" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "faculties" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "faculties" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "feedback_drafts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "feedback_drafts" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "feedback_drafts" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "feedback_drafts" ALTER COLUMN "used_at" SET DATA TYPE timestamp with time zone;

ALTER TABLE "password_reset_tokens" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "password_reset_tokens" ALTER COLUMN "used_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "password_reset_tokens" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "password_reset_tokens" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "user_creation_tokens" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "user_creation_tokens" ALTER COLUMN "used_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "user_creation_tokens" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "user_creation_tokens" ALTER COLUMN "created_at" SET DEFAULT now();
