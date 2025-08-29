import { courses, degrees, faculties, getDb } from '@uni-feedback/database'
import { OpenAPIRoute } from 'chanfana'
import { eq, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const AdminCourseDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  ects: z.number().nullable(),
  terms: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  bibliography: z.string().nullable(),
  assessment: z.string().nullable(),
  hasMandatoryExam: z.boolean().nullable(),
  degreeId: z.number(),
  degreeName: z.string(),
  degreeAcronym: z.string(),
  facultyId: z.number(),
  facultyName: z.string(),
  facultyShortName: z.string(),
  totalFeedbackCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class GetCourseDetails extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Get detailed course information',
    description:
      'Retrieve detailed information for a specific course including description, feedback count, and related degree/faculty info',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      })
    },
    responses: {
      '200': {
        description: 'Course details retrieved successfully',
        content: {
          'application/json': {
            schema: AdminCourseDetailSchema
          }
        }
      },
      '404': {
        description: 'Course not found',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    try {
      const { params } = await this.getValidatedData<typeof this.schema>()
      const { id } = params

      const db = getDb(env)

      // Get course with degree and faculty info plus feedback count
      const courseResult = await db
        .select({
          id: courses.id,
          name: courses.name,
          acronym: courses.acronym,
          ects: courses.ects,
          terms: courses.terms,
          description: courses.description,
          bibliography: courses.bibliography,
          assessment: courses.assessment,
          hasMandatoryExam: courses.hasMandatoryExam,
          degreeId: courses.degreeId,
          degreeName: degrees.name,
          degreeAcronym: degrees.acronym,
          facultyId: degrees.facultyId,
          facultyName: faculties.name,
          facultyShortName: faculties.shortName,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt,
          totalFeedbackCount: sql<number>`(
            SELECT COUNT(*) 
            FROM feedback 
            WHERE feedback.course_id = ${courses.id}
          )`
        })
        .from(courses)
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(eq(courses.id, id))
        .limit(1)

      if (courseResult.length === 0) {
        return Response.json({ error: 'Course not found' }, { status: 404 })
      }

      const course = courseResult[0]

      const response = {
        ...course,
        totalFeedbackCount: Number(course.totalFeedbackCount),
        terms: course.terms as string[] | null,
        createdAt: course.createdAt?.toISOString() || '',
        updatedAt: course.updatedAt?.toISOString() || ''
      }

      return Response.json(response)
    } catch (error) {
      console.error('Get course details error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
