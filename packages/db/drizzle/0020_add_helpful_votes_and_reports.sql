-- Create report_category enum
CREATE TYPE "public"."report_category" AS ENUM (
  'harassment_hate_speech',
  'spam_irrelevant',
  'inaccurate_information',
  'privacy_violation',
  'outdated_content',
  'other'
);

-- Create helpful_votes table
CREATE TABLE IF NOT EXISTS "helpful_votes" (
  "user_id" integer NOT NULL,
  "feedback_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "helpful_votes_pkey" PRIMARY KEY ("user_id", "feedback_id")
);

-- Create reports table
CREATE TABLE IF NOT EXISTS "reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "feedback_id" integer NOT NULL,
  "category" "report_category" NOT NULL,
  "details" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "moderated_at" timestamp with time zone
);

-- Add foreign key constraints for helpful_votes
ALTER TABLE "helpful_votes" ADD CONSTRAINT "helpful_votes_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "helpful_votes" ADD CONSTRAINT "helpful_votes_feedback_id_feedback_full_id_fk"
  FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback_full"("id")
  ON DELETE cascade ON UPDATE no action;

-- Add foreign key constraints for reports
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "reports" ADD CONSTRAINT "reports_feedback_id_feedback_full_id_fk"
  FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback_full"("id")
  ON DELETE cascade ON UPDATE no action;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "helpful_votes_feedback_id_idx" ON "helpful_votes" ("feedback_id");
CREATE INDEX IF NOT EXISTS "reports_feedback_id_idx" ON "reports" ("feedback_id");
CREATE INDEX IF NOT EXISTS "reports_moderated_at_idx" ON "reports" ("moderated_at") WHERE "moderated_at" IS NULL;
