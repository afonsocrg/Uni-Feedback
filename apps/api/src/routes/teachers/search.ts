import { database } from '@uni-feedback/db'
import { coursesTeachers, faculties, teachers } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

const TeacherSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  faculty: z
    .object({
      id: z.number(),
      name: z.string(),
      shortName: z.string(),
      slug: z.string().nullable()
    })
    .nullable(),
  courseCount: z.number()
})

const SearchTeachersResponseSchema = z.object({
  teachers: TeacherSearchResultSchema.array(),
  total: z.number()
})

export class SearchTeachers extends OpenAPIRoute {
  schema = {
    tags: ['Teachers'],
    summary: 'Search teachers by name or email',
    request: {
      query: z.object({
        q: z
          .string()
          .optional()
          .describe('Search query for teacher name or email'),
        limit: z.coerce
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe('Max results')
      })
    },
    responses: {
      '200': {
        description: 'Teacher search results',
        content: {
          'application/json': {
            schema: SearchTeachersResponseSchema
          }
        }
      }
    }
  }

  async handle() {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { q, limit } = query

    const db = database()
    const whereClause = q
      ? or(
          sql`unaccent(${teachers.name}) ILIKE unaccent(${`%${q}%`})`,
          sql`unaccent(${teachers.email}) ILIKE unaccent(${`%${q}%`})`
        )
      : undefined

    const rows = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        email: teachers.email,
        faculty: {
          id: faculties.id,
          name: faculties.name,
          shortName: faculties.shortName,
          slug: faculties.slug
        },
        courseCount: sql<number>`count(distinct ${coursesTeachers.courseId})::integer`
      })
      .from(teachers)
      .leftJoin(coursesTeachers, eq(coursesTeachers.teacherId, teachers.id))
      .leftJoin(faculties, eq(teachers.facultyId, faculties.id))
      .where(whereClause)
      .groupBy(
        teachers.id,
        teachers.name,
        teachers.email,
        faculties.id,
        faculties.name,
        faculties.shortName,
        faculties.slug
      )
      .orderBy(teachers.name)
      .limit(limit)

    return Response.json({
      teachers: rows,
      total: rows.length
    })
  }
}
