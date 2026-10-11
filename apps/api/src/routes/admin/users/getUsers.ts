import { database } from '@uni-feedback/db'
import { users } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { asc, notIlike, sql } from 'drizzle-orm'
import { z } from 'zod'

const AdminUserListItemSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  role: z.enum(['student', 'admin', 'super_admin']),
  superuser: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  feedbackCount: z.number(),
  chatCount: z.number(),
  referralCount: z.number()
})

/**
 * Every account (anonymised ones excluded) with how much each has done:
 * feedback submitted, AI chats started (deleted ones included, like the chat
 * list) and accounts referred. One query, with the counts as correlated
 * subqueries so a user with nothing still comes back with zeros.
 */
export class GetUsers extends OpenAPIRoute {
  schema = {
    tags: ['Users'],
    summary: 'Get all users with activity counts (superuser only)',
    responses: {
      '200': {
        description: 'Users retrieved successfully',
        content: {
          'application/json': {
            schema: z.array(AdminUserListItemSchema)
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      },
      '403': {
        description: 'Forbidden - superuser required',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle() {
    const rows = await database()
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        superuser: users.superuser,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Written as raw SQL: drizzle drops the table qualifiers from columns
        // in a select list, which turns `users.id` into a bare `id` that the
        // subquery would resolve against its own table.
        feedbackCount: sql<number>`(
          select count(*)::int from feedback f where f.user_id = users.id
        )`,
        chatCount: sql<number>`(
          select count(*)::int from chats c where c.user_id = users.id
        )`,
        referralCount: sql<number>`(
          select count(*)::int from users r where r.referred_by_user_id = users.id
        )`
      })
      .from(users)
      .where(notIlike(users.email, '%@deleted.local'))
      .orderBy(asc(users.createdAt))

    return Response.json(
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        username: row.username,
        role: row.role,
        superuser: row.superuser ?? false,
        createdAt: row.createdAt?.toISOString() ?? '',
        updatedAt: row.updatedAt?.toISOString() ?? '',
        feedbackCount: Number(row.feedbackCount),
        chatCount: Number(row.chatCount),
        referralCount: Number(row.referralCount)
      }))
    )
  }
}
