/**
 * Send campaign emails to a list of users.
 *
 * Usage:
 *   pnpm tsx src/scripts/sendCampaign.ts <email-file> --users=1,2,3 [--send|--export]
 *
 * Arguments:
 *   <email-file>       Path to text file with email content
 *                      - First line: email subject
 *                      - Rest: email body (plain text)
 *
 *   --users=1,2,3      Comma-separated list of user IDs
 *   --send             Actually send emails via Resend (dry-run by default)
 *   --export=file.csv  Export to CSV for Google Sheets (use with Apps Script)
 *   --from=addr        Override sender (default: Uni Feedback <afonso@uni-feedback.com>)
 *
 * Environment:
 *   Loads from src/scripts/.env if it exists, then falls back to api/.env
 *   Required vars: DATABASE_URL, API_URL, WEBSITE_URL, RESEND_API_KEY (for --send)
 *
 * Setup for production:
 *   1. Create src/scripts/.env with production DATABASE_URL (via SSH tunnel)
 *   2. Set up SSH tunnel: ssh -L 5433:localhost:5432 user@server
 *   3. Run script (dry-run first, then with --send or --export)
 *
 * Example:
 *   pnpm tsx src/scripts/sendCampaign.ts ./campaign.txt --users=1,2,3
 *   pnpm tsx src/scripts/sendCampaign.ts ./campaign.txt --users=1,2,3 --send
 *   pnpm tsx src/scripts/sendCampaign.ts ./campaign.txt --users=1,2,3 --export=campaign.csv
 *
 * Example email file (campaign.txt):
 *   Share your course experiences!
 *
 *   Hey there!
 *
 *   Hope your semester is going well!
 *   Your fellow students would love to hear about your experiences!
 *
 *   Cheers,
 *   Afonso
 */

import { config } from 'dotenv'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env from scripts directory if it exists, otherwise fall back to api/.env
const scriptsEnvPath = resolve(__dirname, '.env')
if (existsSync(scriptsEnvPath)) {
  config({ path: scriptsEnvPath })
  console.log('📁 Loaded environment from src/scripts/.env\n')
} else {
  config()
}

import { DatabaseContext } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { emailPreferences, users } from '@uni-feedback/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'
import postgres from 'postgres'
import {
  EmailService,
  textToHtml,
  wrapHtmlEmail
} from '../services/emailService'

// Parse command line arguments
const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    users: { type: 'string', short: 'u' },
    send: { type: 'boolean', default: false },
    export: { type: 'string', short: 'e' },
    from: { type: 'string', short: 'f' },
    plain: { type: 'boolean', default: false, short: 'p' }
  }
})

// Default sender
const DEFAULT_FROM = 'Uni Feedback <afonso@uni-feedback.com>'

function printUsage() {
  console.log(`
Send campaign emails to a list of users.

Usage:
  pnpm tsx src/scripts/sendCampaign.ts <email-file> --users=1,2,3 [--send|--export=file.csv]

Arguments:
  <email-file>         Path to text file with email content
                       - First line: email subject
                       - Rest: email body (plain text)

  --users, -u=1,2,3    Comma-separated list of user IDs
  --send               Actually send emails via Resend (dry-run by default)
  --export, -e=file    Export to CSV for Google Sheets (use with Apps Script)
  --from, -f=addr      Sender address (default: Uni Feedback <afonso@uni-feedback.com>)
  --plain, -p          High-deliverability mode: plain text only, no HTML, no
                       List-Unsubscribe headers. Bypasses university [MARKETING]
                       tags and link detonation. Include manual opt-out in body.

Environment:
  Loads from src/scripts/.env if it exists, then falls back to api/.env
  Required: DATABASE_URL, API_URL, WEBSITE_URL, RESEND_API_KEY (for --send)

Examples:
  pnpm tsx src/scripts/sendCampaign.ts ./campaign.txt --users=1,42,103
  pnpm tsx src/scripts/sendCampaign.ts ./campaign.txt --users=1,42,103 --send
  pnpm tsx src/scripts/sendCampaign.ts ./campaign.txt --users=1,42,103 --send --plain
  pnpm tsx src/scripts/sendCampaign.ts ./campaign.txt --users=1,42,103 --export=emails.csv
`)
}

// Validate positional argument (email file)
const emailFile = positionals[0]
if (!emailFile) {
  console.error('❌ Missing email file\n')
  printUsage()
  process.exit(1)
}

// Validate --users argument
if (!args.users) {
  console.error('❌ Missing --users argument\n')
  printUsage()
  process.exit(1)
}

// Parse user IDs from comma-separated string
let userIds: number[]
try {
  userIds = args.users.split(',').map((id) => {
    const parsed = parseInt(id.trim(), 10)
    if (isNaN(parsed)) {
      throw new Error(`Invalid user ID: ${id}`)
    }
    return parsed
  })
  if (userIds.length === 0) {
    throw new Error('No user IDs provided')
  }
} catch (error) {
  console.error(`❌ Invalid --users format: ${args.users}`)
  console.error('   Expected comma-separated numbers, e.g., --users=1,2,3')
  process.exit(1)
}

