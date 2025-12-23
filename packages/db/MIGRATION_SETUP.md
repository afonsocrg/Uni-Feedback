# Migration Setup Guide

## What Happened

The database was originally created with manual migrations (0000-0010) without proper Drizzle migration tracking. This caused issues when trying to generate new migrations because Drizzle didn't know what was already applied.

**Solution:** We've set up proper migration tracking and created a clean migration (0011) for the magic link authentication feature.

## What Was Done (Local Database)

1. ✅ Created `__drizzle_migrations` table for tracking
2. ✅ Marked all existing migrations (0000-0010) as applied
3. ✅ Created migration `0011_add_magic_link_authentication.sql` with:
   - Magic link authentication tables (`magic_link_tokens`, `magic_link_rate_limits`)
   - User role system (`user_role` enum + `role` column)
   - Made `password_hash` nullable (for passwordless auth)
   - Updated all timestamps to use `timestamp with time zone`
4. ✅ Applied migration 0011 to local database
5. ✅ Recreated `drizzle/meta/_journal.json` with all migrations

## Applying to Production

### Option 1: Automated Script (Recommended)

Run the setup script which will:
- Create migration tracking table
- Mark existing migrations as applied
- Apply migration 0011

```bash
# From packages/db directory
dotenv -- ./scripts/setup_migration_tracking.sh
```

### Option 2: Manual SQL Execution

If you prefer to run SQL manually or need more control:

```bash
# 1. Create migration tracking table
psql $DATABASE_URL << 'EOF'
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
EOF

# 2. Mark existing migrations as applied
psql $DATABASE_URL << 'EOF'
INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES
  ('0000_init_postgresql_schema', 1728000000000),
  ('0002_add-slug-columns', 1728000001000),
  ('0003_drop-unique-constraints-on-slugs', 1728000002000),
  ('0004_funny_molly_hayes', 1728000003000),
  ('0005_add_curriculum_year_to_courses', 1728000004000),
  ('0006_add_student_clubs_table', 1728000005000),
  ('0007_add_image_columns_to_faculties', 1728000006000),
  ('0008_add_testimonials_table', 1728000007000),
  ('0009_insert_initial_testimonials', 1728000008000),
  ('0010_add_type_column_to_student_clubs', 1728000009000);
EOF

# 3. Apply the new migration
psql $DATABASE_URL -f drizzle/0011_add_magic_link_authentication.sql

# 4. Mark new migration as applied
psql $DATABASE_URL << 'EOF'
INSERT INTO "__drizzle_migrations" (hash, created_at)
VALUES ('0011_add_magic_link_authentication', extract(epoch from now())::bigint * 1000);
EOF
```

### Option 3: Using Drizzle's Migrate Tool

**NOT RECOMMENDED** for this specific case because we're bootstrapping existing migrations, but for future migrations:

```bash
pnpm run migrate
```

## Verification

After setup, verify everything is correct:

```bash
# Check migration tracking
psql $DATABASE_URL -c "SELECT id, hash FROM __drizzle_migrations ORDER BY id;"

# Should show 11 migrations (0000, 0002-0011)

# Verify magic link tables exist
psql $DATABASE_URL -c "\dt magic_*"

# Verify user table has role column
psql $DATABASE_URL -c "\d users"
```

## Future Migrations

Now that migration tracking is set up, you can generate and apply migrations normally:

```bash
# Generate new migration
pnpm run generate

# Apply migrations
pnpm run migrate
```

## Migration Files

Current migrations:
- `0000` - Initial PostgreSQL schema
- `0002` - Add slug columns
- `0003` - Drop unique constraints on slugs
- `0004` - Funny molly hayes (various updates)
- `0005` - Add curriculum_year to courses
- `0006` - Add student_clubs table
- `0007` - Add image columns to faculties
- `0008` - Add testimonials table
- `0009` - Insert initial testimonials
- `0010` - Add type column to student_clubs
- `0011` - **Magic link authentication** (NEW)

## What's in Migration 0011

### New Tables
- `magic_link_tokens` - Stores magic link tokens for passwordless auth
- `magic_link_rate_limits` - Rate limiting for magic link requests

### Schema Changes
- Created `user_role` enum type (student, admin, super_admin)
- Added `role` column to `users` table
- Made `password_hash` nullable (students use magic links)
- Updated all timestamps to `timestamp with time zone` for better timezone handling

## Troubleshooting

### "relation already exists" errors

If you get errors about tables already existing, it means migration 0011 was already applied. You can either:
1. Skip the migration (it's already done)
2. Check which migrations are in `__drizzle_migrations` table

### Migration tracking out of sync

If migrations are out of sync:
```bash
# Check what's tracked
psql $DATABASE_URL -c "SELECT * FROM __drizzle_migrations ORDER BY id;"

# Check what files exist
ls -1 drizzle/*.sql
```

Both should match. If not, manually adjust the `__drizzle_migrations` table.

## Notes

- **DO NOT** delete the `drizzle/meta/_journal.json` file - it's required for Drizzle tooling
- **DO NOT** manually edit migration files after they're applied
- The timestamps in migration tracking (`created_at`) are just for ordering - they don't need to be exact
- Migration tracking uses the filename (hash) to identify migrations, not the timestamp
