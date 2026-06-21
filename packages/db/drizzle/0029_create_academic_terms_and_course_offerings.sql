-- Course offerings & academic terms model (see ADR-0001).
-- Replaces courses.curriculum_year + courses.terms with two relational tables.
-- Phase 1 of 4: create the tables. Old columns stay in place until 0032.

CREATE TABLE "academic_terms" (
  "id" serial PRIMARY KEY NOT NULL,
  "faculty_id" integer NOT NULL,
  "name" text NOT NULL,
  "start_tick" integer NOT NULL,
  "end_tick" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "academic_terms_valid_interval" CHECK ("start_tick" <= "end_tick"),
  CONSTRAINT "academic_terms_faculty_name_unique" UNIQUE ("faculty_id", "name")
);

ALTER TABLE "academic_terms"
  ADD CONSTRAINT "academic_terms_faculty_id_faculties_id_fk"
  FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE cascade;

CREATE TABLE "course_offerings" (
  "id" serial PRIMARY KEY NOT NULL,
  "course_id" integer NOT NULL,
  "curriculum_year" integer,
  "academic_term_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "course_offerings_unique" UNIQUE ("course_id", "curriculum_year", "academic_term_id"),
  CONSTRAINT "course_offerings_valid_year" CHECK ("curriculum_year" IS NULL OR "curriculum_year" >= 1)
);

ALTER TABLE "course_offerings"
  ADD CONSTRAINT "course_offerings_course_id_courses_id_fk"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade;

ALTER TABLE "course_offerings"
  ADD CONSTRAINT "course_offerings_academic_term_id_academic_terms_id_fk"
  FOREIGN KEY ("academic_term_id") REFERENCES "academic_terms"("id") ON DELETE cascade;

CREATE INDEX "idx_academic_terms_faculty" ON "academic_terms" ("faculty_id");
CREATE INDEX "idx_course_offerings_course" ON "course_offerings" ("course_id");
CREATE INDEX "idx_course_offerings_term" ON "course_offerings" ("academic_term_id");
