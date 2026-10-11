import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { users } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const UserChatStatsParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

export const AdminUserChatStatsSchema = z.object({
  chats: z.number(),
  deletedChats: z.number(),
  questions: z.number(),
  answers: z.number(),
  costMicros: z.number(),
  helpful: z.number(),
  notHelpful: z.number(),
  firstChatAt: z.string().nullable(),
  lastChatAt: z.string().nullable()
})

type Row = Record<string, unknown>
const num = (v: unknown) => Number(v ?? 0)

/**
 * One user's share of the AI chat totals: the same figures as the admin chat
 * stats page (chats, questions, answers, cost, ratings), scoped to one
 * account and never windowed, since a single user's history is small enough
 * to read whole. Soft-deleted chats count, as they do on the chat list.
 */
export class GetUserChatStats extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: "Totals for a user's AI chats",
    request: {
      params: UserChatStatsParamsSchema
    },
    responses: {
      '200': {
        description: 'Chat totals for the user',
        content: {
          'application/json': {
            schema: AdminUserChatStatsSchema
          }
        }
      },
      '404': {
        description: 'User not found',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle() {
    const { params } = await this.getValidatedData<typeof this.schema>()
    const { id } = params

    if (!id || isNaN(id)) {
      throw new NotFoundError('User not found')
    }

    const db = database()

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Messages are reached through the chat, so every subquery scopes on
    // `c.user_id` rather than trusting a user id on the message row.
    const [row] = await db.execute<Row>(sql`
      select
        (select count(*)::int from chats c where c.user_id = ${id}) as chats,
        (select count(*)::int from chats c where c.user_id = ${id} and c.deleted_at is not null) as deleted_chats,
        (select count(*)::int from chat_messages m join chats c on c.id = m.chat_id where c.user_id = ${id} and m.role = 'user') as questions,
        (select count(*)::int from chat_messages m join chats c on c.id = m.chat_id where c.user_id = ${id} and m.role = 'assistant') as answers,
        (select coalesce(sum(m.cost_micros), 0)::bigint from chat_messages m join chats c on c.id = m.chat_id where c.user_id = ${id}) as cost_micros,
        (select count(*)::int from chat_message_feedback f join chat_messages m on m.id = f.message_id join chats c on c.id = m.chat_id where c.user_id = ${id} and f.rating = 'helpful') as helpful,
        (select count(*)::int from chat_message_feedback f join chat_messages m on m.id = f.message_id join chats c on c.id = m.chat_id where c.user_id = ${id} and f.rating = 'not_helpful') as not_helpful,
        (select min(c.created_at) from chats c where c.user_id = ${id}) as first_chat_at,
        (select max(coalesce(c.last_message_at, c.created_at)) from chats c where c.user_id = ${id}) as last_chat_at
    `)

    const iso = (v: unknown) =>
      v ? new Date(v as string | Date).toISOString() : null

    return Response.json({
      chats: num(row.chats),
      deletedChats: num(row.deleted_chats),
      questions: num(row.questions),
      answers: num(row.answers),
      costMicros: num(row.cost_micros),
      helpful: num(row.helpful),
      notHelpful: num(row.not_helpful),
      firstChatAt: iso(row.first_chat_at),
      lastChatAt: iso(row.last_chat_at)
    })
  }
}
