import { eq } from 'drizzle-orm'
import { database } from '../context'
import { courseRedirects } from '../schema'

/**
 * Id of the course that replaced a deleted one, or null when the id was never
 * redirected. Only call it after the live lookup failed: a live course always
 * wins (migration 0063).
 */
export async function findCourseRedirect(
  oldCourseId: number
): Promise<number | null> {
  const [row] = await database()
    .select({ courseId: courseRedirects.courseId })
    .from(courseRedirects)
    .where(eq(courseRedirects.oldCourseId, oldCourseId))
    .limit(1)
  return row?.courseId ?? null
}
