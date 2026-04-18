import { requireAuth } from '@middleware'
import { sendCorrectionRequestNotification } from '@services'
import { database } from '@uni-feedback/db'
import {
  CORRECTION_REQUEST_FIELDS,
  correctionRequests,
  courses
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { NotFoundError } from '../utils'

export class SubmitCorrectionRequest extends OpenAPIRoute {
  schema = {
    tags: ['Courses'],
    summary: 'Submit a correction request',
    description: 'Report incorrect course information for admin review',
    request: {
      params: z.object({ id: z.number() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              field: z.enum(CORRECTION_REQUEST_FIELDS),
              notes: z.string().min(1, 'Notes are required'),
              currentValue: z.string().optional()
            })
          }
        }
      }
    },
    responses: {
      '201': { description: 'Correction request submitted successfully' },
      '400': { description: 'Invalid request' },
      '401': { description: 'Not authenticated' },
      '404': { description: 'Course not found' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const userId = authContext.user.id
    const userEmail = authContext.user.email
    const env = c.env as Env
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const courseId = params.id
    const { field, notes, currentValue } = body

    const [course] = await database()
      .select({ id: courses.id, name: courses.name })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) {
      throw new NotFoundError('Course not found')
    }

    const [inserted] = await database()
      .insert(correctionRequests)
      .values({
        courseId,
        userId,
        field,
        notes,
        currentValue: currentValue ?? null
      })
      .returning({ id: correctionRequests.id })

    try {
      await sendCorrectionRequestNotification(env, {
        correctionRequestId: inserted.id,
        courseId,
        courseName: course.name,
        field,
        notes,
        currentValue,
        userId,
        userEmail
      })
    } catch (notifyError) {
      console.error(
        'Failed to send correction request notification:',
        notifyError
      )
    }

    return Response.json(
      { message: 'Correction request submitted successfully' },
      { status: 201 }
    )
  }
}
