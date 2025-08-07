import { courseGroup, getDb } from '@db'
import { detectChanges, notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const UpdateCourseGroupSchema = z.object({
  name: z.string().min(1).optional()
})

const CourseGroupResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  degreeId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class UpdateCourseGroup extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Course Groups'],
    summary: 'Update course group information',
    description: 'Update course group name and other details',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      }),
      body: {
        content: {
          'application/json': {
            schema: UpdateCourseGroupSchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Course group updated successfully',
        content: {
          'application/json': {
            schema: CourseGroupResponseSchema
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
        description: 'Course group not found',
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

      // Validate field values
      const validationErrors: { field: string; message: string }[] = []

      if (updateData.name !== undefined) {
        if (updateData.name === null || updateData.name.trim() === '') {
          validationErrors.push({
            field: 'name',
            message: 'Course group name cannot be empty'
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

      // Check if course group exists
      const existingCourseGroup = await db
        .select()
        .from(courseGroup)
        .where(eq(courseGroup.id, id))
        .limit(1)

      if (existingCourseGroup.length === 0) {
        return Response.json(
          { error: 'Course group not found' },
          { status: 404 }
        )
      }

      // Build update data with trimmed values
      const dbUpdateData: any = {}
      if (updateData.name !== undefined) {
        dbUpdateData.name = updateData.name.trim()
      }

      // Detect changes for notification
      const changes = detectChanges(existingCourseGroup[0], dbUpdateData, ['name'])

      // Update course group
      const updatedCourseGroup = await db
        .update(courseGroup)
        .set({
          ...dbUpdateData,
          updatedAt: new Date()
        })
        .where(eq(courseGroup.id, id))
        .returning({
          id: courseGroup.id,
          name: courseGroup.name,
          degreeId: courseGroup.degreeId,
          createdAt: courseGroup.createdAt,
          updatedAt: courseGroup.updatedAt
        })

      // Send notification if changes were made
      if (changes.length > 0) {
        await notifyAdminChange({
          env,
          user: context.user,
          resourceType: 'course-group',
          resourceId: id,
          resourceName: updatedCourseGroup[0].name,
          action: 'updated',
          changes
        })
      }

      const response = {
        ...updatedCourseGroup[0],
        createdAt: updatedCourseGroup[0].createdAt?.toISOString() || '',
        updatedAt: updatedCourseGroup[0].updatedAt?.toISOString() || ''
      }

      return Response.json(response)
    } catch (error) {
      console.error('Update course group error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
