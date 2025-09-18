CREATE TABLE IF NOT EXISTS "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"acronym" text NOT NULL,
	"degree_id" integer,
	"ects" real,
	"terms" jsonb,
	"description" text,
	"url" text,
	"bibliography" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"assessment" text,
	"has_mandatory_exam" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"degree_id" integer,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mtm_course_groups__courses" (
	"course_id" integer NOT NULL,
	"course_group_id" integer NOT NULL,
	CONSTRAINT "mtm_course_groups__courses_course_id_course_group_id_pk" PRIMARY KEY("course_id","course_group_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_relationships" (
	"source_course_id" integer NOT NULL,
	"target_course_id" integer NOT NULL,
	"relationship_type" text DEFAULT 'identical' NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "course_relationships_source_course_id_target_course_id_relationship_type_pk" PRIMARY KEY("source_course_id","target_course_id","relationship_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "degrees" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"acronym" text NOT NULL,
	"campus" text NOT NULL,
	"description" text,
	"url" text,
	"faculty_id" integer,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"url" text NOT NULL,
	"email_suffixes" jsonb,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"school_year" integer,
	"course_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"workload_rating" integer,
	"comment" text,
	"original_comment" text,
	"approved_at" timestamp,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"ip_address" text,
	CONSTRAINT "feedback_drafts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"access_token_hash" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "sessions_access_token_hash_unique" UNIQUE("access_token_hash"),
	CONSTRAINT "sessions_refresh_token_hash_unique" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"superuser" boolean DEFAULT false,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_creation_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "user_creation_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_degree_id_degrees_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_degree_id_degrees_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mtm_course_groups__courses" ADD CONSTRAINT "mtm_course_groups__courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mtm_course_groups__courses" ADD CONSTRAINT "mtm_course_groups__courses_course_group_id_course_groups_id_fk" FOREIGN KEY ("course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_relationships" ADD CONSTRAINT "course_relationships_source_course_id_courses_id_fk" FOREIGN KEY ("source_course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_relationships" ADD CONSTRAINT "course_relationships_target_course_id_courses_id_fk" FOREIGN KEY ("target_course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "degrees" ADD CONSTRAINT "degrees_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_creation_tokens" ADD CONSTRAINT "user_creation_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_relationships_source_relationship" ON "course_relationships" USING btree ("source_course_id","relationship_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_relationships_target_relationship" ON "course_relationships" USING btree ("target_course_id","relationship_type");