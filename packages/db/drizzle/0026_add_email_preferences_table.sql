-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create email_preferences table for managing email subscriptions
CREATE TABLE IF NOT EXISTS "email_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE,
  "unsubscribe_token" text NOT NULL UNIQUE,
  "subscribed_reminders" boolean NOT NULL DEFAULT true,
  "unsubscribed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

-- Create index on unsubscribe_token for fast lookups
CREATE INDEX IF NOT EXISTS "email_preferences_token_idx" ON "email_preferences" ("unsubscribe_token");

-- Populate email_preferences for all existing users with random tokens
INSERT INTO "email_preferences" ("user_id", "unsubscribe_token", "subscribed_reminders", "created_at")
SELECT
  id AS user_id,
  encode(gen_random_bytes(32), 'hex') AS unsubscribe_token,
  true AS subscribed_reminders,
  NOW() AS created_at
FROM users
ON CONFLICT (user_id) DO NOTHING;
