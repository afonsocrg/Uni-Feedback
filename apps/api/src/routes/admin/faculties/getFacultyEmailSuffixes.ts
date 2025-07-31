import { faculties, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

export class GetFacultyEmailSuffixes extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Faculties'],
    summary: 'Get faculty email suffixes',
    description: 'Returns the list of email suffixes for a specific faculty',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      })
    },
    responses: {
      '200': {
        description: 'Email suffixes retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              facultyId: z.number(),
              emailSuffixes: z.array(z.string())
            })
          }
        }
      },
      '404': {
        description: 'Faculty not found',
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

      const faculty = await db
        .select({
          id: faculties.id,
          emailSuffixes: faculties.emailSuffixes
        })
        .from(faculties)
        .where(eq(faculties.id, id))
        .limit(1)

      if (faculty.length === 0) {
        return Response.json({ error: 'Faculty not found' }, { status: 404 })
      }

      return Response.json({
        facultyId: faculty[0].id,
        emailSuffixes: faculty[0].emailSuffixes || []
      })
    } catch (error) {
      console.error('Get faculty email suffixes error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}