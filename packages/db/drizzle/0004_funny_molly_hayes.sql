ALTER TABLE "feedback" ALTER COLUMN "approved_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "feedback" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "feedback" ALTER COLUMN "created_at" SET DEFAULT now();