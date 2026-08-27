import { CHAT_LIMITS } from '@config/chat'
import { requireAuth } from '@middleware'
import { ChatService } from '@services/chatService'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'
import { AppError, NotFoundError } from '../utils'
import { assertCanSendMessage, remainingMessages } from './access'

/**
 * Send a message and stream the answer back.
 *
 * **Why streaming.** A tool-calling turn took 3 to 14 seconds in the Phase 0
 * spike, and a silent 14-second spinner reads as broken. This is the one place
 * in v0 worth paying for polish.
 *
 * **Why SSE and not token streaming.** A turn is not one stream: it is several
 * provider calls with tool execution between them, and both harness guards can
 * restart it. Rather than fake a token stream, the connection sends honest
 * progress events and then the finished answer. The UI gets something truthful
 * to render, and the guards stay possible.
 */
export class SendChatMessage extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Send a message and stream the answer',
    request: {
      params: z.object({ id: z.coerce.number() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              content: z
                .string()
                .min(1, 'Message cannot be empty')
                .max(CHAT_LIMITS.MAX_MESSAGE_CHARS)
            })
          }
        }
      }
    },
    responses: {
      '200': { description: 'SSE stream of progress events and the answer' },
      '401': { description: 'Not authenticated' },
      '403': { description: 'Chat unavailable for this user' },
      '404': { description: 'Chat not found' },
      '429': { description: 'Daily message limit reached' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const env = c.env as Env
    const service = new ChatService(env)

    const chat = await service.findChat(params.id, authContext.user.id)
    if (!chat) throw new NotFoundError('Chat not found')

    // Every gate runs BEFORE the stream opens, so a refusal is a normal HTTP
    // status the client can handle, not an error buried inside a 200 stream.
    await assertCanSendMessage(c, service, {
      id: authContext.user.id,
      email: authContext.user.email
    })

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start: async (controller) => {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        }

        try {
          send('start', { chatId: chat.id })

          const result = await service.sendMessage({
            chatId: chat.id,
            userId: authContext.user.id,
            content: body.content,
            onProgress: ({ tool }) => send('working', { tool })
          })

          send('answer', {
            messageId: result.assistantMessageId,
            content: result.answer
          })

          const remaining = await remainingMessages(
            service,
            authContext.user.id
          )
          send('done', {
            remainingMessages: remaining,
            latencyMs: result.latencyMs,
            toolsUsed: result.toolsUsed,
            guardsFired: result.guardsFired
          })

          // Titles are cosmetic, so they are generated after the answer is
          // already on its way and never block or fail it.
          if (!chat.title) {
            const title = await service.generateTitle(chat.id)
            if (title) send('title', { title })
          }
        } catch (error) {
          console.error('[chat] turn failed:', error)
          send('error', {
            message:
              error instanceof AppError
                ? error.message
                : 'Algo correu mal. Tenta outra vez.'
          })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        // Nginx buffers proxied responses by default, which would hold the whole
        // stream until the turn finished and quietly undo the point of it.
        'X-Accel-Buffering': 'no'
      }
    })
  }
}
