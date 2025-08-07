import { courseGroup, degrees, getDb } from '@db'
import { ValidationErrors } from '@types'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const CreateCourseGroupSchema = z.object({
  name: z.string().min(1, 'Course group name is required'),
  degreeId: z.number().min(1, 'Degree ID is required')
})

const CourseGroupResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  degreeId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class CreateCourseGroup extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Course Groups'],
    summary: 'Create a new course group',
    description: 'Create a new course group for a specific degree',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateCourseGroupSchema
          }
        }
      }
    },
    responses: {
      '201': {
        description: 'Course group created successfully',
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
        description: 'Degree not found',
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
      const { body } = await this.getValidatedData<typeof this.schema>()
      const { name, degreeId } = body

      // Validate field values
      const validationErrors: ValidationErrors = []

      if (!name || name.trim() === '') {
        validationErrors.push({
          field: 'name',
          message: 'Course group name cannot be empty'
        })
      }

      if (!degreeId || degreeId <= 0) {
        validationErrors.push({
          field: 'degreeId',
          message: 'Valid degree ID is required'
        })
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

      // Check if degree exists
      const existingDegree = await db
        .select()
        .from(degrees)
        .where(eq(degrees.id, degreeId))
        .limit(1)

      if (existingDegree.length === 0) {
        return Response.json({ error: 'Degree not found' }, { status: 404 })
      }

      // Create course group
      const newCourseGroup = await db
        .insert(courseGroup)
        .values({
          name: name.trim(),
          degreeId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({
          id: courseGroup.id,
          name: courseGroup.name,
          degreeId: courseGroup.degreeId,
          createdAt: courseGroup.createdAt,
          updatedAt: courseGroup.updatedAt
        })

      // Send notification
      await notifyAdminChange({
        env,
        user: context.user,
        resourceType: 'course-group',
        resourceId: newCourseGroup[0].id,
        resourceName: newCourseGroup[0].name,
        action: 'created'
      })

      const response = {
        ...newCourseGroup[0],
        createdAt: newCourseGroup[0].createdAt?.toISOString() || '',
        updatedAt: newCourseGroup[0].updatedAt?.toISOString() || ''
      }

      return Response.json(response, { status: 201 })
    } catch (error) {
      console.error('Create course group error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
