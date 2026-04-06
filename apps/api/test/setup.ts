import { DatabaseContext } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import fs from 'fs'
import path from 'path'
import postgres from 'postgres'
import { afterAll, beforeAll } from 'vitest'

// Load .env file
config()

/**
 * Test database URL.
 *
 * Set DATABASE_URL_TEST in your environment, or create a test database:
 *   1. Connect to postgres: psql -h localhost -p 5433 -U postgres
 *   2. Create database: CREATE DATABASE uni_feedback_test;
 *   3. Set env: export DATABASE_URL_TEST="postgres://postgres:your_password@localhost:5433/uni_feedback_test"
 */
const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST

if (!TEST_DATABASE_URL) {
  throw new Error(
    'DATABASE_URL_TEST environment variable is required.\n' +
      'Create a test database and set: export DATABASE_URL_TEST="postgres://user:pass@localhost:5433/uni_feedback_test"'
  )
}

let sql: ReturnType<typeof postgres>
let db: ReturnType<typeof drizzle<typeof schema>>

/**
 * Run all migrations in order
 */
async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../../../packages/db/drizzle')

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of migrationFiles) {
    const migrationSql = fs.readFileSync(
      path.join(migrationsDir, file),
      'utf-8'
    )
    await sql.unsafe(migrationSql)
  }
}

/**
 * Reset the database by dropping all tables and recreating them
 */
async function resetDatabase() {
  // Drop all tables in public schema
  await sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `

  // Drop all custom types
  await sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END $$;
  `

  // Run all migrations
  await runMigrations()
}

beforeAll(async () => {
  // Create postgres connection
  sql = postgres(TEST_DATABASE_URL, { max: 1 })
  db = drizzle(sql, { schema })

  // Reset and set up database
  await resetDatabase()
})

afterAll(async () => {
  await sql.end()
})

/**
 * Get the database instance for tests
 */
export function getTestDb() {
  return db
}

/**
 * Run a function with the database context set up
 */
export async function withTestDb<T>(fn: () => Promise<T>): Promise<T> {
  return DatabaseContext.run(db, fn)
}

/**
 * Clean all data from tables (but keep the schema)
 */
export async function cleanAllTables() {
  // Disable foreign key checks temporarily
  await sql`SET session_replication_role = 'replica'`

  // Get all tables
  const tables = await sql<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `

  // Truncate all tables
  for (const { tablename } of tables) {
    if (tablename !== '__drizzle_migrations') {
      await sql.unsafe(`TRUNCATE TABLE "${tablename}" CASCADE`)
    }
  }

  // Re-enable foreign key checks
  await sql`SET session_replication_role = 'origin'`
}
