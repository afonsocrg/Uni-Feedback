import {
  courseRelationships,
  courses,
  courseStats,
  degrees,
  degreeStats,
  faculties,
  feedbackFull
} from '@uni-feedback/db/schema'
import { getTestDb } from './setup'

/**
 * Create a faculty for testing
 */
export async function createFaculty(data?: Partial<typeof faculties.$inferInsert>) {
  const db = getTestDb()
  const [faculty] = await db
    .insert(faculties)
    .values({
      name: data?.name ?? 'Test Faculty',
      shortName: data?.shortName ?? 'TF',
      slug: data?.slug ?? 'test-faculty',
      url: data?.url ?? 'https://test-faculty.edu',
      ...data
    })
    .returning()
  return faculty
}

/**
 * Create a degree for testing
 */
export async function createDegree(
  facultyId: number,
  data?: Partial<typeof degrees.$inferInsert>
) {
  const db = getTestDb()
  const [degree] = await db
    .insert(degrees)
    .values({
      facultyId,
      name: data?.name ?? 'Test Degree',
      acronym: data?.acronym ?? 'TD',
      slug: data?.slug ?? 'test-degree',
      type: data?.type ?? 'bachelor',
      campus: data?.campus ?? 'Main',
      ...data
    })
    .returning()
  return degree
}

/**
 * Create a course for testing
 */
export async function createCourse(
  degreeId: number,
  data?: Partial<typeof courses.$inferInsert>
) {
  const db = getTestDb()
  const [course] = await db
    .insert(courses)
    .values({
      degreeId,
      name: data?.name ?? 'Test Course',
      acronym: data?.acronym ?? 'TC',
      slug: data?.slug ?? 'test-course',
      ...data
    })
    .returning()
  return course
}

/**
 * Create an identical course relationship
 */
export async function createIdenticalRelationship(
  sourceCourseId: number,
  targetCourseId: number
) {
  const db = getTestDb()
  // Create bidirectional relationship
  await db.insert(courseRelationships).values([
    {
      sourceCourseId,
      targetCourseId,
      relationshipType: 'identical'
    },
    {
      sourceCourseId: targetCourseId,
      targetCourseId: sourceCourseId,
      relationshipType: 'identical'
    }
  ])
}

/**
 * Create approved feedback for testing
 */
export async function createApprovedFeedback(
  courseId: number,
  data?: Partial<typeof feedbackFull.$inferInsert>
) {
  const db = getTestDb()
  const [feedback] = await db
    .insert(feedbackFull)
    .values({
      courseId,
      rating: data?.rating ?? 4,
      workloadRating: data?.workloadRating ?? 3,
      schoolYear: data?.schoolYear ?? 2024,
      approvedAt: data?.approvedAt ?? new Date(),
      ...data
    })
    .returning()
  return feedback
}

/**
 * Create unapproved feedback for testing
 */
export async function createUnapprovedFeedback(
  courseId: number,
  data?: Partial<typeof feedbackFull.$inferInsert>
) {
  const db = getTestDb()
  const [feedback] = await db
    .insert(feedbackFull)
    .values({
      courseId,
      rating: data?.rating ?? 4,
      workloadRating: data?.workloadRating ?? 3,
      schoolYear: data?.schoolYear ?? 2024,
      approvedAt: null,
      ...data
    })
    .returning()
  return feedback
}

/**
 * Initialize empty stats for a course
 */
export async function initCourseStats(courseId: number) {
  const db = getTestDb()
  await db.insert(courseStats).values({
    courseId,
    averageRating: null,
    averageWorkload: null,
    totalFeedbackCount: 0,
    updatedAt: new Date()
  })
}

/**
 * Initialize empty stats for a degree
 */
export async function initDegreeStats(degreeId: number, courseCount: number = 0) {
  const db = getTestDb()
  await db.insert(degreeStats).values({
    degreeId,
    courseCount,
    feedbackCount: 0,
    updatedAt: new Date()
  })
}

/**
 * Get course stats from database
 */
export async function getCourseStats(courseId: number) {
  const db = getTestDb()
  const [stats] = await db
    .select()
    .from(courseStats)
    .where((await import('drizzle-orm')).eq(courseStats.courseId, courseId))
  return stats
}

/**
 * Get degree stats from database
 */
export async function getDegreeStats(degreeId: number) {
  const db = getTestDb()
  const [stats] = await db
    .select()
    .from(degreeStats)
    .where((await import('drizzle-orm')).eq(degreeStats.degreeId, degreeId))
  return stats
}

/**
 * Update feedback ratings
 */
export async function updateFeedbackRatings(
  feedbackId: number,
  data: { rating?: number; workloadRating?: number }
) {
  const db = getTestDb()
  const { eq } = await import('drizzle-orm')
  const [updated] = await db
    .update(feedbackFull)
    .set(data)
    .where(eq(feedbackFull.id, feedbackId))
    .returning()
  return updated
}
