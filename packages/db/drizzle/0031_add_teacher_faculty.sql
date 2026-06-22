ALTER TABLE "teachers" ADD COLUMN "faculty_id" integer;
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;
