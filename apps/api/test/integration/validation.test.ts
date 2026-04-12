import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/routes/router'
import { createAuthenticatedUser } from '../helpers'
import { cleanAllTables, testEnv, withTestDb } from '../setup'

beforeEach(async () => {
  await cleanAllTables()
})

// ---------------------------------------------------------------------------
// POST /courses/:id/feedback — FeedbackRequestSchema (strict)
// Auth runs first, so all tests need an authenticated user.
// ---------------------------------------------------------------------------

describe('POST /courses/:id/feedback — body validation', () => {
  const VALID_BODY = {
    rating: 3,
    workloadRating: 3,
    schoolYear: 2024
  }

  async function post(body: object) {
    return withTestDb(async () => {
      const { cookie } = await createAuthenticatedUser('student')
      return app.request(
        '/courses/1/feedback',
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json', Cookie: cookie }
        },
        testEnv
      )
    })
  }

  it('missing required field rating → 400', async () => {
    const { rating: _r, ...noRating } = VALID_BODY
    const res = await post(noRating)
    expect(res.status).toBe(400)
  })

  it('missing required field workloadRating → 400', async () => {
    const { workloadRating: _w, ...noWorkload } = VALID_BODY
    const res = await post(noWorkload)
    expect(res.status).toBe(400)
  })

  it('rating below min (0) → 400', async () => {
    const res = await post({ ...VALID_BODY, rating: 0 })
    expect(res.status).toBe(400)
  })

  it('rating above max (6) → 400', async () => {
    const res = await post({ ...VALID_BODY, rating: 6 })
    expect(res.status).toBe(400)
  })

  it('workloadRating above max (6) → 400', async () => {
    const res = await post({ ...VALID_BODY, workloadRating: 6 })
    expect(res.status).toBe(400)
  })

  it('extra unknown field (strict schema) → 400', async () => {
    const res = await post({ ...VALID_BODY, unexpectedField: 'oops' })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// PUT /feedback/:id — EditFeedbackRequestSchema (strict)
// ---------------------------------------------------------------------------

describe('PUT /feedback/:id — body validation', () => {
  const VALID_BODY = {
    rating: 3,
    workloadRating: 3
  }

  async function put(body: object) {
    return withTestDb(async () => {
      const { cookie } = await createAuthenticatedUser('student')
      return app.request(
        '/feedback/1',
        {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json', Cookie: cookie }
        },
        testEnv
      )
    })
  }

  it('rating below min (0) → 400', async () => {
    const res = await put({ ...VALID_BODY, rating: 0 })
    expect(res.status).toBe(400)
  })

  it('schoolYear below min (1999) → 400', async () => {
    const res = await put({ ...VALID_BODY, schoolYear: 1999 })
    expect(res.status).toBe(400)
  })

  it('schoolYear above max (2101) → 400', async () => {
    const res = await put({ ...VALID_BODY, schoolYear: 2101 })
    expect(res.status).toBe(400)
  })

  it('extra unknown field (strict schema) → 400', async () => {
    const res = await put({ ...VALID_BODY, unexpectedField: 'oops' })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// GET /courses/search — query param validation (public, no auth needed)
// ---------------------------------------------------------------------------

describe('GET /courses/search — query param validation', () => {
  it('no search params → 400', async () => {
    await withTestDb(async () => {
      const res = await app.request(
        '/courses/search',
        { method: 'GET' },
        testEnv
      )
      expect(res.status).toBe(400)
    })
  })

  it('limit=0 (below min 1) → 400', async () => {
    await withTestDb(async () => {
      const res = await app.request(
        '/courses/search?faculty_id=1&limit=0',
        { method: 'GET' },
        testEnv
      )
      expect(res.status).toBe(400)
    })
  })

  it('limit=51 (above max 50) → 400', async () => {
    await withTestDb(async () => {
      const res = await app.request(
        '/courses/search?faculty_id=1&limit=51',
        { method: 'GET' },
        testEnv
      )
      expect(res.status).toBe(400)
    })
  })
})
