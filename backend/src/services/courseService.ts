import { courses, type Database } from '@db'
import { eq } from 'drizzle-orm'
import { DrizzleD1Database } from 'drizzle-orm/d1'

export class CourseService {
  constructor(private db: DrizzleD1Database<Database>) {}

  /**
   * Check if a course exists in the database.
   */
  async courseExists(courseId: number): Promise<boolean> {
    const result = await this.db
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
    const result = await this.db
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
