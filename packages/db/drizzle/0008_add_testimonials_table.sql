DROP TABLE IF EXISTS "testimonials";

CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"testimonial" text NOT NULL,
	"name" text NOT NULL,
	"course" text NOT NULL,
	"avatar_url" text,
	"url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
