import { beforeEach, describe, expect, test } from 'vitest'
import { app } from '../../src/routes/router'
import { createAuthenticatedUser } from '../helpers'
import { cleanAllTables, testEnv, withTestDb } from '../setup'

beforeEach(async () => {
  await cleanAllTables()
})

// ---------------------------------------------------------------------------
// Unauthenticated → 401
// ---------------------------------------------------------------------------

describe('Unauthenticated access → 401', () => {
  const AUTH_REQUIRED_ROUTES: [string, string][] = [
    ['GET', '/profile'],
    ['DELETE', '/profile'],
    ['GET', '/profile/stats'],
    ['GET', '/profile/feedback'],
    ['GET', '/profile/feedback-recommendations'],
    ['GET', '/feedback/1/edit'],
    ['PUT', '/feedback/1'],
    ['DELETE', '/feedback/1'],
    ['POST', '/feedback/1/helpful'],
    ['DELETE', '/feedback/1/helpful'],
    ['POST', '/feedback/1/report'],
    ['POST', '/courses/1/feedback'],
    ['GET', '/admin/courses'],
    ['GET', '/admin/feedback'],
    ['GET', '/admin/users'],
    ['GET', '/admin/degrees']
  ]

  test.each(AUTH_REQUIRED_ROUTES)('%s %s', async (method, path) => {
    await withTestDb(async () => {
      const res = await app.request(path, { method }, testEnv)
      expect(res.status).toBe(401)
    })
  })
})

// ---------------------------------------------------------------------------
// Student on admin routes → 403
// ---------------------------------------------------------------------------

describe('Student user on admin routes → 403', () => {
  const ADMIN_ONLY_ROUTES: [string, string][] = [
    ['GET', '/admin/courses'],
    ['GET', '/admin/feedback'],
    ['GET', '/admin/users'],
    ['GET', '/admin/degrees']
  ]

  test.each(ADMIN_ONLY_ROUTES)('%s %s', async (method, path) => {
    await withTestDb(async () => {
      const { cookie } = await createAuthenticatedUser('student')
      const res = await app.request(
        path,
        { method, headers: { Cookie: cookie } },
        testEnv
      )
      expect(res.status).toBe(403)
    })
  })
})

// ---------------------------------------------------------------------------
// Public routes → not blocked (no 401/403)
// ---------------------------------------------------------------------------

describe('Public routes → accessible without auth', () => {
  const PUBLIC_ROUTES: [string, string][] = [
    ['GET', '/health'],
    ['GET', '/faculties'],
    // Bare /courses/search → 400 (requires at least one filter param)
    // Use faculty_id=999 to pass validation; non-existent ID returns empty results
    ['GET', '/courses/search?faculty_id=999']
  ]

  test.each(PUBLIC_ROUTES)('%s %s', async (method, path) => {
    await withTestDb(async () => {
      const res = await app.request(path, { method }, testEnv)
      expect(res.status).not.toBe(401)
      expect(res.status).not.toBe(403)
    })
  })
})
