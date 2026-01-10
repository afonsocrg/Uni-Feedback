CREATE TABLE "ai_categorization_cache" (
	"comment_hash" text PRIMARY KEY NOT NULL,
	"has_teaching" boolean NOT NULL,
	"has_assessment" boolean NOT NULL,
	"has_materials" boolean NOT NULL,
	"has_tips" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL
);
