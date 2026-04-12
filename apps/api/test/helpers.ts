import {
  courseRelationships,
  courses,
  courseStats,
  degrees,
  degreeStats,
  emailPreferences,
  faculties,
  feedbackFull,
  users
} from '@uni-feedback/db/schema'
import { randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'
import { AUTH_CONFIG } from '../src/config/auth'
import { AuthService } from '../src/services/authService'
import { getTestDb, testEnv } from './setup'

/**
 * Create a faculty for testing
 */
export async function createFaculty(
  data?: Partial<typeof faculties.$inferInsert>
) {
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
export async function initDegreeStats(
  degreeId: number,
  courseCount: number = 0
) {
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
    .where(eq(courseStats.courseId, courseId))
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
    .where(eq(degreeStats.degreeId, degreeId))
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
  const [updated] = await db
    .update(feedbackFull)
    .set(data)
    .where(eq(feedbackFull.id, feedbackId))
    .returning()
  return updated
}

/**
 * Create a user for testing
 */
export async function createUser(data?: Partial<typeof users.$inferInsert>) {
  const db = getTestDb()
  const uniqueId = Math.random().toString(36).substring(7)
  const [user] = await db
    .insert(users)
    .values({
      email: data?.email ?? `test-${uniqueId}@example.com`,
      username: data?.username ?? `testuser-${uniqueId}`,
      role: data?.role ?? 'student',
      ...data
    })
    .returning()
  return user
}

/**
 * Create email preferences for a user
 */
export async function createEmailPreferences(
  userId: number,
  data?: Partial<typeof emailPreferences.$inferInsert>
) {
  const db = getTestDb()
  const token = data?.unsubscribeToken ?? randomBytes(32).toString('hex')
  const [prefs] = await db
    .insert(emailPreferences)
    .values({
      userId,
      unsubscribeToken: token,
      subscribedReminders: data?.subscribedReminders ?? true,
      ...data
    })
    .returning()
  return prefs
}

/**
 * Get email preferences by user ID
 */
export async function getEmailPreferences(userId: number) {
  const db = getTestDb()
  const [prefs] = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.userId, userId))
  return prefs
}

/**
 * Create a session for a user. Must be called inside withTestDb().
 */
export async function createSession(
  userId: number,
  role: 'student' | 'admin' | 'super_admin' = 'student'
) {
  const authService = new AuthService(testEnv)
  return authService.createSession(userId, role)
}

/**
 * Returns the Cookie header string for the given access token.
 */
export function createAuthCookie(accessToken: string): string {
  return `${AUTH_CONFIG.COOKIE_NAME}-access=${accessToken}`
}

/**
 * Creates a user + session and returns a ready-to-use Cookie header string.
 * Must be called inside withTestDb().
 */
export async function createAuthenticatedUser(
  role: 'student' | 'admin' | 'super_admin' = 'student'
) {
  const user = await createUser({ role })
  const session = await createSession(user.id, role)
  return { user, session, cookie: createAuthCookie(session.accessToken) }
}

/**
 * Get email preferences by token
 */
export async function getEmailPreferencesByToken(token: string) {
  const db = getTestDb()
  const [prefs] = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.unsubscribeToken, token))
  return prefs
}

/**
 * Update email preferences
 */
export async function updateEmailPreferences(
  userId: number,
  data: Partial<typeof emailPreferences.$inferInsert>
) {
  const db = getTestDb()
  const [updated] = await db
    .update(emailPreferences)
    .set(data)
    .where(eq(emailPreferences.userId, userId))
    .returning()
  return updated
}
