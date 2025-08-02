import { degrees, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  acronym: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  description: z.string().nullable().optional()
})

const DegreeResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  facultyId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class UpdateDegree extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Degrees'],
    summary: 'Update degree information',
    description:
      'Updates degree information including name, acronym, type, and description',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      }),
      body: {
        content: {
          'application/json': {
            schema: DegreeUpdateSchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Degree updated successfully',
        content: {
          'application/json': {
            schema: DegreeResponseSchema
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
      const { params, body } = await this.getValidatedData<typeof this.schema>()
      const { id } = params
      const updateData = body

      // Validate field values are not null/empty for required fields
      const validationErrors: { field: string; message: string }[] = []

      if (updateData.name !== undefined) {
        if (updateData.name === null || updateData.name.trim() === '') {
          validationErrors.push({
            field: 'name',
            message: 'Degree name cannot be empty'
          })
        }
      }

      if (updateData.acronym !== undefined) {
        if (updateData.acronym === null || updateData.acronym.trim() === '') {
          validationErrors.push({
            field: 'acronym',
            message: 'Degree acronym cannot be empty'
          })
        }
      }

      if (updateData.type !== undefined) {
        if (updateData.type === null || updateData.type.trim() === '') {
          validationErrors.push({
            field: 'type',
            message: 'Degree type cannot be empty'
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

      // Check if degree exists
      const existingDegree = await db
        .select()
        .from(degrees)
        .where(eq(degrees.id, id))
        .limit(1)

      if (existingDegree.length === 0) {
        return Response.json({ error: 'Degree not found' }, { status: 404 })
      }

      // Build update data with trimmed values
      const dbUpdateData: any = {}
      if (updateData.name !== undefined)
        dbUpdateData.name = updateData.name.trim()
      if (updateData.acronym !== undefined)
        dbUpdateData.acronym = updateData.acronym.trim()
      if (updateData.type !== undefined)
        dbUpdateData.type = updateData.type.trim()
      if (updateData.description !== undefined)
        dbUpdateData.description = updateData.description

      // Update degree
      const updatedDegree = await db
        .update(degrees)
        .set({
          ...dbUpdateData,
          updatedAt: new Date()
        })
        .where(eq(degrees.id, id))
        .returning({
          id: degrees.id,
          name: degrees.name,
          acronym: degrees.acronym,
          type: degrees.type,
          description: degrees.description,
          facultyId: degrees.facultyId,
          createdAt: degrees.createdAt,
          updatedAt: degrees.updatedAt
        })

      const response = {
        ...updatedDegree[0],
        createdAt: updatedDegree[0].createdAt?.toISOString() || '',
        updatedAt: updatedDegree[0].updatedAt?.toISOString() || ''
      }

      return Response.json(response)
    } catch (error) {
      console.error('Update degree error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
