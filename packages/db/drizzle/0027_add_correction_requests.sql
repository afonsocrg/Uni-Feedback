CREATE TYPE "correction_request_field" AS ENUM (
  'name', 'acronym', 'ects', 'terms', 'url',
  'has_mandatory_exam', 'description', 'assessment', 'bibliography', 'other'
);

CREATE TYPE "correction_request_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "correction_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "course_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "field" "correction_request_field" NOT NULL,
  "current_value" text,
  "notes" text NOT NULL,
  "status" "correction_request_status" NOT NULL DEFAULT 'pending',
  "resolved_by" integer,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "correction_requests"
  ADD CONSTRAINT "correction_requests_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade;

ALTER TABLE "correction_requests"
  ADD CONSTRAINT "correction_requests_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

ALTER TABLE "correction_requests"
  ADD CONSTRAINT "correction_requests_resolved_by_users_id_fk"
  FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE set null;
