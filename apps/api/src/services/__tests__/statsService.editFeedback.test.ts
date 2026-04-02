import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createCourse,
  createDegree,
  createFaculty,
  createIdenticalRelationship,
  getCourseStats,
  getDegreeStats,
  initCourseStats,
  initDegreeStats,
  updateFeedbackRatings
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { StatsService } from '../statsService'

/**
 * Test suite for editing feedback ratings.
 *
 * These tests verify that when a user edits their feedback ratings,
 * the course averages are correctly recalculated.
 */
describe('StatsService - Edit Feedback Ratings', () => {
  let statsService: StatsService

  beforeEach(async () => {
    await cleanAllTables()
    statsService = new StatsService()
  })

  describe('Single feedback edits', () => {
    it('should update average rating when feedback rating is changed', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create feedback with rating 3
        const feedback = await createApprovedFeedback(course.id, {
          rating: 3,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        // Verify initial state
        let stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(3)

        // Edit feedback to rating 5
        await updateFeedbackRatings(feedback.id, { rating: 5 })
        await statsService.onFeedbackEdited(course.id)

        // Verify new average
        stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(5)
        expect(stats.totalFeedbackCount).toBe(1) // Count unchanged
      })
    })

    it('should update average workload when workload rating is changed', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create feedback with workload 2
        const feedback = await createApprovedFeedback(course.id, {
          rating: 4,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(course.id)

        // Verify initial state
        let stats = await getCourseStats(course.id)
        expect(stats.averageWorkload).toBeCloseTo(2)

        // Edit workload to 5
        await updateFeedbackRatings(feedback.id, { workloadRating: 5 })
        await statsService.onFeedbackEdited(course.id)

        // Verify new average
        stats = await getCourseStats(course.id)
        expect(stats.averageWorkload).toBeCloseTo(5)
        expect(stats.averageRating).toBeCloseTo(4) // Rating unchanged
      })
    })

    it('should update both averages when both ratings are changed', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create feedback
        const feedback = await createApprovedFeedback(course.id, {
          rating: 2,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(course.id)

        // Edit both ratings
        await updateFeedbackRatings(feedback.id, {
          rating: 5,
          workloadRating: 4
        })
        await statsService.onFeedbackEdited(course.id)

        // Verify both averages updated
        const stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(5)
        expect(stats.averageWorkload).toBeCloseTo(4)
      })
    })
  })

  describe('Multiple feedback edits', () => {
    it('should correctly recalculate average when one of multiple feedbacks is edited', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create 3 feedbacks: ratings 1, 3, 5 -> average = 3
        await createApprovedFeedback(course.id, {
          rating: 1,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        const feedback2 = await createApprovedFeedback(course.id, {
          rating: 3,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        await createApprovedFeedback(course.id, {
          rating: 5,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        // Verify initial average
        let stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(3) // (1+3+5)/3
        expect(stats.totalFeedbackCount).toBe(3)

        // Edit middle feedback from 3 to 5 -> new average = (1+5+5)/3 = 3.67
        await updateFeedbackRatings(feedback2.id, { rating: 5 })
        await statsService.onFeedbackEdited(course.id)

        // Verify new average
        stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(3.67, 1) // (1+5+5)/3
        expect(stats.totalFeedbackCount).toBe(3) // Count unchanged
      })
    })

    it('should handle editing feedback to extreme values', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create 2 feedbacks with rating 5
        const feedback1 = await createApprovedFeedback(course.id, {
          rating: 5,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        await createApprovedFeedback(course.id, {
          rating: 5,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        // Initial average should be 5
        let stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(5)

        // Edit first feedback to 1 (minimum) -> new average = (1+5)/2 = 3
        await updateFeedbackRatings(feedback1.id, { rating: 1 })
        await statsService.onFeedbackEdited(course.id)

        stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(3)
      })
    })

    it('should maintain precision with many feedbacks', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create 5 feedbacks with ratings 1, 2, 3, 4, 5
        const feedbacks = []
        for (let i = 1; i <= 5; i++) {
          const fb = await createApprovedFeedback(course.id, {
            rating: i,
            workloadRating: i
          })
          feedbacks.push(fb)
          await statsService.onFeedbackApproved(course.id)
        }

        // Initial average should be 3 ((1+2+3+4+5)/5)
        let stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(3)
        expect(stats.averageWorkload).toBeCloseTo(3)

        // Edit the rating=3 feedback to rating=5 -> new average = (1+2+5+4+5)/5 = 3.4
        await updateFeedbackRatings(feedbacks[2].id, { rating: 5 })
        await statsService.onFeedbackEdited(course.id)

        stats = await getCourseStats(course.id)
        expect(stats.averageRating).toBeCloseTo(3.4) // (1+2+5+4+5)/5
        expect(stats.averageWorkload).toBeCloseTo(3) // Unchanged
      })
    })
  })

  describe('Identical courses - edit propagation', () => {
    it('should update both identical courses when feedback is edited', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree1 = await createDegree(faculty.id, {
          name: 'CS',
          acronym: 'CS',
          slug: 'cs'
        })
        const degree2 = await createDegree(faculty.id, {
          name: 'Chemistry',
          acronym: 'CHEM',
          slug: 'chem'
        })
        const course1 = await createCourse(degree1.id, {
          name: 'Algebra',
          slug: 'algebra-cs'
        })
        const course2 = await createCourse(degree2.id, {
          name: 'Algebra',
          slug: 'algebra-chem'
        })

        await createIdenticalRelationship(course1.id, course2.id)
        await initCourseStats(course1.id)
        await initCourseStats(course2.id)
        await initDegreeStats(degree1.id, 1)
        await initDegreeStats(degree2.id, 1)

        // Create feedback on course1
        const feedback = await createApprovedFeedback(course1.id, {
          rating: 3,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(course1.id)

        // Both courses should have same stats
        let stats1 = await getCourseStats(course1.id)
        let stats2 = await getCourseStats(course2.id)
        expect(stats1.averageRating).toBeCloseTo(3)
        expect(stats2.averageRating).toBeCloseTo(3)

        // Edit feedback rating
        await updateFeedbackRatings(feedback.id, { rating: 5 })
        await statsService.onFeedbackEdited(course1.id)

        // Both courses should have updated stats
        stats1 = await getCourseStats(course1.id)
        stats2 = await getCourseStats(course2.id)
        expect(stats1.averageRating).toBeCloseTo(5)
        expect(stats2.averageRating).toBeCloseTo(5)
        expect(stats1.averageWorkload).toBeCloseTo(2) // Unchanged
        expect(stats2.averageWorkload).toBeCloseTo(2)
      })
    })

    it('should correctly recalculate when editing one of multiple feedbacks across identical courses', async () => {
      await withTestDb(async () => {
        // Setup identical courses
        const faculty = await createFaculty()
        const degree1 = await createDegree(faculty.id, {
          name: 'CS',
          acronym: 'CS',
          slug: 'cs'
        })
        const degree2 = await createDegree(faculty.id, {
          name: 'Chemistry',
          acronym: 'CHEM',
          slug: 'chem'
        })
        const course1 = await createCourse(degree1.id, {
          name: 'Algebra',
          slug: 'algebra-cs'
        })
        const course2 = await createCourse(degree2.id, {
          name: 'Algebra',
          slug: 'algebra-chem'
        })

        await createIdenticalRelationship(course1.id, course2.id)
        await initCourseStats(course1.id)
        await initCourseStats(course2.id)
        await initDegreeStats(degree1.id, 1)
        await initDegreeStats(degree2.id, 1)

        // Create feedback on course1 (rating 4)
        const feedback1 = await createApprovedFeedback(course1.id, {
          rating: 4,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course1.id)

        // Create feedback on course2 (rating 2) - shares stats with course1
        await createApprovedFeedback(course2.id, {
          rating: 2,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course2.id)

        // Both courses should have average of 3 ((4+2)/2)
        let stats1 = await getCourseStats(course1.id)
        let stats2 = await getCourseStats(course2.id)
        expect(stats1.averageRating).toBeCloseTo(3)
        expect(stats2.averageRating).toBeCloseTo(3)
        expect(stats1.totalFeedbackCount).toBe(2)
        expect(stats2.totalFeedbackCount).toBe(2)

        // Edit first feedback from 4 to 2 -> new average = (2+2)/2 = 2
        await updateFeedbackRatings(feedback1.id, { rating: 2 })
        await statsService.onFeedbackEdited(course1.id)

        // Both courses should have new average
        stats1 = await getCourseStats(course1.id)
        stats2 = await getCourseStats(course2.id)
        expect(stats1.averageRating).toBeCloseTo(2)
        expect(stats2.averageRating).toBeCloseTo(2)
        expect(stats1.totalFeedbackCount).toBe(2)
        expect(stats2.totalFeedbackCount).toBe(2)
      })
    })
  })

  describe('Degree stats unchanged on edit', () => {
    it('should not change degree feedback count when editing', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create feedback
        const feedback = await createApprovedFeedback(course.id, {
          rating: 3,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        // Verify degree has 1 feedback
        let degreeStats = await getDegreeStats(degree.id)
        expect(degreeStats.feedbackCount).toBe(1)

        // Edit feedback multiple times
        await updateFeedbackRatings(feedback.id, { rating: 5 })
        await statsService.onFeedbackEdited(course.id)

        await updateFeedbackRatings(feedback.id, { rating: 1 })
        await statsService.onFeedbackEdited(course.id)

        await updateFeedbackRatings(feedback.id, { rating: 4 })
        await statsService.onFeedbackEdited(course.id)

        // Degree feedback count should still be 1
        degreeStats = await getDegreeStats(degree.id)
        expect(degreeStats.feedbackCount).toBe(1)
      })
    })

    it('should not change degree feedback count when editing feedback on identical courses', async () => {
      await withTestDb(async () => {
        // Setup identical courses
        const faculty = await createFaculty()
        const degree1 = await createDegree(faculty.id, {
          name: 'CS',
          acronym: 'CS',
          slug: 'cs'
        })
        const degree2 = await createDegree(faculty.id, {
          name: 'Chemistry',
          acronym: 'CHEM',
          slug: 'chem'
        })
        const course1 = await createCourse(degree1.id, {
          name: 'Algebra',
          slug: 'algebra-cs'
        })
        const course2 = await createCourse(degree2.id, {
          name: 'Algebra',
          slug: 'algebra-chem'
        })

        await createIdenticalRelationship(course1.id, course2.id)
        await initCourseStats(course1.id)
        await initCourseStats(course2.id)
        await initDegreeStats(degree1.id, 1)
        await initDegreeStats(degree2.id, 1)

        // Create feedback
        const feedback = await createApprovedFeedback(course1.id, {
          rating: 3,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course1.id)

        // Both degrees have 1 feedback
        let degreeStats1 = await getDegreeStats(degree1.id)
        let degreeStats2 = await getDegreeStats(degree2.id)
        expect(degreeStats1.feedbackCount).toBe(1)
        expect(degreeStats2.feedbackCount).toBe(1)

        // Edit feedback
        await updateFeedbackRatings(feedback.id, { rating: 5 })
        await statsService.onFeedbackEdited(course1.id)

        // Both degrees should still have 1 feedback
        degreeStats1 = await getDegreeStats(degree1.id)
        degreeStats2 = await getDegreeStats(degree2.id)
        expect(degreeStats1.feedbackCount).toBe(1)
        expect(degreeStats2.feedbackCount).toBe(1)
      })
    })
  })
})
