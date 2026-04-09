import { NotFoundError } from '@routes/utils/errorHandling'
import type { Context } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createEmailPreferences,
  createUser,
  getEmailPreferencesByToken
} from '../../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../../test/setup'
import { Unsubscribe } from '../unsubscribe'

describe('Unsubscribe Route', () => {
  let unsubscribeHandler: Unsubscribe

  beforeEach(async () => {
    await cleanAllTables()
    // @ts-expect-error - OpenAPIRoute constructor params not needed for testing
    unsubscribeHandler = new Unsubscribe()
  })

  /**
   * Helper to create a mock Context
   */
  function createMockContext(body: object): Context {
    const request = new Request('http://localhost/email/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    return {
      req: request,
      env: {} as Env,
      get: () => ({}),
      set: () => {},
      json: (data: unknown) => Response.json(data)
    } as unknown as Context
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

        const context = createMockContext({ token: prefs.unsubscribeToken })
        const response = await unsubscribeHandler.handle(context)

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

    it('should throw NotFoundError for invalid token', async () => {
      await withTestDb(async () => {
        // @ts-expect-error - mocking protected method for testing
        unsubscribeHandler.getValidatedData = async () => ({
          query: { token: 'invalid-token-that-does-not-exist' }
        })

        const context = createMockContext({
          token: 'invalid-token-that-does-not-exist'
        })

        // Expect the handler to throw NotFoundError
        await expect(unsubscribeHandler.handle(context)).rejects.toThrow(
          NotFoundError
        )
        await expect(unsubscribeHandler.handle(context)).rejects.toThrow(
          'Invalid unsubscribe token'
        )
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

        const context = createMockContext({ token: prefs.unsubscribeToken })
        const response = await unsubscribeHandler.handle(context)

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

        const context = createMockContext({ token: prefs.unsubscribeToken })

        // First unsubscribe
        const response1 = await unsubscribeHandler.handle(context)
        expect(response1.status).toBe(200)

        // Second unsubscribe (should still succeed)
        const response2 = await unsubscribeHandler.handle(context)
        expect(response2.status).toBe(200)
        const data = await response2.json()
        expect(data.message).toContain('already unsubscribed')
      })
    })
  })
})
