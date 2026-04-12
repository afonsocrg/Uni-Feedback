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
  initDegreeStats
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { StatsService } from '../statsService'

describe('StatsService', () => {
  let statsService: StatsService

  beforeEach(async () => {
    await cleanAllTables()
    statsService = new StatsService()
  })

  describe('onFeedbackApproved', () => {
    it('should create course stats when first feedback is approved', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        await createApprovedFeedback(course.id, {
          rating: 4,
          workloadRating: 3
        })

        // Act
        await statsService.onFeedbackApproved(course.id)

        // Assert
        const courseStatsResult = await getCourseStats(course.id)
        expect(courseStatsResult.totalFeedbackCount).toBe(1)
        expect(courseStatsResult.averageRating).toBeCloseTo(4)
        expect(courseStatsResult.averageWorkload).toBeCloseTo(3)

        const degreeStatsResult = await getDegreeStats(degree.id)
        expect(degreeStatsResult.feedbackCount).toBe(1)
      })
    })

    it('should update averages when additional feedback is approved', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        await createApprovedFeedback(course.id, {
          rating: 4,
          workloadRating: 2
        })
        await createApprovedFeedback(course.id, {
          rating: 2,
          workloadRating: 4
        })

        // Act
        await statsService.onFeedbackApproved(course.id)

        // Assert
        const courseStatsResult = await getCourseStats(course.id)
        expect(courseStatsResult.totalFeedbackCount).toBe(2)
        expect(courseStatsResult.averageRating).toBeCloseTo(3) // (4+2)/2
        expect(courseStatsResult.averageWorkload).toBeCloseTo(3) // (2+4)/2
      })
    })

    it('should update stats for all identical courses', async () => {
      await withTestDb(async () => {
        // Setup - two identical courses in different degrees
        const faculty = await createFaculty()
        const degree1 = await createDegree(faculty.id, {
          name: 'Degree 1',
          slug: 'degree-1'
        })
        const degree2 = await createDegree(faculty.id, {
          name: 'Degree 2',
          slug: 'degree-2'
        })
        const course1 = await createCourse(degree1.id, {
          name: 'Course 1',
          slug: 'course-1'
        })
        const course2 = await createCourse(degree2.id, {
          name: 'Course 2',
          slug: 'course-2'
        })

        await createIdenticalRelationship(course1.id, course2.id)
        await initCourseStats(course1.id)
        await initCourseStats(course2.id)
        await initDegreeStats(degree1.id, 1)
        await initDegreeStats(degree2.id, 1)

        // Create feedback on course1
        await createApprovedFeedback(course1.id, {
          rating: 5,
          workloadRating: 2
        })

        // Act
        await statsService.onFeedbackApproved(course1.id)

        // Assert - both courses should have same stats
        const stats1 = await getCourseStats(course1.id)
        const stats2 = await getCourseStats(course2.id)

        expect(stats1.totalFeedbackCount).toBe(1)
        expect(stats2.totalFeedbackCount).toBe(1)
        expect(stats1.averageRating).toBeCloseTo(5)
        expect(stats2.averageRating).toBeCloseTo(5)

        // Both degrees should have incremented feedback count
        const degreeStats1 = await getDegreeStats(degree1.id)
        const degreeStats2 = await getDegreeStats(degree2.id)
        expect(degreeStats1.feedbackCount).toBe(1)
        expect(degreeStats2.feedbackCount).toBe(1)
      })
    })
  })

  describe('onFeedbackUnapproved', () => {
    it('should decrement stats when feedback is unapproved', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        // Create two feedbacks and call onFeedbackApproved for each
        await createApprovedFeedback(course.id, {
          rating: 4,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(course.id)

        await createApprovedFeedback(course.id, {
          rating: 2,
          workloadRating: 4
        })
        await statsService.onFeedbackApproved(course.id)

        const initialStats = await getDegreeStats(degree.id)
        expect(initialStats.feedbackCount).toBe(2)

        // Act - simulate unapproving one feedback (in real scenario, approvedAt would be set to null)
        await statsService.onFeedbackUnapproved(course.id)

        // Assert - degree feedback count decremented
        const finalStats = await getDegreeStats(degree.id)
        expect(finalStats.feedbackCount).toBe(1)
      })
    })

    it('should not go below zero for feedback count', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1) // Start with 0 feedback

        // Act - try to decrement below 0
        await statsService.onFeedbackUnapproved(course.id)

        // Assert
        const degreeStatsResult = await getDegreeStats(degree.id)
        expect(degreeStatsResult.feedbackCount).toBe(0)
      })
    })
  })

  describe('onFeedbackEdited', () => {
    it('should update course stats but not degree stats', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course = await createCourse(degree.id)
        await initCourseStats(course.id)
        await initDegreeStats(degree.id, 1)

        await createApprovedFeedback(course.id, {
          rating: 3,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(course.id)

        const initialDegreeStats = await getDegreeStats(degree.id)
        expect(initialDegreeStats.feedbackCount).toBe(1)

        // Act - simulate editing (stats service just recalculates course stats)
        // In a real scenario, the feedback rating would be updated in DB first
        await statsService.onFeedbackEdited(course.id)

        // Assert - course stats recalculated, degree stats unchanged
        const courseStatsResult = await getCourseStats(course.id)
        expect(courseStatsResult.totalFeedbackCount).toBe(1)

        const finalDegreeStats = await getDegreeStats(degree.id)
        expect(finalDegreeStats.feedbackCount).toBe(1) // Unchanged
      })
    })
  })

  describe('refreshAllStats', () => {
    it('should recalculate all course and degree stats', async () => {
      await withTestDb(async () => {
        // Setup
        const faculty = await createFaculty()
        const degree = await createDegree(faculty.id)
        const course1 = await createCourse(degree.id, {
          name: 'Course 1',
          slug: 'course-1'
        })
        const course2 = await createCourse(degree.id, {
          name: 'Course 2',
          slug: 'course-2'
        })

        await createApprovedFeedback(course1.id, {
          rating: 5,
          workloadRating: 1
        })
        await createApprovedFeedback(course1.id, {
          rating: 3,
          workloadRating: 3
        })
        await createApprovedFeedback(course2.id, {
          rating: 4,
          workloadRating: 2
        })

        // Act
        const result = await statsService.refreshAllStats()

        // Assert
        expect(result.coursesUpdated).toBe(2)
        expect(result.degreesUpdated).toBe(1)

        const stats1 = await getCourseStats(course1.id)
        expect(stats1.totalFeedbackCount).toBe(2)
        expect(stats1.averageRating).toBeCloseTo(4) // (5+3)/2

        const stats2 = await getCourseStats(course2.id)
        expect(stats2.totalFeedbackCount).toBe(1)
        expect(stats2.averageRating).toBeCloseTo(4)

        const degreeStatsResult = await getDegreeStats(degree.id)
        expect(degreeStatsResult.courseCount).toBe(2)
        expect(degreeStatsResult.feedbackCount).toBe(3)
      })
    })
  })
})
