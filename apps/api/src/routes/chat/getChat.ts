import { requireAuth } from '@middleware'
import { ChatService } from '@services/chatService'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'
import { NotFoundError } from '../utils'

export class GetChat extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Get one chat and its messages',
    request: { params: z.object({ id: z.coerce.number() }) },
    responses: {
      '200': { description: 'Chat with messages' },
      '401': { description: 'Not authenticated' },
      '404': { description: 'Chat not found' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const { params } = await this.getValidatedData<typeof this.schema>()

    const service = new ChatService(c.env as Env)
    // findChat scopes by user, so another user's chat is a 404 rather than a
    // 403: existence itself is not something to leak.
    const chat = await service.findChat(params.id, authContext.user.id)
    if (!chat) throw new NotFoundError('Chat not found')

    const messages = await service.getMessages(chat.id)

    return Response.json({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      lastMessageAt: chat.lastMessageAt,
      context: {
        facultyId: chat.contextFacultyId,
        degreeId: chat.contextDegreeId,
        courseId: chat.contextCourseId,
        source: chat.contextSource
      },
      messages
    })
  }
}
