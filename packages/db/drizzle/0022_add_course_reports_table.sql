-- Rename feedback moderation table to avoid naming conflict with generated reports
-- ALTER TABLE "reports" RENAME TO "feedback_flags";

-- Remove old status enum (no longer used)
DROP TABLE IF EXISTS course_reports;
DROP TYPE IF EXISTS "report_status";

ALTER TABLE reports
RENAME TO feedback_flags;

-- Create reports table for generated PDF reports
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" integer NOT NULL,
	"parameters" jsonb NOT NULL,
	"r2_key" text NOT NULL,
	"ai_summary_json" jsonb,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk"
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
