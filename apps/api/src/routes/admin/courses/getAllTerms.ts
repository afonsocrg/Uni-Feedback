import { database } from '@uni-feedback/db'
import { courses, degrees } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const AllTermsQuerySchema = z.object({
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
})

const AllTermsResponseSchema = z.object({
  terms: z.array(z.string())
})

export class GetAllTerms extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Get all distinct course terms',
    description:
      'Retrieve all distinct terms from courses with optional faculty filtering',
    request: {
      query: AllTermsQuerySchema
    },
    responses: {
      '200': {
        description: 'Terms retrieved successfully',
        content: {
          'application/json': {
            schema: AllTermsResponseSchema
          }
        }
      },
      '400': {
        description: 'Invalid query parameters',
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
      const { query } = await this.getValidatedData<typeof this.schema>()
      const { faculty_id } = query

      // Build query for courses with terms
      const coursesResult = faculty_id
        ? await database()
            .selectDistinct({
              terms: courses.terms
            })
            .from(courses)
            .leftJoin(degrees, eq(courses.degreeId, degrees.id))
            .where(
              and(
                eq(degrees.facultyId, faculty_id),
                sql`${courses.terms} IS NOT NULL`
              )
            )
        : await database()
            .selectDistinct({
              terms: courses.terms
            })
            .from(courses)
            .where(sql`${courses.terms} IS NOT NULL`)

      // Extract and flatten all terms
      const allTerms = new Set<string>()

      for (const course of coursesResult) {
        const terms = course.terms as string[]
        if (terms && Array.isArray(terms)) {
          terms.forEach((term) => allTerms.add(term))
        }
      }

      // Convert to sorted array
      const sortedTerms = Array.from(allTerms).sort()

      return Response.json({
        terms: sortedTerms
      })
    } catch (error) {
      console.error('Get all terms error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
