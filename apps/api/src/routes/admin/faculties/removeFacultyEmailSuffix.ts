import { faculties, getDb } from '@uni-feedback/database'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

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

  async handle(request: IRequest, env: any, context: any) {
    try {
      const { params } = await this.getValidatedData<typeof this.schema>()
      const { id, suffix } = params

      // URL decode the suffix parameter to handle special characters
      const decodedSuffix = decodeURIComponent(suffix)

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

      // Check if suffix exists
      if (!currentSuffixes.includes(decodedSuffix)) {
        return Response.json(
          { error: 'Email suffix not found' },
          { status: 400 }
        )
      }

      // Remove suffix
      const updatedSuffixes = currentSuffixes.filter((s) => s !== decodedSuffix)

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
        action: 'removed',
        removedItem: `email suffix "${decodedSuffix}"`
      })

      return Response.json({
        facultyId: id,
        emailSuffixes: updatedSuffixes,
        message: 'Email suffix removed successfully'
      })
    } catch (error) {
      console.error('Remove faculty email suffix error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
