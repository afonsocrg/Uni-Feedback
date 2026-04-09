import { requireAdmin } from '@middleware'
import { database } from '@uni-feedback/db'
import { faculties } from '@uni-feedback/db/schema'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { BadRequestError, NotFoundError } from '../../utils'

const AddSuffixSchema = z.object({
  suffix: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9.-]+$/, 'Invalid email suffix format')
})

export class AddFacultyEmailSuffix extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Faculties'],
    summary: 'Add email suffix to faculty',
    description:
      "Adds a new email suffix to the faculty's list of valid suffixes",
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      }),
      body: {
        content: {
          'application/json': {
            schema: AddSuffixSchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Email suffix added successfully',
        content: {
          'application/json': {
            schema: z.object({
              facultyId: z.number(),
              emailSuffixes: z.array(z.string()),
              message: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Invalid request data or suffix already exists',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
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

  async handle(request: IRequest, env: Env, context: RequestContext) {
    const authContext = await requireAdmin(request, env, context)
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const { id } = params
    const { suffix } = body

    // Get current faculty and email suffixes
    const faculty = await database()
      .select({
        id: faculties.id,
        name: faculties.name,
        shortName: faculties.shortName,
        emailSuffixes: faculties.emailSuffixes
      })
      .from(faculties)
      .where(eq(faculties.id, id))
      .limit(1)

    if (faculty.length === 0) {
      throw new NotFoundError('Faculty not found')
    }

    const currentSuffixes = (faculty[0].emailSuffixes as string[]) || []

    // Check if suffix already exists
    if (currentSuffixes.includes(suffix)) {
      throw new BadRequestError('Email suffix already exists')
    }

    // Add new suffix
    const updatedSuffixes = [...currentSuffixes, suffix].sort()

    // Update faculty
    await database()
      .update(faculties)
      .set({
        emailSuffixes: updatedSuffixes,
        updatedAt: new Date()
      })
      .where(eq(faculties.id, id))

    // Send notification
    await notifyAdminChange({
      env,
      user: authContext.user,
      resourceType: 'faculty',
      resourceId: id,
      resourceName: faculty[0].name,
      resourceShortName: faculty[0].shortName,
      action: 'added',
      addedItem: `email suffix "${suffix}"`
    })

    return Response.json({
      facultyId: id,
      emailSuffixes: updatedSuffixes,
      message: 'Email suffix added successfully'
    })
  }
}
