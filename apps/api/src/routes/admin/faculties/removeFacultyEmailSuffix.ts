import { requireAdmin } from '@middleware'
import { database } from '@uni-feedback/db'
import { faculties } from '@uni-feedback/db/schema'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { BadRequestError, NotFoundError } from '../../utils'

export class RemoveFacultyEmailSuffix extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Faculties'],
    summary: 'Remove email suffix from faculty',
    description:
      "Removes an email suffix from the faculty's list of valid suffixes",
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
        suffix: z.string()
      })
    },
    responses: {
      '200': {
        description: 'Email suffix removed successfully',
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
        description: 'Suffix not found in faculty',
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

  async handle(c: Context) {
    const env = c.env
    const authContext = await requireAdmin(c)
    const { params } = await this.getValidatedData<typeof this.schema>()
    const { id, suffix } = params

    // URL decode the suffix parameter to handle special characters
    const decodedSuffix = decodeURIComponent(suffix)

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

    // Check if suffix exists
    if (!currentSuffixes.includes(decodedSuffix)) {
      throw new BadRequestError('Email suffix not found')
    }

    // Remove suffix
    const updatedSuffixes = currentSuffixes.filter((s) => s !== decodedSuffix)

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
      action: 'removed',
      removedItem: `email suffix "${decodedSuffix}"`
    })

    return Response.json({
      facultyId: id,
      emailSuffixes: updatedSuffixes,
      message: 'Email suffix removed successfully'
    })
  }
}
