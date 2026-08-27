import { requireAuth } from '@middleware'
import { ChatService } from '@services/chatService'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'
import { NotFoundError } from '../utils'

export class DeleteChat extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Delete a chat',
    description:
      'Soft delete. The chat disappears from the user and stops being used, and the record survives, which is what the terms describe.',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      '200': { description: 'Chat deleted' },
      '401': { description: 'Not authenticated' },
      '404': { description: 'Chat not found' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const { params } = await this.getValidatedData<typeof this.schema>()

    const service = new ChatService(c.env as Env)
    const deleted = await service.deleteChat(params.id, authContext.user.id)
    if (!deleted) throw new NotFoundError('Chat not found')

    return Response.json({ message: 'Chat deleted' })
  }
}
