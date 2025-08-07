import { courses, getDb } from '@db'
import { detectChanges, notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const CourseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  acronym: z.string().min(1).optional(),
  ects: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  bibliography: z.string().nullable().optional(),
  assessment: z.string().nullable().optional(),
  hasMandatoryExam: z.boolean().nullable().optional()
})

const CourseResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  ects: z.number().nullable(),
  terms: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  bibliography: z.string().nullable(),
  assessment: z.string().nullable(),
  hasMandatoryExam: z.boolean().nullable(),
  degreeId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class UpdateCourse extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Update course information',
    description:
      'Updates course information including name, acronym, ects, description, bibliography, assessment, and hasMandatoryExam',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      }),
      body: {
        content: {
          'application/json': {
            schema: CourseUpdateSchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Course updated successfully',
        content: {
          'application/json': {
            schema: CourseResponseSchema
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
        description: 'Course not found',
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

      // Validate field values are not null/empty for required fields
      const validationErrors: { field: string; message: string }[] = []

      if (updateData.name !== undefined) {
        if (updateData.name === null || updateData.name.trim() === '') {
          validationErrors.push({
            field: 'name',
            message: 'Course name cannot be empty'
          })
        }
      }

      if (updateData.acronym !== undefined) {
        if (updateData.acronym === null || updateData.acronym.trim() === '') {
          validationErrors.push({
            field: 'acronym',
            message: 'Course acronym cannot be empty'
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

      // Check if course exists
      const existingCourse = await db
        .select()
        .from(courses)
        .where(eq(courses.id, id))
        .limit(1)

      if (existingCourse.length === 0) {
        return Response.json({ error: 'Course not found' }, { status: 404 })
      }

      // Build update data with trimmed values
      const dbUpdateData: any = {}
      if (updateData.name !== undefined)
        dbUpdateData.name = updateData.name.trim()
      if (updateData.acronym !== undefined)
        dbUpdateData.acronym = updateData.acronym.trim()
      if (updateData.ects !== undefined) dbUpdateData.ects = updateData.ects
      if (updateData.description !== undefined)
        dbUpdateData.description = updateData.description
      if (updateData.bibliography !== undefined)
        dbUpdateData.bibliography = updateData.bibliography
      if (updateData.assessment !== undefined)
        dbUpdateData.assessment = updateData.assessment
      if (updateData.hasMandatoryExam !== undefined)
        dbUpdateData.hasMandatoryExam = updateData.hasMandatoryExam

      // Detect changes for notification
      const changes = detectChanges(existingCourse[0], dbUpdateData, [
        'name',
        'acronym',
        'ects',
        'description',
        'bibliography',
        'assessment',
        'hasMandatoryExam'
      ])

      // Update course
      const updatedCourse = await db
        .update(courses)
        .set({
          ...dbUpdateData,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id))
        .returning({
          id: courses.id,
          name: courses.name,
          acronym: courses.acronym,
          ects: courses.ects,
          terms: courses.terms,
          description: courses.description,
          bibliography: courses.bibliography,
          assessment: courses.assessment,
          hasMandatoryExam: courses.hasMandatoryExam,
          degreeId: courses.degreeId,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt
        })

      // Send notification if changes were made
      if (changes.length > 0) {
        await notifyAdminChange({
          env,
          user: context.user,
          resourceType: 'course',
          resourceId: id,
          resourceName: updatedCourse[0].name,
          resourceShortName: updatedCourse[0].acronym,
          action: 'updated',
          changes
        })
      }

      const response = {
        ...updatedCourse[0],
        terms: updatedCourse[0].terms as string[] | null,
        createdAt: updatedCourse[0].createdAt?.toISOString() || '',
        updatedAt: updatedCourse[0].updatedAt?.toISOString() || ''
      }

      return Response.json(response)
    } catch (error) {
      console.error('Update course error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
