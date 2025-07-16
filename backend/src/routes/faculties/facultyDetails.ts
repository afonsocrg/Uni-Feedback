import { degrees, faculties, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreeSchema = z.object({
  id: z.number(),
  externalId: z.string().nullable(),
  type: z.string(),
  name: z.string(),
  acronym: z.string(),
  campus: z.string()
})

const FacultyDetailsResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  short_name: z.string(),
  url: z.string(),
  emailSuffixes: z.array(z.string()).optional(),
  degrees: z.array(DegreeSchema)
})

export class GetFacultyDetails extends OpenAPIRoute {
  schema = {
    tags: ['Faculties'],
    summary: 'Get faculty details with degrees',
    description: 'Returns faculty information with all associated degrees',
    request: {
      params: z.object({
        id: z.number()
      })
    },
    responses: {
      '200': {
        description: 'Faculty details with degrees',
        content: {
          'application/json': {
            schema: FacultyDetailsResponseSchema
          }
        }
      },
      '404': {
        description: 'Faculty not found'
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)
    const data = await this.getValidatedData<typeof this.schema>()
    const {
      params: { id: facultyId }
    } = data

    // Get faculty details
    const faculty = await db
      .select({
        id: faculties.id,
        name: faculties.name,
        short_name: faculties.shortName,
        url: faculties.url,
        emailSuffixes: faculties.emailSuffixes
      })
      .from(faculties)
      .where(eq(faculties.id, facultyId))
      .limit(1)

    if (faculty.length === 0) {
      return Response.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      )
    }

    // Get degrees for this faculty
    const facultyDegrees = await db
      .select({
        id: degrees.id,
        externalId: degrees.externalId,
        type: degrees.type,
        name: degrees.name,
        acronym: degrees.acronym,
        campus: degrees.campus
      })
      .from(degrees)
      .where(eq(degrees.facultyId, facultyId))

    const result = {
      ...faculty[0],
      degrees: facultyDegrees
    }

    return Response.json(result)
  }
}
