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

/**
 * Test suite for identical courses logic.
 *
 * Scenario:
 * - Faculty: Engineering
 * - Degrees: Computer Science (CS) and Chemistry
 * - Shared course: Algebra (identical in both degrees)
 * - CS-only course: Programming
 * - Chemistry-only course: Molecules I
 *
 * Expected behavior:
 * - Feedback on Algebra in CS should affect both CS and Chemistry stats
 * - Feedback on Programming should only affect CS stats
 * - Feedback on Molecules I should only affect Chemistry stats
 * - Course stats for identical courses (Algebra CS and Algebra Chem) should be the same
 */
describe('StatsService - Identical Courses', () => {
  let statsService: StatsService

  // Shared test data
  let faculty: Awaited<ReturnType<typeof createFaculty>>
  let csDegree: Awaited<ReturnType<typeof createDegree>>
  let chemDegree: Awaited<ReturnType<typeof createDegree>>
  let algebraCS: Awaited<ReturnType<typeof createCourse>>
  let algebraChem: Awaited<ReturnType<typeof createCourse>>
  let programming: Awaited<ReturnType<typeof createCourse>>
  let molecules: Awaited<ReturnType<typeof createCourse>>

  beforeEach(async () => {
    await cleanAllTables()
    statsService = new StatsService()

    await withTestDb(async () => {
      // Create faculty
      faculty = await createFaculty({
        name: 'Engineering',
        shortName: 'ENG',
        slug: 'engineering'
      })

      // Create degrees
      csDegree = await createDegree(faculty.id, {
        name: 'Computer Science',
        acronym: 'CS',
        slug: 'cs'
      })
      chemDegree = await createDegree(faculty.id, {
        name: 'Chemistry',
        acronym: 'CHEM',
        slug: 'chemistry'
      })

      // Create courses
      algebraCS = await createCourse(csDegree.id, {
        name: 'Algebra',
        acronym: 'ALG',
        slug: 'algebra-cs'
      })
      algebraChem = await createCourse(chemDegree.id, {
        name: 'Algebra',
        acronym: 'ALG',
        slug: 'algebra-chem'
      })
      programming = await createCourse(csDegree.id, {
        name: 'Programming',
        acronym: 'PROG',
        slug: 'programming'
      })
      molecules = await createCourse(chemDegree.id, {
        name: 'Molecules I',
        acronym: 'MOL1',
        slug: 'molecules-1'
      })

      // Mark Algebra courses as identical
      await createIdenticalRelationship(algebraCS.id, algebraChem.id)

      // Initialize stats for all courses and degrees
      await initCourseStats(algebraCS.id)
      await initCourseStats(algebraChem.id)
      await initCourseStats(programming.id)
      await initCourseStats(molecules.id)

      await initDegreeStats(csDegree.id, 2) // CS has 2 courses: Algebra, Programming
      await initDegreeStats(chemDegree.id, 2) // Chemistry has 2 courses: Algebra, Molecules I
    })
  })

  describe('Feedback on shared course (Algebra)', () => {
    it('should update both identical courses when feedback is added to one', async () => {
      await withTestDb(async () => {
        // CS student submits feedback on Algebra
        await createApprovedFeedback(algebraCS.id, {
          rating: 5,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(algebraCS.id)

        // Both Algebra courses should have the same stats
        const algebraCSStats = await getCourseStats(algebraCS.id)
        const algebraChemStats = await getCourseStats(algebraChem.id)

        expect(algebraCSStats.totalFeedbackCount).toBe(1)
        expect(algebraChemStats.totalFeedbackCount).toBe(1)
        expect(algebraCSStats.averageRating).toBeCloseTo(5)
        expect(algebraChemStats.averageRating).toBeCloseTo(5)
        expect(algebraCSStats.averageWorkload).toBeCloseTo(3)
        expect(algebraChemStats.averageWorkload).toBeCloseTo(3)
      })
    })

    it('should update both degrees when feedback is added to shared course', async () => {
      await withTestDb(async () => {
        // CS student submits feedback on Algebra
        await createApprovedFeedback(algebraCS.id, {
          rating: 4,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(algebraCS.id)

        // Both degrees should have incremented feedback count
        const csStats = await getDegreeStats(csDegree.id)
        const chemStats = await getDegreeStats(chemDegree.id)

        expect(csStats.feedbackCount).toBe(1)
        expect(chemStats.feedbackCount).toBe(1)
      })
    })

    it('should aggregate feedback from both identical courses', async () => {
      await withTestDb(async () => {
        // CS student submits feedback on Algebra (via algebraCS)
        await createApprovedFeedback(algebraCS.id, {
          rating: 5,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(algebraCS.id)

        // Chemistry student submits feedback on Algebra (via algebraChem)
        await createApprovedFeedback(algebraChem.id, {
          rating: 3,
          workloadRating: 4
        })
        await statsService.onFeedbackApproved(algebraChem.id)

        // Both courses should have aggregated stats (2 feedbacks, average of both)
        const algebraCSStats = await getCourseStats(algebraCS.id)
        const algebraChemStats = await getCourseStats(algebraChem.id)

        expect(algebraCSStats.totalFeedbackCount).toBe(2)
        expect(algebraChemStats.totalFeedbackCount).toBe(2)
        expect(algebraCSStats.averageRating).toBeCloseTo(4) // (5+3)/2
        expect(algebraChemStats.averageRating).toBeCloseTo(4)
        expect(algebraCSStats.averageWorkload).toBeCloseTo(3) // (2+4)/2
        expect(algebraChemStats.averageWorkload).toBeCloseTo(3)

        // Both degrees should have 2 feedbacks
        const csStats = await getDegreeStats(csDegree.id)
        const chemStats = await getDegreeStats(chemDegree.id)

        expect(csStats.feedbackCount).toBe(2)
        expect(chemStats.feedbackCount).toBe(2)
      })
    })

    it('should decrement both degrees when feedback on shared course is unapproved', async () => {
      await withTestDb(async () => {
        // Setup: add feedback to shared course
        await createApprovedFeedback(algebraCS.id, {
          rating: 4,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(algebraCS.id)

        // Verify initial state
        let csStats = await getDegreeStats(csDegree.id)
        let chemStats = await getDegreeStats(chemDegree.id)
        expect(csStats.feedbackCount).toBe(1)
        expect(chemStats.feedbackCount).toBe(1)

        // Unapprove feedback
        await statsService.onFeedbackUnapproved(algebraCS.id)

        // Both degrees should be decremented
        csStats = await getDegreeStats(csDegree.id)
        chemStats = await getDegreeStats(chemDegree.id)
        expect(csStats.feedbackCount).toBe(0)
        expect(chemStats.feedbackCount).toBe(0)
      })
    })
  })

  describe('Feedback on non-shared courses', () => {
    it('should only update CS degree when feedback is added to Programming', async () => {
      await withTestDb(async () => {
        await createApprovedFeedback(programming.id, {
          rating: 5,
          workloadRating: 4
        })
        await statsService.onFeedbackApproved(programming.id)

        // Only CS should have incremented feedback count
        const csStats = await getDegreeStats(csDegree.id)
        const chemStats = await getDegreeStats(chemDegree.id)

        expect(csStats.feedbackCount).toBe(1)
        expect(chemStats.feedbackCount).toBe(0) // Chemistry unaffected
      })
    })

    it('should only update Chemistry degree when feedback is added to Molecules I', async () => {
      await withTestDb(async () => {
        await createApprovedFeedback(molecules.id, {
          rating: 3,
          workloadRating: 5
        })
        await statsService.onFeedbackApproved(molecules.id)

        // Only Chemistry should have incremented feedback count
        const csStats = await getDegreeStats(csDegree.id)
        const chemStats = await getDegreeStats(chemDegree.id)

        expect(csStats.feedbackCount).toBe(0) // CS unaffected
        expect(chemStats.feedbackCount).toBe(1)
      })
    })

    it('should not affect other course stats when feedback is added to non-shared course', async () => {
      await withTestDb(async () => {
        await createApprovedFeedback(programming.id, {
          rating: 5,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(programming.id)

        // Programming should have stats
        const programmingStats = await getCourseStats(programming.id)
        expect(programmingStats.totalFeedbackCount).toBe(1)
        expect(programmingStats.averageRating).toBeCloseTo(5)

        // Molecules should remain at 0
        const moleculesStats = await getCourseStats(molecules.id)
        expect(moleculesStats.totalFeedbackCount).toBe(0)
        expect(moleculesStats.averageRating).toBeNull()

        // Algebra courses should also remain at 0
        const algebraCSStats = await getCourseStats(algebraCS.id)
        const algebraChemStats = await getCourseStats(algebraChem.id)
        expect(algebraCSStats.totalFeedbackCount).toBe(0)
        expect(algebraChemStats.totalFeedbackCount).toBe(0)
      })
    })
  })

  describe('Mixed scenario - feedback on both shared and non-shared courses', () => {
    it('should correctly track stats when feedback is added to multiple courses', async () => {
      await withTestDb(async () => {
        // Add feedback to shared Algebra (affects both degrees)
        await createApprovedFeedback(algebraCS.id, {
          rating: 4,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(algebraCS.id)

        // Add feedback to Programming (CS only)
        await createApprovedFeedback(programming.id, {
          rating: 5,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(programming.id)

        // Add feedback to Molecules I (Chemistry only)
        await createApprovedFeedback(molecules.id, {
          rating: 3,
          workloadRating: 4
        })
        await statsService.onFeedbackApproved(molecules.id)

        // CS should have 2 feedbacks (Algebra + Programming)
        const csStats = await getDegreeStats(csDegree.id)
        expect(csStats.feedbackCount).toBe(2)

        // Chemistry should have 2 feedbacks (Algebra + Molecules)
        const chemStats = await getDegreeStats(chemDegree.id)
        expect(chemStats.feedbackCount).toBe(2)

        // Verify course stats are independent
        const programmingStats = await getCourseStats(programming.id)
        expect(programmingStats.totalFeedbackCount).toBe(1)
        expect(programmingStats.averageRating).toBeCloseTo(5)

        const moleculesStats = await getCourseStats(molecules.id)
        expect(moleculesStats.totalFeedbackCount).toBe(1)
        expect(moleculesStats.averageRating).toBeCloseTo(3)

        // Algebra courses should share the same stats
        const algebraCSStats = await getCourseStats(algebraCS.id)
        const algebraChemStats = await getCourseStats(algebraChem.id)
        expect(algebraCSStats.totalFeedbackCount).toBe(1)
        expect(algebraChemStats.totalFeedbackCount).toBe(1)
      })
    })

    it('should handle unapproval correctly in mixed scenario', async () => {
      await withTestDb(async () => {
        // Setup: add feedback to all courses
        await createApprovedFeedback(algebraCS.id, {
          rating: 4,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(algebraCS.id)
        await createApprovedFeedback(programming.id, {
          rating: 5,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(programming.id)
        await createApprovedFeedback(molecules.id, {
          rating: 3,
          workloadRating: 4
        })
        await statsService.onFeedbackApproved(molecules.id)

        // Initial state: CS=2, Chem=2
        let csStats = await getDegreeStats(csDegree.id)
        let chemStats = await getDegreeStats(chemDegree.id)
        expect(csStats.feedbackCount).toBe(2)
        expect(chemStats.feedbackCount).toBe(2)

        // Unapprove Programming feedback (CS only)
        await statsService.onFeedbackUnapproved(programming.id)

        csStats = await getDegreeStats(csDegree.id)
        chemStats = await getDegreeStats(chemDegree.id)
        expect(csStats.feedbackCount).toBe(1) // CS decremented
        expect(chemStats.feedbackCount).toBe(2) // Chemistry unchanged

        // Unapprove Algebra feedback (both degrees)
        await statsService.onFeedbackUnapproved(algebraCS.id)

        csStats = await getDegreeStats(csDegree.id)
        chemStats = await getDegreeStats(chemDegree.id)
        expect(csStats.feedbackCount).toBe(0) // CS decremented again
        expect(chemStats.feedbackCount).toBe(1) // Chemistry decremented
      })
    })
  })

  describe('Edit feedback', () => {
    it('should update course stats but not degree stats when editing feedback on shared course', async () => {
      await withTestDb(async () => {
        // Add initial feedback
        await createApprovedFeedback(algebraCS.id, {
          rating: 3,
          workloadRating: 3
        })
        await statsService.onFeedbackApproved(algebraCS.id)

        // Verify initial state
        let csStats = await getDegreeStats(csDegree.id)
        let chemStats = await getDegreeStats(chemDegree.id)
        expect(csStats.feedbackCount).toBe(1)
        expect(chemStats.feedbackCount).toBe(1)

        // Simulate edit (in real scenario, the feedback rating would be updated in DB first)
        await statsService.onFeedbackEdited(algebraCS.id)

        // Degree stats should remain unchanged
        csStats = await getDegreeStats(csDegree.id)
        chemStats = await getDegreeStats(chemDegree.id)
        expect(csStats.feedbackCount).toBe(1)
        expect(chemStats.feedbackCount).toBe(1)
      })
    })

    it('should update both identical course stats when editing feedback', async () => {
      await withTestDb(async () => {
        // Add feedback
        await createApprovedFeedback(algebraCS.id, {
          rating: 4,
          workloadRating: 2
        })
        await statsService.onFeedbackApproved(algebraCS.id)

        // Both courses should have same stats
        let algebraCSStats = await getCourseStats(algebraCS.id)
        let algebraChemStats = await getCourseStats(algebraChem.id)
        expect(algebraCSStats.averageRating).toBeCloseTo(4)
        expect(algebraChemStats.averageRating).toBeCloseTo(4)

        // After edit, both should still be in sync (recalculated from same feedback pool)
        await statsService.onFeedbackEdited(algebraCS.id)

        algebraCSStats = await getCourseStats(algebraCS.id)
        algebraChemStats = await getCourseStats(algebraChem.id)
        expect(algebraCSStats.totalFeedbackCount).toBe(
          algebraChemStats.totalFeedbackCount
        )
        expect(algebraCSStats.averageRating).toBeCloseTo(
          algebraChemStats.averageRating!
        )
      })
    })
  })

  describe('refreshAllStats', () => {
    it('should correctly recalculate all stats for mixed identical/non-identical courses', async () => {
      await withTestDb(async () => {
        // Add feedback without calling update methods (simulating out-of-sync state)
        await createApprovedFeedback(algebraCS.id, {
          rating: 5,
          workloadRating: 2
        })
        await createApprovedFeedback(algebraChem.id, {
          rating: 3,
          workloadRating: 4
        })
        await createApprovedFeedback(programming.id, {
          rating: 4,
          workloadRating: 3
        })
        await createApprovedFeedback(molecules.id, {
          rating: 2,
          workloadRating: 5
        })

        // Refresh all stats
        const result = await statsService.refreshAllStats()

        expect(result.coursesUpdated).toBe(4)
        expect(result.degreesUpdated).toBe(2)

        // Algebra courses should have aggregated stats (2 feedbacks)
        const algebraCSStats = await getCourseStats(algebraCS.id)
        const algebraChemStats = await getCourseStats(algebraChem.id)
        expect(algebraCSStats.totalFeedbackCount).toBe(2)
        expect(algebraChemStats.totalFeedbackCount).toBe(2)
        expect(algebraCSStats.averageRating).toBeCloseTo(4) // (5+3)/2
        expect(algebraChemStats.averageRating).toBeCloseTo(4)

        // Non-shared courses should have their own stats
        const programmingStats = await getCourseStats(programming.id)
        expect(programmingStats.totalFeedbackCount).toBe(1)
        expect(programmingStats.averageRating).toBeCloseTo(4)

        const moleculesStats = await getCourseStats(molecules.id)
        expect(moleculesStats.totalFeedbackCount).toBe(1)
        expect(moleculesStats.averageRating).toBeCloseTo(2)

        // CS degree: 2 Algebra feedbacks + 1 Programming = 3
        const csStats = await getDegreeStats(csDegree.id)
        expect(csStats.feedbackCount).toBe(3)

        // Chemistry degree: 2 Algebra feedbacks + 1 Molecules = 3
        const chemStats = await getDegreeStats(chemDegree.id)
        expect(chemStats.feedbackCount).toBe(3)
      })
    })
  })
})
