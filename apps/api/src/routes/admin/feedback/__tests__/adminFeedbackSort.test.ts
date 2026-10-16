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
 * `sort_by` / `sort_dir` on the admin feedback list. Routed through the real
 * app so the query validation (the sort allow-list) is exercised too.
 */
describe('GET /admin/feedback sorting', () => {
  beforeEach(async () => {
    await cleanAllTables()
  })

  async function seed() {
    const faculty = await createFaculty()
    const degree = await createDegree(faculty.id)
    const course = await createCourse(degree.id)
    // Inserted oldest to newest, so the default order returns them reversed.
    const low = await createApprovedFeedback(course.id, {
      rating: 2,
      workloadRating: 5,
      schoolYear: 2022
    })
    const high = await createApprovedFeedback(course.id, {
      rating: 5,
      workloadRating: 1,
      schoolYear: 2024
    })
    const blank = await createApprovedFeedback(course.id, {
      rating: 3,
      workloadRating: null,
      schoolYear: null
    })
    const { cookie } = await createAuthenticatedUser('admin')
    return { low, high, blank, cookie }
  }

  async function ids(path: string, cookie: string) {
    const res = await app.request(
      path,
      { headers: { Cookie: cookie } },
      testEnv
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    return body.data.map((f: { id: number }) => f.id)
  }

  it('defaults to newest first', async () => {
    await withTestDb(async () => {
      const { low, high, blank, cookie } = await seed()
      expect(await ids('/admin/feedback', cookie)).toEqual([
        blank.id,
        high.id,
        low.id
      ])
    })
  })

  it('sorts by rating in both directions', async () => {
    await withTestDb(async () => {
      const { low, high, blank, cookie } = await seed()
      expect(await ids('/admin/feedback?sort_by=rating', cookie)).toEqual([
        high.id,
        blank.id,
        low.id
      ])
      expect(
        await ids('/admin/feedback?sort_by=rating&sort_dir=asc', cookie)
      ).toEqual([low.id, blank.id, high.id])
    })
  })

  it('keeps rows without a value at the bottom whichever way it sorts', async () => {
    await withTestDb(async () => {
      const { low, high, blank, cookie } = await seed()
      expect(
        await ids('/admin/feedback?sort_by=workload_rating', cookie)
      ).toEqual([low.id, high.id, blank.id])
      expect(
        await ids(
          '/admin/feedback?sort_by=workload_rating&sort_dir=asc',
          cookie
        )
      ).toEqual([high.id, low.id, blank.id])
      expect(
        await ids('/admin/feedback?sort_by=school_year&sort_dir=asc', cookie)
      ).toEqual([low.id, high.id, blank.id])
    })
  })

  it('rejects a column outside the allow-list', async () => {
    await withTestDb(async () => {
      const { cookie } = await seed()
      const res = await app.request(
        '/admin/feedback?sort_by=comment',
        { headers: { Cookie: cookie } },
        testEnv
      )
      expect(res.status).toBe(400)
    })
  })
})
