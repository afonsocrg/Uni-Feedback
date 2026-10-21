import { StatsService } from '@services'
import {
  getCurrentSchoolYear,
  getLatestReviewableSchoolYear
} from '@uni-feedback/utils'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createAuthenticatedUser,
  createCourse,
  createDegree,
  createFaculty,
  getDegreeStats
} from '../../../../test/helpers'
import { cleanAllTables, testEnv, withTestDb } from '../../../../test/setup'
import { app } from '../../router'

/**
 * Courses no longer taught (`courses.last_taught_year`, migration 0045): they
 * can be reviewed for the years they ran and no later, search still finds them
 * after the courses still taught, and they stop counting as part of the degree.
 */
describe('Discontinued courses', () => {
  const current = getCurrentSchoolYear()
  const lastTaught = current - 1

  beforeEach(async () => {
    await cleanAllTables()
  })

  async function seed() {
    const faculty = await createFaculty()
    const degree = await createDegree(faculty.id)
    const taught = await createCourse(degree.id, {
      name: 'Agentes Novos',
      acronym: 'AN'
    })
    const retired = await createCourse(degree.id, {
      name: 'Agentes Antigos',
      acronym: 'AA',
      lastTaughtYear: lastTaught
    })
    const { user, cookie } = await createAuthenticatedUser()
    return { faculty, degree, taught, retired, user, cookie }
  }

  function submit(courseId: number, cookie: string, schoolYear: number) {
    return app.request(
      `/courses/${courseId}/feedback`,
      {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolYear, rating: 4, workloadRating: 3 })
      },
      testEnv
    )
  }

  describe('getLatestReviewableSchoolYear', () => {
    it('is the current year for a course still taught', () => {
      expect(getLatestReviewableSchoolYear(null, 2026)).toBe(2026)
      expect(getLatestReviewableSchoolYear(undefined, 2026)).toBe(2026)
    })

    it('is the last year taught for a discontinued course', () => {
      expect(getLatestReviewableSchoolYear(2025, 2026)).toBe(2025)
    })

    it('never goes past the current year', () => {
      expect(getLatestReviewableSchoolYear(2030, 2026)).toBe(2026)
    })
  })

  describe('POST /courses/:id/feedback', () => {
    it('refuses a school year after the last one taught', async () => {
      await withTestDb(async () => {
        const { retired, cookie } = await seed()
        const res = await submit(retired.id, cookie, current)
        expect(res.status).toBe(400)
        expect(JSON.stringify(await res.json())).toContain('last taught in')
      })
    })

    it('accepts the last school year taught', async () => {
      await withTestDb(async () => {
        const { retired, cookie } = await seed()
        const res = await submit(retired.id, cookie, lastTaught)
        expect(res.status).toBe(201)
      })
    })

    it('accepts the current year on a course still taught', async () => {
      await withTestDb(async () => {
        const { taught, cookie } = await seed()
        const res = await submit(taught.id, cookie, current)
        expect(res.status).toBe(201)
      })
    })
  })

  describe('PUT /feedback/:id', () => {
    function edit(feedbackId: number, cookie: string, schoolYear: number) {
      return app.request(
        `/feedback/${feedbackId}`,
        {
          method: 'PUT',
          headers: { Cookie: cookie, 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolYear, rating: 5, workloadRating: 3 })
        },
        testEnv
      )
    }

    it('refuses moving a review past the last year taught', async () => {
      await withTestDb(async () => {
        const { retired, user, cookie } = await seed()
        const feedback = await createApprovedFeedback(retired.id, {
          userId: user.id,
          schoolYear: lastTaught
        })
        const res = await edit(feedback.id, cookie, current)
        expect(res.status).toBe(400)
      })
    })

    it('still edits a review stored for a later year, if the year stays', async () => {
      await withTestDb(async () => {
        const { retired, user, cookie } = await seed()
        // Submitted before the course was marked as no longer taught
        const feedback = await createApprovedFeedback(retired.id, {
          userId: user.id,
          schoolYear: current
        })
        const res = await edit(feedback.id, cookie, current)
        expect(res.status).toBe(200)
      })
    })
  })

  describe('GET /courses/search', () => {
    it('finds discontinued courses, after the ones still taught', async () => {
      await withTestDb(async () => {
        const { taught, retired } = await seed()
        const res = await app.request('/courses/search?q=agentes', {}, testEnv)
        expect(res.status).toBe(200)
        const body = await res.json()
        // Alphabetically "Antigos" would come first
        expect(body.courses.map((c: { id: number }) => c.id)).toEqual([
          taught.id,
          retired.id
        ])
        expect(body.courses[1].lastTaughtYear).toBe(lastTaught)
        expect(body.courses[0].lastTaughtYear).toBeNull()
      })
    })
  })

  describe('degree_stats.course_count', () => {
    it('counts only the courses still taught', async () => {
      await withTestDb(async () => {
        const { degree } = await seed()
        await new StatsService().refreshAllStats()
        const stats = await getDegreeStats(degree.id)
        expect(stats.courseCount).toBe(1)
      })
    })
  })
})
