import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { faculties } from '@uni-feedback/db/schema'
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

  async handle(_request: IRequest, _env: Env, _context: RequestContext) {
    const { params } = await this.getValidatedData<typeof this.schema>()
    const { id } = params

    const faculty = await database()
      .select({
        id: faculties.id,
        emailSuffixes: faculties.emailSuffixes
      })
      .from(faculties)
      .where(eq(faculties.id, id))
      .limit(1)

    if (faculty.length === 0) {
      throw new NotFoundError('Faculty not found')
    }

    return Response.json({
      facultyId: faculty[0].id,
      emailSuffixes: faculty[0].emailSuffixes || []
    })
  }
}
