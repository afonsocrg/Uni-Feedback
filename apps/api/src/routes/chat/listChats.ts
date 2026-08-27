import { requireAuth } from '@middleware'
import { ChatService } from '@services/chatService'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { remainingMessages } from './access'

export class ListChats extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: "List the user's chats",
    description:
      'Most recently active first. Also returns the remaining daily message allowance, so the UI can show the counter without a second round trip.',
    responses: {
      '200': { description: 'Chats' },
      '401': { description: 'Not authenticated' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const service = new ChatService(c.env as Env)

    const [chats, remaining] = await Promise.all([
      service.listChats(authContext.user.id),
      remainingMessages(service, authContext.user.id)
    ])

    return Response.json({ chats, remainingMessages: remaining })
  }
}
