-- Create enum type for report status
CREATE TYPE "report_status" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- Create course_reports table
CREATE TABLE "course_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"school_year" integer NOT NULL,
	"r2_key" text NOT NULL,
	"ai_summary_json" jsonb,
	"feedback_count" integer NOT NULL,
	"last_feedback_timestamp" timestamp with time zone,
	"template_version" integer DEFAULT 1 NOT NULL,
	"status" "report_status" DEFAULT 'GENERATING' NOT NULL,
	"error_message" text,
	"generation_attempts" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_reports_course_id_school_year_unique" UNIQUE("course_id", "school_year")
);

-- Add foreign key constraint
ALTER TABLE "course_reports" ADD CONSTRAINT "course_reports_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade ON UPDATE no action;

-- Add index on status for efficient queries
CREATE INDEX "course_reports_status_idx" ON "course_reports" ("status");