// Read and parse email content
let subject: string
let body: string
try {
  const emailContent = readFileSync(emailFile, 'utf-8')
  const lines = emailContent.split('\n')
  subject = lines[0].trim()
  body = lines.slice(1).join('\n').trim()

  if (!subject) {
    throw new Error('First line (subject) is empty')
  }
  if (!body) {
    throw new Error('Email body is empty (content after first line)')
  }
} catch (error) {
  console.error(`❌ Failed to read email file: ${emailFile}`)
  if (error instanceof Error) {
    console.error(`   ${error.message}`)
  }
  process.exit(1)
}

// Validate required environment variables
const requiredVars = ['DATABASE_URL', 'API_URL', 'WEBSITE_URL'] as const

function validateEnv(): Env {
  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missingVars.join(', ')}`
    )
    console.error('   Set them in src/scripts/.env or as environment variables')
    process.exit(1)
  }

  if (args.send && !process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is required when using --send')
    process.exit(1)
  }

  return {
    NODE_ENV:
      process.env.NODE_ENV === 'production' ? 'production' : 'development',
    DATABASE_URL: process.env.DATABASE_URL!,
    API_URL: process.env.API_URL!,
    WEBSITE_URL: process.env.WEBSITE_URL!,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    API_PORT: parseInt(process.env.API_PORT || '3001'),
    DASHBOARD_URL: process.env.DASHBOARD_URL || '',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    VALIDATE_EMAIL_SUFFIX: process.env.VALIDATE_EMAIL_SUFFIX === 'true',
    REQUIRE_FEEDBACK_AUTH: process.env.REQUIRE_FEEDBACK_AUTH !== 'false'
  }
}

// Helper to escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Types for the campaign context
type DB = ReturnType<typeof drizzle<typeof schema>>
interface User {
  id: number
  email: string
}

interface CampaignContext {
  env: Env
  db: DB
  fromEmail: string
  subject: string
  body: string
  userIds: number[]
  existingUsers: User[]
}

/**
 * Export mode - generate CSV for Google Sheets
 */
async function runExportMode(ctx: CampaignContext, exportPath: string) {
  const { env, db, fromEmail, subject, body, existingUsers } = ctx
  const rows = [['from', 'to', 'subject', 'body', 'status'].join(',')]

  console.log('📝 Fetching unsubscribe tokens...')

  let exported = 0
  let skipped = 0

  for (const user of existingUsers) {
    // Get or create email preferences for this user
    let token: string
    let isSubscribed = true

    const [existingPrefs] = await db
      .select({
        unsubscribeToken: emailPreferences.unsubscribeToken,
        subscribedReminders: emailPreferences.subscribedReminders
      })
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, user.id))
      .limit(1)

    if (existingPrefs) {
      token = existingPrefs.unsubscribeToken
      isSubscribed = existingPrefs.subscribedReminders
    } else {
      // Create new preferences with token
      token = randomBytes(32).toString('hex')
      await db.insert(emailPreferences).values({
        userId: user.id,
        unsubscribeToken: token,
        subscribedReminders: true
      })
    }

    // Skip unsubscribed users
    if (!isSubscribed) {
      console.log(`   ⏭️  Skipping ${user.email} (unsubscribed)`)
      skipped++
      continue
    }

    const unsubscribeLink = `${env.WEBSITE_URL}/unsubscribe?token=${token}`
    const bodyWithUnsubscribe = `${body}

---
Don't want to receive these emails? Unsubscribe here: ${unsubscribeLink}`

    rows.push(
      [
        escapeCSV(fromEmail),
        escapeCSV(user.email),
        escapeCSV(subject),
        escapeCSV(bodyWithUnsubscribe),
        '' // status column for tracking
      ].join(',')
    )
    exported++
  }

  const csvContent = rows.join('\n')
  writeFileSync(exportPath, csvContent, 'utf-8')

  console.log(`\n✅ Exported ${exported} emails to ${exportPath}`)
  if (skipped > 0) {
    console.log(`⏭️  Skipped ${skipped} unsubscribed users`)
  }
  console.log('\nNext steps:')
  console.log('1. Import CSV into Google Sheets')
  console.log('2. Open Extensions > Apps Script')
  console.log('3. Paste the sendCampaignEmails script')
  console.log('4. Run the script to send emails via Gmail')
}

/**
 * Dry run mode - show HTML body and user lists without sending
 */
