CREATE TABLE "teachers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "faculty_id" integer,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX "teachers_email_unique" ON "teachers" ("email");

ALTER TABLE "teachers"
  ADD CONSTRAINT "teachers_faculty_id_faculties_id_fk"
  FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id");

CREATE TABLE "course_teacher_assignments" (
  "course_id" integer NOT NULL,
  "teacher_id" integer NOT NULL,
  "school_year" integer NOT NULL,
  CONSTRAINT "course_teacher_assignments_teacher_id_course_id_school_year_pk"
    PRIMARY KEY ("teacher_id", "course_id", "school_year")
);

ALTER TABLE "course_teacher_assignments"
  ADD CONSTRAINT "course_teacher_assignments_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade;

ALTER TABLE "course_teacher_assignments"
  ADD CONSTRAINT "course_teacher_assignments_teacher_id_teachers_id_fk"
  FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE cascade;

CREATE INDEX "idx_course_teacher_assignments_course_year"
  ON "course_teacher_assignments" ("course_id", "school_year");

CREATE INDEX "idx_course_teacher_assignments_teacher_id"
  ON "course_teacher_assignments" ("teacher_id");
