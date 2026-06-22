CREATE TABLE "teachers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX "teachers_email_unique" ON "teachers" ("email");

CREATE TABLE "mtm_courses__teachers" (
  "course_id" integer NOT NULL,
  "teacher_id" integer NOT NULL,
  "latest_school_year" text,
  "latest_semester" text,
  "latest_execution_label" text,
  "latest_execution_url" text,
  CONSTRAINT "mtm_courses__teachers_course_id_teacher_id_pk"
    PRIMARY KEY ("course_id", "teacher_id")
);

ALTER TABLE "mtm_courses__teachers"
  ADD CONSTRAINT "mtm_courses__teachers_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade;

ALTER TABLE "mtm_courses__teachers"
  ADD CONSTRAINT "mtm_courses__teachers_teacher_id_teachers_id_fk"
  FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE cascade;

CREATE INDEX "idx_mtm_courses_teachers_teacher_id"
  ON "mtm_courses__teachers" ("teacher_id");
