#!/bin/bash

# This script sets up Drizzle migration tracking for an existing database
# Run this ONCE on any database that was created manually before migration tracking

set -e

echo "🔧 Setting up Drizzle migration tracking..."
echo ""
echo "This script will:"
echo "  1. Create the __drizzle_migrations table"
echo "  2. Mark all existing migrations (0000-0010) as applied"
echo "  3. Apply the new migration 0011 (magic link authentication)"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    echo "Please run with: dotenv -- ./scripts/setup_migration_tracking.sh"
    exit 1
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ ERROR: Could not parse DATABASE_URL"
    exit 1
fi

echo ""
echo "📊 Database: $DB_NAME at $DB_HOST:$DB_PORT"
echo ""

# Create migration tracking table
echo "1️⃣  Creating __drizzle_migrations table..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
EOF

# Check if migrations are already tracked
MIGRATION_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM __drizzle_migrations;")
MIGRATION_COUNT=$(echo $MIGRATION_COUNT | xargs) # trim whitespace

if [ "$MIGRATION_COUNT" != "0" ]; then
    echo "⚠️  Found $MIGRATION_COUNT existing migration(s) in tracking table"
    echo "   This database may already have migration tracking set up."
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Mark existing migrations as applied
echo "2️⃣  Marking migrations 0000-0010 as applied..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
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
  ('0010_add_type_column_to_student_clubs', 1728000009000)
ON CONFLICT DO NOTHING;
EOF

# Apply migration 0011
echo "3️⃣  Applying migration 0011 (magic link authentication)..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f drizzle/0011_add_magic_link_authentication.sql

# Mark migration 0011 as applied
echo "4️⃣  Marking migration 0011 as applied..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES
  ('0011_add_magic_link_authentication', extract(epoch from now())::bigint * 1000)
ON CONFLICT DO NOTHING;
EOF

echo ""
echo "✅ Migration tracking setup complete!"
echo ""
echo "📋 Summary:"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, hash FROM __drizzle_migrations ORDER BY id;"

echo ""
echo "🎉 Done! Your database now has proper migration tracking."
echo "   Future migrations can be run with: pnpm run migrate"
