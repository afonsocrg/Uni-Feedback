import { database } from '@uni-feedback/db'
import { courses, degrees, faculties } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const AdminDegreeDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  facultyId: z.number(),
  facultyName: z.string(),
  facultyShortName: z.string(),
  courseCount: z.number(),
  reportOptions: z.object({
    curriculumYears: z.array(z.number()),
    terms: z.array(z.string())
  }),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class GetDegreeDetails extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Degrees'],
    summary: 'Get detailed degree information',
    description:
      'Retrieve detailed information for a specific degree including description and course count',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      })
    },
    responses: {
      '200': {
        description: 'Degree details retrieved successfully',
        content: {
          'application/json': {
            schema: AdminDegreeDetailSchema
          }
        }
      },
      '404': {
        description: 'Degree not found',
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

      // Get degree with faculty info and course count
      const degreeResult = await database()
        .select({
          id: degrees.id,
          name: degrees.name,
          acronym: degrees.acronym,
          type: degrees.type,
          description: degrees.description,
          facultyId: degrees.facultyId,
          facultyName: faculties.name,
          facultyShortName: faculties.shortName,
          createdAt: degrees.createdAt,
          updatedAt: degrees.updatedAt,
          courseCount: sql<number>`(
            SELECT COUNT(*)
            FROM courses
            WHERE courses.degree_id = ${degrees.id}
          )`
        })
        .from(degrees)
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(eq(degrees.id, id))
        .limit(1)

      if (degreeResult.length === 0) {
        return Response.json({ error: 'Degree not found' }, { status: 404 })
      }

      const degree = degreeResult[0]

      // Get report options (curriculum years and terms)
      const coursesResult = await database()
        .select({
          curriculumYear: courses.curriculumYear,
          terms: courses.terms
        })
        .from(courses)
        .where(eq(courses.degreeId, id))

      const curriculumYearSet = new Set<number>()
      const termSet = new Set<string>()

      for (const course of coursesResult) {
        if (course.curriculumYear !== null && course.curriculumYear !== undefined) {
          curriculumYearSet.add(course.curriculumYear)
        }
        if (course.terms && Array.isArray(course.terms)) {
          for (const term of course.terms as string[]) {
            termSet.add(term)
          }
        }
      }

      const response = {
        ...degree,
        courseCount: Number(degree.courseCount),
        reportOptions: {
          curriculumYears: Array.from(curriculumYearSet).sort((a, b) => a - b),
          terms: Array.from(termSet).sort()
        },
        createdAt: degree.createdAt?.toISOString() || '',
        updatedAt: degree.updatedAt?.toISOString() || ''
      }

      return Response.json(response)
    } catch (error) {
      console.error('Get degree details error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
