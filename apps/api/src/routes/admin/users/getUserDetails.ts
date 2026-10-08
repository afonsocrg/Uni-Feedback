import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { chats, feedback, users } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { count, eq, isNotNull, sql } from 'drizzle-orm'
import { z } from 'zod'

const UserDetailsParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

export const AdminUserDetailSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  role: z.enum(['student', 'admin', 'super_admin']),
  superuser: z.boolean(),
  referralCode: z.string().nullable(),
  instagramHandle: z.string().nullable(),
  referredByUserId: z.number().nullable(),
  referredByEmail: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  feedbackCount: z.number(),
  approvedFeedbackCount: z.number(),
  /** Includes soft-deleted chats, same as the admin chat list */
  chatCount: z.number()
})

export class GetUserDetails extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: 'Get detailed user information',
    description:
      'Retrieve account details for a user, with how much feedback they have submitted',
    request: {
      params: UserDetailsParamsSchema
    },
    responses: {
      '200': {
        description: 'User details retrieved successfully',
        content: {
          'application/json': {
            schema: AdminUserDetailSchema
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

    const [user] = await database()
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    const [counts] = await database()
      .select({
        total: count(),
        approved: count(
          sql`CASE WHEN ${isNotNull(feedback.approvedAt)} THEN 1 END`
        )
      })
      .from(feedback)
      .where(eq(feedback.userId, id))

    const [chatCounts] = await database()
      .select({ total: count() })
      .from(chats)
      .where(eq(chats.userId, id))

    let referredByEmail: string | null = null
    if (user.referredByUserId !== null) {
      const [referrer] = await database()
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, user.referredByUserId))
        .limit(1)
      referredByEmail = referrer?.email ?? null
    }

    return Response.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      superuser: user.superuser ?? false,
      referralCode: user.referralCode,
      instagramHandle: user.instagramHandle,
      referredByUserId: user.referredByUserId,
      referredByEmail,
      createdAt: user.createdAt?.toISOString() ?? '',
      updatedAt: user.updatedAt?.toISOString() ?? '',
      feedbackCount: counts?.total ?? 0,
      approvedFeedbackCount: counts?.approved ?? 0,
      chatCount: chatCounts?.total ?? 0
    })
  }
}
