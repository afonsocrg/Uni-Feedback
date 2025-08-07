import { faculties, getDb } from '@db'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

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

  async handle(request: IRequest, env: any, context: any) {
    try {
      const { params, body } = await this.getValidatedData<typeof this.schema>()
      const { id } = params
      const { suffix } = body

      const db = getDb(env)

      // Get current faculty and email suffixes
      const faculty = await db
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
        return Response.json({ error: 'Faculty not found' }, { status: 404 })
      }

      const currentSuffixes = (faculty[0].emailSuffixes as string[]) || []

      // Check if suffix already exists
      if (currentSuffixes.includes(suffix)) {
        return Response.json(
          { error: 'Email suffix already exists' },
          { status: 400 }
        )
      }

      // Add new suffix
      const updatedSuffixes = [...currentSuffixes, suffix].sort()

      // Update faculty
      await db
        .update(faculties)
        .set({
          emailSuffixes: updatedSuffixes,
          updatedAt: new Date()
        })
        .where(eq(faculties.id, id))

      // Send notification
      await notifyAdminChange({
        env,
        user: context.user,
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
    } catch (error) {
      console.error('Add faculty email suffix error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
