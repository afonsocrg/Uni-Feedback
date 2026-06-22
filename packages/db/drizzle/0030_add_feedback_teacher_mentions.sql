ALTER TABLE "feedback_full"
  ADD COLUMN "mentions_teaching_staff" boolean DEFAULT false NOT NULL;

CREATE TABLE "mtm_feedback__teachers" (
  "feedback_id" integer NOT NULL,
  "teacher_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "mtm_feedback__teachers_feedback_id_teacher_id_pk"
    PRIMARY KEY ("feedback_id", "teacher_id")
);

ALTER TABLE "mtm_feedback__teachers"
  ADD CONSTRAINT "mtm_feedback__teachers_feedback_id_feedback_full_id_fk"
  FOREIGN KEY ("feedback_id") REFERENCES "feedback_full"("id") ON DELETE cascade;

ALTER TABLE "mtm_feedback__teachers"
  ADD CONSTRAINT "mtm_feedback__teachers_teacher_id_teachers_id_fk"
  FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE cascade;
