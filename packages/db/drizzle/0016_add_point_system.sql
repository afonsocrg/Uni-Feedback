-- Create point source type enum
CREATE TYPE "public"."point_source_type" AS ENUM('submit_feedback', 'referral');

-- Create feedback_analysis table
CREATE TABLE IF NOT EXISTS "public"."feedback_analysis" (
	"feedback_id" integer PRIMARY KEY NOT NULL,
	"has_teaching" boolean NOT NULL DEFAULT false,
	"has_assessment" boolean NOT NULL DEFAULT false,
	"has_materials" boolean NOT NULL DEFAULT false,
	"has_tips" boolean NOT NULL DEFAULT false,
	"word_count" integer NOT NULL,
	"analyzed_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

-- Create point_registry table
CREATE TABLE IF NOT EXISTS "public"."point_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"source_type" "point_source_type" NOT NULL,
	"reference_id" integer,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "public"."feedback_analysis" ADD CONSTRAINT "feedback_analysis_feedback_id_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "public"."point_registry" ADD CONSTRAINT "point_registry_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "point_registry_user_id_idx" ON "public"."point_registry" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "point_registry_source_reference_idx" ON "public"."point_registry" USING btree ("source_type","reference_id");

-- Add updated_at column to feedback table
ALTER TABLE "public"."feedback" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at on row changes
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON "public"."feedback"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_analysis_updated_at BEFORE UPDATE ON "public"."feedback_analysis"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_point_registry_updated_at BEFORE UPDATE ON "public"."point_registry"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
