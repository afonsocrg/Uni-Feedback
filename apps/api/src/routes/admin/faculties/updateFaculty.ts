import { faculties, getDb } from '@db'
import { detectChanges, notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

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

  async handle(request: IRequest, env: any, context: any) {
    try {
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
        if (
          updateData.shortName === null ||
          updateData.shortName.trim() === ''
        ) {
          validationErrors.push({
            field: 'shortName',
            message: 'Faculty short name cannot be empty'
          })
        }
      }

      if (validationErrors.length > 0) {
        return Response.json(
          {
            error: 'Validation failed',
            errors: validationErrors
          },
          { status: 400 }
        )
      }

      const db = getDb(env)

      // Check if faculty exists
      const existingFaculty = await db
        .select()
        .from(faculties)
        .where(eq(faculties.id, id))
        .limit(1)

      if (existingFaculty.length === 0) {
        return Response.json({ error: 'Faculty not found' }, { status: 404 })
      }

      // Update database with trimmed values
      const dbUpdateData: any = {}
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
      const updatedFaculty = await db
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
          user: context.user,
          resourceType: 'faculty',
          resourceId: id,
          resourceName: updatedFaculty[0].name,
          resourceShortName: updatedFaculty[0].shortName,
          action: 'updated',
          changes
        })
      }

      return Response.json(updatedFaculty[0])
    } catch (error) {
      console.error('Update faculty error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
