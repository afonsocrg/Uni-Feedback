import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEmailPreferences,
  createUser,
  getEmailPreferences
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { EmailService } from '../emailService'

// Mock env for testing
const mockEnv: Env = {
  NODE_ENV: 'development',
  DATABASE_URL: 'test',
  API_URL: 'https://api.test.uni-feedback.com',
  WEBSITE_URL: 'https://test.uni-feedback.com',
  RESEND_API_KEY: undefined, // No API key = mock mode
  API_PORT: 3001,
  DASHBOARD_URL: 'https://dashboard.test.com',
  ALLOWED_ORIGINS: '',
  POSTHOG_API_KEY: undefined,
  TELEGRAM_BOT_TOKEN: undefined,
  TELEGRAM_CHAT_ID: undefined,
  R2_ACCOUNT_ID: '',
  R2_ACCESS_KEY_ID: '',
  R2_SECRET_ACCESS_KEY: '',
  R2_BUCKET_NAME: '',
  OPENROUTER_API_KEY: undefined,
  VALIDATE_EMAIL_SUFFIX: false,
  REQUIRE_FEEDBACK_AUTH: true
}

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(async () => {
    await cleanAllTables()
    emailService = new EmailService(mockEnv)
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('getOrCreateEmailPreferences', () => {
    it('should create email preferences if not exists', async () => {
      await withTestDb(async () => {
        const user = await createUser()

        // No preferences exist yet
        const prefsBefore = await getEmailPreferences(user.id)
        expect(prefsBefore).toBeUndefined()

        // Call the method
        const token = await emailService.getOrCreateEmailPreferences(user.id)

        // Preferences should now exist
        const prefsAfter = await getEmailPreferences(user.id)
        expect(prefsAfter).toBeDefined()
        expect(prefsAfter.unsubscribeToken).toBe(token)
        expect(prefsAfter.subscribedReminders).toBe(true)
      })
    })

    it('should return existing token if preferences exist', async () => {
      await withTestDb(async () => {
        const user = await createUser()
        const existingPrefs = await createEmailPreferences(user.id)

        // Call the method
        const token = await emailService.getOrCreateEmailPreferences(user.id)

        // Should return existing token
        expect(token).toBe(existingPrefs.unsubscribeToken)

        // Should not create duplicate
        const prefsAfter = await getEmailPreferences(user.id)
        expect(prefsAfter.id).toBe(existingPrefs.id)
      })
    })
  })

  describe('sendCampaignEmails', () => {
    it('should skip unsubscribed users', async () => {
      await withTestDb(async () => {
        // Create users
        const subscribedUser = await createUser({
          email: 'subscribed@test.com'
        })
        const unsubscribedUser = await createUser({
          email: 'unsubscribed@test.com'
        })

        // Create preferences - one subscribed, one unsubscribed
        await createEmailPreferences(subscribedUser.id, {
          subscribedReminders: true
        })
        await createEmailPreferences(unsubscribedUser.id, {
          subscribedReminders: false
        })

        // Send campaign
        const result = await emailService.sendCampaignEmails(
          [subscribedUser.id, unsubscribedUser.id],
          {
            subject: 'Test Campaign',
            text: 'Test content'
          }
        )

        // Check results
        expect(result.sent).toBe(1)
        expect(result.skipped).toBe(1)
        expect(result.failed).toBe(0)
      })
    })

    it('should create email preferences for users without them', async () => {
      await withTestDb(async () => {
        const user = await createUser()

        // No preferences exist
        const prefsBefore = await getEmailPreferences(user.id)
        expect(prefsBefore).toBeUndefined()

        // Send campaign
        await emailService.sendCampaignEmails([user.id], {
          subject: 'Test Campaign',
          text: 'Test content'
        })

        // Preferences should now exist
        const prefsAfter = await getEmailPreferences(user.id)
        expect(prefsAfter).toBeDefined()
        expect(prefsAfter.subscribedReminders).toBe(true)
      })
    })

    it('should return correct counts for mixed user states', async () => {
      await withTestDb(async () => {
        // Create 3 users with different states
        const user1 = await createUser({ email: 'user1@test.com' })
        const user2 = await createUser({ email: 'user2@test.com' })
        const user3 = await createUser({ email: 'user3@test.com' })

        // user1: no preferences (will be created)
        // user2: subscribed
        await createEmailPreferences(user2.id, { subscribedReminders: true })
        // user3: unsubscribed
        await createEmailPreferences(user3.id, { subscribedReminders: false })

        // Send campaign
        const result = await emailService.sendCampaignEmails(
          [user1.id, user2.id, user3.id],
          {
            subject: 'Test Campaign',
            text: 'Test content'
          },
          { delayMs: 0 } // No delay for tests
        )

        // user1 and user2 should receive email, user3 skipped
        expect(result.sent).toBe(2)
        expect(result.skipped).toBe(1)
        expect(result.failed).toBe(0)
      })
    })

    it('should handle empty user list', async () => {
      await withTestDb(async () => {
        const result = await emailService.sendCampaignEmails([], {
          subject: 'Test Campaign',
          text: 'Test content'
        })

        expect(result.sent).toBe(0)
        expect(result.skipped).toBe(0)
        expect(result.failed).toBe(0)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should handle non-existent user IDs gracefully', async () => {
      await withTestDb(async () => {
        // Pass non-existent user IDs
        const result = await emailService.sendCampaignEmails([99999, 99998], {
          subject: 'Test Campaign',
          text: 'Test content'
        })

        // No users found, nothing sent
        expect(result.sent).toBe(0)
        expect(result.skipped).toBe(0)
        expect(result.failed).toBe(0)
      })
    })
  })
})
