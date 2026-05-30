CREATE TABLE "audio_recordings" (
  "id" serial PRIMARY KEY NOT NULL,
  "feedback_id" integer,
  "course_id" integer NOT NULL,
  "r2_key" text NOT NULL,
  "audio_format" text NOT NULL DEFAULT 'webm',
  "duration_seconds" integer,
  "transcript" text,
  "consent_given" boolean NOT NULL DEFAULT false,
  "consent_given_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "audio_recordings"
  ADD CONSTRAINT "audio_recordings_feedback_id_feedback_full_id_fk"
  FOREIGN KEY ("feedback_id") REFERENCES "feedback_full"("id") ON DELETE set null;

ALTER TABLE "audio_recordings"
  ADD CONSTRAINT "audio_recordings_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade;
