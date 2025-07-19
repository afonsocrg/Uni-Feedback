import { courses, degrees, faculties, feedback, type Database } from '@db'
import { and, eq, sql } from 'drizzle-orm'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import type { DegreeWithCounts, GetDegreesOptions } from '@types'
import { CourseFeedbackService } from './courseFeedbackService'

export class DegreeService {
  constructor(private db: DrizzleD1Database<Database>) {}

  async getDegreesWithCounts(
    options: GetDegreesOptions = {}
  ): Promise<DegreeWithCounts[]> {
    const { facultyId, facultyShortName, onlyWithCourses = true } = options
    const courseFeedbackService = new CourseFeedbackService(this.db)

    // Use the centralized enhanced feedback join logic
    const feedbackJoin = courseFeedbackService.getEnhancedFeedbackJoin()

    let baseQuery = this.db
      .select({
        id: degrees.id,
        externalId: degrees.externalId,
        type: degrees.type,
        name: degrees.name,
        acronym: degrees.acronym,
        courseCount: sql<number>`ifnull(count(distinct ${courses.id}), 0)`.as(
          'course_count'
        ),
        feedbackCount:
          sql<number>`ifnull(count(distinct ${feedbackJoin.table.id}), 0)`.as(
            'feedback_count'
          )
      })
      .from(degrees)
      .leftJoin(courses, eq(courses.degreeId, degrees.id))
      .leftJoin(feedbackJoin.table, feedbackJoin.condition)

    // Filter by faculty ID if provided
    if (facultyId) {
      baseQuery = baseQuery.where(eq(degrees.facultyId, facultyId))
    }

    // Filter by faculty short name if provided
    if (facultyShortName) {
      baseQuery = baseQuery
        .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(eq(faculties.shortName, facultyShortName))
    }

    // Apply grouping for aggregations
    baseQuery = baseQuery.groupBy(degrees.id)

    // If onlyWithCourses is true, filter out degrees without courses
    if (onlyWithCourses) {
      baseQuery = baseQuery.having(sql`count(distinct ${courses.id}) > 0`)
    }

    const result = await baseQuery

    return result
  }
}
