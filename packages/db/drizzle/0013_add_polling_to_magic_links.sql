ALTER TABLE "magic_link_tokens" ADD COLUMN "request_id" text;--> statement-breakpoint
ALTER TABLE "magic_link_tokens" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_request_id_unique" UNIQUE("request_id");