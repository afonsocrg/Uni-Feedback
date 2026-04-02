-- Add missing columns to courses table
ALTER TABLE "courses" ADD COLUMN "is_mandatory" boolean;
ALTER TABLE "courses" ADD COLUMN "duration" text;
