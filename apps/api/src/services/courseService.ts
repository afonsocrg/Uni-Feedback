import { courses } from '@uni-feedback/db/schema'
import { database } from '@uni-feedback/db'
import { eq } from 'drizzle-orm'

export class CourseService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  /**
   * Check if a course exists in the database.
   */
  async courseExists(courseId: number): Promise<boolean> {
    const result = await database()
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    return result.length > 0
  }

  /**
   * Get basic course information by ID.
   */
  async getCourseById(courseId: number) {
    const result = await database()
      .select({
        id: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        degreeId: courses.degreeId
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    return result[0] || null
  }
}
