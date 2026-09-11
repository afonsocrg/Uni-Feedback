import { CHAT_LIMITS } from '@config/chat'
import { requireAuth } from '@middleware'
import { ChatService } from '@services/chatService'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'
import { AppError } from '../utils'
import { assertCanSendMessage, remainingMessages } from './access'

/**
 * Start a conversation by sending its first message.
 *
 * One call, not two. Creating the chat and sending the first message used to be
 * separate requests, and every gate lived in the second one, so a student who
 * was over quota or whose university is not enabled created a chat and was then
 * refused: the database collected conversations that never happened.
 *
 * Now the gates run first and the row only exists once a message is actually
 * going to be sent. It also means the chat arrives named, because the title is
 * generated from this same exchange, so it never sits in the sidebar as
 * "Nova conversa".
 */
export class StartChat extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Start a chat with its first message',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              content: z
                .string()
                .min(1, 'Message cannot be empty')
                .max(CHAT_LIMITS.MAX_MESSAGE_CHARS),
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
      '200': { description: 'SSE stream of progress events and the answer' },
      '401': { description: 'Not authenticated' },
      '403': { description: 'Chat unavailable for this user' },
      '429': { description: 'Daily message limit reached' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const { body } = await this.getValidatedData<typeof this.schema>()
    const service = new ChatService(c.env as Env)

    // Before anything is written. A refusal here leaves no trace, which is the
    // whole point of collapsing this into one call.
    await assertCanSendMessage(c, service, { id: authContext.user.id })

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start: async (controller) => {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        }

        try {
          const { chat, turn } = await service.startChat({
            userId: authContext.user.id,
            content: body.content,
            language: body.language,
            scope: {
              facultyId: body.contextFacultyId,
              degreeId: body.contextDegreeId,
              courseId: body.contextCourseId,
              source: body.contextSource
            },
            onProgress: ({ tool }) => send('working', { tool })
          })

          send('answer', {
            messageId: turn.assistantMessageId,
            content: turn.answer,
            // Travels with the answer rather than with `done`, because the ask
            // it drives is rendered under this message.
            gap: turn.gap
          })

          // Named before the client is told the chat exists, so the sidebar
          // never shows an untitled row.
          const title = await service.generateTitle(chat.id)

          // `created` carries the id the URL should move to. The client stays
          // on /chat until this arrives, so a refused or failed first message
          // never changes the URL.
          send('created', { chatId: chat.publicId, title })

          send('done', {
            remainingMessages: await remainingMessages(
              service,
              authContext.user.id
            ),
            latencyMs: turn.latencyMs,
            toolsUsed: turn.toolsUsed,
            guardsFired: turn.guardsFired
          })
        } catch (error) {
          console.error('[chat] first turn failed:', error)
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
        'X-Accel-Buffering': 'no'
      }
    })
  }
}
