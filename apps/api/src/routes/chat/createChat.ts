import { requireAuth } from '@middleware'
import { ChatService } from '@services/chatService'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'

export class CreateChat extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Start a chat',
    description:
      'Creates an empty conversation. Optional context scopes it to a faculty, degree or course, which is what the "ask about this course" entry points set.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              language: z.enum(['pt', 'en']).optional(),
              contextFacultyId: z.number().optional(),
              contextDegreeId: z.number().optional(),
              contextCourseId: z.number().optional(),
              contextSource: z
                .enum(['course_page', 'degree_page', 'manual'])
                .optional()
            })
          }
        }
      }
    },
    responses: {
      '201': { description: 'Chat created' },
      '401': { description: 'Not authenticated' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const { body } = await this.getValidatedData<typeof this.schema>()

    const service = new ChatService(c.env as Env)
    const chat = await service.createChat({
      userId: authContext.user.id,
      language: body.language,
      scope: {
        facultyId: body.contextFacultyId,
        degreeId: body.contextDegreeId,
        courseId: body.contextCourseId,
        source: body.contextSource
      }
    })

    return Response.json(
      {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt
      },
      { status: 201 }
    )
  }
}
