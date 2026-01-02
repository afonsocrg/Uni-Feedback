-- Step 1: Add columns as nullable initially
ALTER TABLE "users" ADD COLUMN "referral_code" text;
ALTER TABLE "users" ADD COLUMN "referred_by_user_id" integer;

-- Step 2: Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_user_id_users_id_fk"
  FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;

-- Step 3: Generate referral codes for existing users
UPDATE "users" SET "referral_code" =
  lower(substring(md5(random()::text || email || id::text) from 1 for 8))
WHERE "referral_code" IS NULL;

-- Step 4: Add unique constraint (allows NULL for GDPR compliance)
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");

-- Step 5: Add referral_code to magic_link_tokens
ALTER TABLE "magic_link_tokens" ADD COLUMN "referral_code" text;
