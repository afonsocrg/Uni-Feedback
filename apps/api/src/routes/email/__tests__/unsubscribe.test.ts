import { beforeEach, describe, expect, it } from 'vitest'
import { cleanAllTables, withTestDb } from '../../../../test/setup'
import {
  createEmailPreferences,
  createUser,
  getEmailPreferencesByToken
} from '../../../../test/helpers'
import { Unsubscribe } from '../unsubscribe'

describe('Unsubscribe Route', () => {
  let unsubscribeHandler: Unsubscribe

  beforeEach(async () => {
    await cleanAllTables()
    // @ts-expect-error - OpenAPIRoute constructor params not needed for testing
    unsubscribeHandler = new Unsubscribe()
  })

  /**
   * Helper to create a mock request with body
   */
  function createMockRequest(body: object): Request {
    return new Request('http://localhost/email/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  describe('POST /email/unsubscribe', () => {
    it('should unsubscribe user with valid token', async () => {
      await withTestDb(async () => {
        const user = await createUser()
        const prefs = await createEmailPreferences(user.id, {
          subscribedReminders: true
        })

        // Mock the getValidatedData method
        // @ts-expect-error - mocking protected method for testing
        unsubscribeHandler.getValidatedData = async () => ({
          query: { token: prefs.unsubscribeToken }
        })

        const request = createMockRequest({ token: prefs.unsubscribeToken })
        const response = await unsubscribeHandler.handle(request, {} as Env, {})

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toContain('successfully unsubscribed')

        // Verify database was updated
        const updatedPrefs = await getEmailPreferencesByToken(
          prefs.unsubscribeToken
        )
        expect(updatedPrefs.subscribedReminders).toBe(false)
        expect(updatedPrefs.unsubscribedAt).not.toBeNull()
      })
    })

    it('should return 404 for invalid token', async () => {
      await withTestDb(async () => {
        // @ts-expect-error - mocking protected method for testing
        unsubscribeHandler.getValidatedData = async () => ({
          query: { token: 'invalid-token-that-does-not-exist' }
        })

        const request = createMockRequest({
          token: 'invalid-token-that-does-not-exist'
        })
        const response = await unsubscribeHandler.handle(request, {} as Env, {})

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.error).toContain('Invalid unsubscribe token')
      })
    })

    it('should return success message if already unsubscribed', async () => {
      await withTestDb(async () => {
        const user = await createUser()
        const prefs = await createEmailPreferences(user.id, {
          subscribedReminders: false,
          unsubscribedAt: new Date()
        })

        // @ts-expect-error - mocking protected method for testing
        unsubscribeHandler.getValidatedData = async () => ({
          query: { token: prefs.unsubscribeToken }
        })

        const request = createMockRequest({ token: prefs.unsubscribeToken })
        const response = await unsubscribeHandler.handle(request, {} as Env, {})

        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.message).toContain('already unsubscribed')
      })
    })

    it('should handle multiple unsubscribe attempts idempotently', async () => {
      await withTestDb(async () => {
        const user = await createUser()
        const prefs = await createEmailPreferences(user.id, {
          subscribedReminders: true
        })

        // @ts-expect-error - mocking protected method for testing
        unsubscribeHandler.getValidatedData = async () => ({
          query: { token: prefs.unsubscribeToken }
        })

        const request = createMockRequest({ token: prefs.unsubscribeToken })

        // First unsubscribe
        const response1 = await unsubscribeHandler.handle(request, {} as Env, {})
        expect(response1.status).toBe(200)

        // Second unsubscribe (should still succeed)
        const response2 = await unsubscribeHandler.handle(request, {} as Env, {})
        expect(response2.status).toBe(200)
        const data = await response2.json()
        expect(data.message).toContain('already unsubscribed')
      })
    })
  })
})