async function runDryRunMode(ctx: CampaignContext) {
  const { db, body, userIds } = ctx

  // Fetch subscription status for all users
  const usersWithPrefs = await db
    .select({
      id: users.id,
      email: users.email,
      subscribedReminders: emailPreferences.subscribedReminders
    })
    .from(users)
    .leftJoin(emailPreferences, eq(users.id, emailPreferences.userId))
    .where(inArray(users.id, userIds))

  const subscribedUsers = usersWithPrefs.filter(
    (u) => u.subscribedReminders !== false
  )
  const unsubscribedUsers = usersWithPrefs.filter(
    (u) => u.subscribedReminders === false
  )

  // Generate and show HTML body (wrapped using same logic as emailService)
  const htmlBody = textToHtml(body)
  const htmlPreview = wrapHtmlEmail(htmlBody)
  console.log(
    '📄 HTML Body (preview - unsubscribe footer added by emailService):'
  )
  console.log('─'.repeat(60))
  console.log(htmlPreview)
  console.log('─'.repeat(60))
  console.log('')

  // Show subscribed users (will receive email)
  console.log(`📬 Will send to (${subscribedUsers.length} users):`)
  for (const user of subscribedUsers) {
    console.log(`   ✉️  ${user.email} (ID: ${user.id})`)
  }

  // Show unsubscribed users
  if (unsubscribedUsers.length > 0) {
    console.log(`\n⏭️  Unsubscribed (${unsubscribedUsers.length} users):`)
    for (const user of unsubscribedUsers) {
      console.log(`   🚫 ${user.email} (ID: ${user.id})`)
    }
  }

  console.log('\n✅ Dry run complete.')
  console.log('   Add --send to send via Resend')
  console.log('   Add --export=file.csv to export for Google Sheets')
}

/**
 * Send mode - actually send emails via Resend
 */
async function runSendMode(ctx: CampaignContext, plainTextOnly: boolean) {
  const { env, fromEmail, subject, body, existingUsers } = ctx

  const emailService = new EmailService(env)

  if (plainTextOnly) {
    console.log('📤 Sending emails (plain text only mode)...\n')
  } else {
    console.log('📤 Sending emails...\n')
  }

  // Generate HTML from plain text (only used in standard mode)
  const htmlBody = plainTextOnly ? undefined : textToHtml(body)

  const result = await emailService.sendCampaignEmails(
    existingUsers.map((u) => u.id),
    {
      subject,
      html: htmlBody,
      text: body
    },
    { from: fromEmail, delayMs: 100, plainTextOnly }
  )

  console.log('\n📊 Results:')
  console.log(`   ✅ Sent: ${result.sent}`)
  console.log(`   ⏭️ Skipped (unsubscribed): ${result.skipped}`)
  console.log(`   ❌ Failed: ${result.failed}`)

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    for (const err of result.errors) {
      console.log(`   ${err.email}: ${err.error}`)
    }
  }
}

async function main() {
  const env = validateEnv()
  const isExport = !!args.export
  const isSend = args.send
  const isDryRun = !isSend && !isExport

  console.log('📧 Campaign Email Script')
  console.log('========================\n')

  if (isExport) {
    console.log(`📤 EXPORT MODE - Will export to ${args.export}\n`)
  } else if (isSend) {
    if (args.plain) {
      console.log('🚀 SEND MODE (plain text) - High-deliverability mode enabled')
      console.log('   No HTML, no List-Unsubscribe headers, no auto-footer\n')
    } else {
      console.log('🚀 SEND MODE - Emails will be sent via Resend!\n')
    }
  } else {
    console.log('🔍 DRY RUN MODE - No emails will be sent')
    console.log(
      '   Add --send to send via Resend, or --export=file.csv to export\n'
    )
  }

  const fromEmail = args.from || DEFAULT_FROM
  console.log(`📤 From: ${fromEmail}`)
  console.log(`📋 Subject: ${subject}`)
  console.log(`📝 Body preview (first 200 chars):`)
  console.log(
    `   ${body.slice(0, 200).replace(/\n/g, '\n   ')}${body.length > 200 ? '...' : ''}\n`
  )
  console.log(
    `👥 Target users: ${userIds.length} IDs (${userIds.join(', ')})\n`
  )

  // Initialize database connection
  const sql = postgres(env.DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10
  })
  const db = drizzle(sql, { schema })

  try {
    await DatabaseContext.run(db, async () => {
      // Verify users exist and get their emails
      const existingUsers = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds))

      const foundIds = new Set(existingUsers.map((u) => u.id))
      const missingIds = userIds.filter((id) => !foundIds.has(id))

      console.log(`✅ Found ${existingUsers.length} users in database`)
      if (missingIds.length > 0) {
        console.log(
          `⚠️  ${missingIds.length} user IDs not found: ${missingIds.join(', ')}`
        )
      }
      console.log('')

      const ctx: CampaignContext = {
        env,
        db,
        fromEmail,
        subject,
        body,
        userIds,
        existingUsers
      }

      if (isExport) {
        await runExportMode(ctx, args.export!)
      } else if (isDryRun) {
        await runDryRunMode(ctx)
      } else {
        await runSendMode(ctx, args.plain ?? false)
      }
    })
  } finally {
    await sql.end({ timeout: 5 })
    console.log('\n✅ Script completed')
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
