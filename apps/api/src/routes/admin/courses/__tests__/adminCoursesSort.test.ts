import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createAuthenticatedUser,
  createCourse,
  createDegree,
  createFaculty
} from '../../../../../test/helpers'
import { cleanAllTables, testEnv, withTestDb } from '../../../../../test/setup'
import { app } from '../../../../routes/router'

/**
 * `sort_by` / `sort_dir` on the admin courses list. Routed through the real
 * app so the query validation (the sort allow-list) is exercised too.
 */
describe('GET /admin/courses sorting', () => {
  beforeEach(async () => {
    await cleanAllTables()
  })

  async function seed() {
    const faculty = await createFaculty()
    const degree = await createDegree(faculty.id)
    const alpha = await createCourse(degree.id, { name: 'Alpha', acronym: 'A' })
    const beta = await createCourse(degree.id, { name: 'Beta', acronym: 'B' })
    const gamma = await createCourse(degree.id, { name: 'Gamma', acronym: 'G' })
    await createApprovedFeedback(gamma.id)
    await createApprovedFeedback(gamma.id)
    await createApprovedFeedback(alpha.id)
    const { cookie } = await createAuthenticatedUser('admin')
    return { alpha, beta, gamma, cookie }
  }

  async function ids(path: string, cookie: string) {
    const res = await app.request(
      path,
      { headers: { Cookie: cookie } },
      testEnv
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    return body.data.map((c: { id: number }) => c.id)
  }

  it('defaults to alphabetical', async () => {
    await withTestDb(async () => {
      const { alpha, beta, gamma, cookie } = await seed()
      expect(await ids('/admin/courses', cookie)).toEqual([
        alpha.id,
        beta.id,
        gamma.id
      ])
    })
  })

  it('sorts by feedback count in both directions', async () => {
    await withTestDb(async () => {
      const { alpha, beta, gamma, cookie } = await seed()
      expect(
        await ids('/admin/courses?sort_by=feedback_count', cookie)
      ).toEqual([gamma.id, alpha.id, beta.id])
      expect(
        await ids('/admin/courses?sort_by=feedback_count&sort_dir=asc', cookie)
      ).toEqual([beta.id, alpha.id, gamma.id])
    })
  })

  it('rejects a column outside the allow-list', async () => {
    await withTestDb(async () => {
      const { cookie } = await seed()
      const res = await app.request(
        '/admin/courses?sort_by=name',
        { headers: { Cookie: cookie } },
        testEnv
      )
      expect(res.status).toBe(400)
    })
  })
})
