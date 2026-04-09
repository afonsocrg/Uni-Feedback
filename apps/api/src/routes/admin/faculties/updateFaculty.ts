import { requireAdmin } from '@middleware'
import { database } from '@uni-feedback/db'
import { faculties } from '@uni-feedback/db/schema'
import { detectChanges, notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { NotFoundError, ValidationError } from '../../utils'

const FacultyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().min(1).optional()
})

const FacultyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortName: z.string(),
  emailSuffixes: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class UpdateFaculty extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Faculties'],
    summary: 'Update faculty information',
    description:
      'Updates basic faculty information (name, shortName, url). Email suffixes are managed separately.',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      }),
      body: {
        content: {
          'application/json': {
            schema: FacultyUpdateSchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Faculty updated successfully',
        content: {
          'application/json': {
            schema: FacultyResponseSchema
          }
        }
      },
      '400': {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string(),
              errors: z
                .array(
                  z.object({
                    field: z.string(),
                    message: z.string()
                  })
                )
                .optional()
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
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const { id } = params
    const updateData = body

    // Validate field values are not null/empty
    const validationErrors: { field: string; message: string }[] = []

    if (updateData.name !== undefined) {
      if (updateData.name === null || updateData.name.trim() === '') {
        validationErrors.push({
          field: 'name',
          message: 'Faculty name cannot be empty'
        })
      }
    }

    if (updateData.shortName !== undefined) {
      if (updateData.shortName === null || updateData.shortName.trim() === '') {
        validationErrors.push({
          field: 'shortName',
          message: 'Faculty short name cannot be empty'
        })
      }
    }

    if (validationErrors.length > 0) {
      throw new ValidationError('Validation failed', validationErrors)
    }

    // Check if faculty exists
    const existingFaculty = await database()
      .select()
      .from(faculties)
      .where(eq(faculties.id, id))
      .limit(1)

    if (existingFaculty.length === 0) {
      throw new NotFoundError('Faculty not found')
    }

    // Update database with trimmed values
    const dbUpdateData: Record<string, unknown> = {}
    if (updateData.name !== undefined)
      dbUpdateData.name = updateData.name.trim()
    if (updateData.shortName !== undefined)
      dbUpdateData.shortName = updateData.shortName.trim()

    // Detect changes for notification
    const changes = detectChanges(existingFaculty[0], dbUpdateData, [
      'name',
      'shortName'
    ])

    // Update faculty
    const updatedFaculty = await database()
      .update(faculties)
      .set({
        ...dbUpdateData,
        updatedAt: new Date()
      })
      .where(eq(faculties.id, id))
      .returning({
        id: faculties.id,
        name: faculties.name,
        shortName: faculties.shortName,
        emailSuffixes: faculties.emailSuffixes,
        createdAt: faculties.createdAt,
        updatedAt: faculties.updatedAt
      })

    // Send notification if changes were made
    if (changes.length > 0) {
      await notifyAdminChange({
        env,
        user: authContext.user,
        resourceType: 'faculty',
        resourceId: id,
        resourceName: updatedFaculty[0].name,
        resourceShortName: updatedFaculty[0].shortName,
        action: 'updated',
        changes
      })
    }

    return Response.json(updatedFaculty[0])
  }
}
