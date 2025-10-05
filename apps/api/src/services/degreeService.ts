import { database } from '@uni-feedback/db'
import { courses, degrees, faculties, feedback } from '@uni-feedback/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import type { DegreeWithCounts, GetDegreesOptions } from '@types'
import { CourseFeedbackService } from './courseFeedbackService'

export class DegreeService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  async getDegreesWithCounts(
    options: GetDegreesOptions = {}
  ): Promise<DegreeWithCounts[]> {
    const { facultyId, facultyShortName, onlyWithCourses = true } = options
    const courseFeedbackService = new CourseFeedbackService(this.env)

    // Use the centralized enhanced feedback join logic
    const feedbackJoin = courseFeedbackService.getEnhancedFeedbackJoin()

    const baseQuery = database()
      .select({
        id: degrees.id,
        externalId: degrees.externalId,
        type: degrees.type,
        name: degrees.name,
        acronym: degrees.acronym,
        courseCount: sql<number>`COALESCE(count(distinct ${courses.id}), 0)`.as(
          'course_count'
        ),
        feedbackCount:
          sql<number>`COALESCE(count(distinct ${feedbackJoin.table.id}), 0)`.as(
            'feedback_count'
          )
      })
      .from(degrees)
      .leftJoin(courses, eq(courses.degreeId, degrees.id))
      .leftJoin(feedbackJoin.table, feedbackJoin.condition)
      .$dynamic()

    // Filter by faculty ID if provided
    const withFacultyFilter = facultyId
      ? baseQuery.where(eq(degrees.facultyId, facultyId))
      : baseQuery

    // Filter by faculty short name if provided
    const withShortNameFilter = facultyShortName
      ? withFacultyFilter
          .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
          .where(eq(faculties.shortName, facultyShortName))
      : withFacultyFilter

    // Apply grouping for aggregations
    const withGroupBy = withShortNameFilter.groupBy(degrees.id)

    // If onlyWithCourses is true, filter out degrees without courses
    const finalQuery = onlyWithCourses
      ? withGroupBy.having(sql`count(distinct ${courses.id}) > 0`)
      : withGroupBy

    const result = await finalQuery

    return result as DegreeWithCounts[]
  }
}
