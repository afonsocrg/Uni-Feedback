import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { feedback, users } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { count, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { z } from 'zod'

const UserReferralsParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

const ReferredUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  createdAt: z.string(),
  feedbackCount: z.number(),
  approvedFeedbackCount: z.number()
})

/**
 * Accounts created through this user's referral link, newest first. The
 * feedback counts are there because a referral only pays out once the new
 * account submits feedback, so "signed up but never reviewed" is the thing
 * an admin wants to spot.
 */
export class GetUserReferrals extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: 'List the accounts a user referred',
    request: {
      params: UserReferralsParamsSchema
    },
    responses: {
      '200': {
        description: 'Referred users',
        content: {
          'application/json': {
            schema: z.array(ReferredUserSchema)
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

    const [referrer] = await database()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (!referrer) {
      throw new NotFoundError('User not found')
    }

    const rows = await database()
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        createdAt: users.createdAt,
        feedbackCount: count(feedback.id),
        approvedFeedbackCount: count(
          sql`CASE WHEN ${isNotNull(feedback.approvedAt)} THEN 1 END`
        )
      })
      .from(users)
      .leftJoin(feedback, eq(feedback.userId, users.id))
      .where(eq(users.referredByUserId, id))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))

    return Response.json(
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        username: row.username,
        createdAt: row.createdAt?.toISOString() ?? '',
        feedbackCount: row.feedbackCount,
        approvedFeedbackCount: row.approvedFeedbackCount
      }))
    )
  }
}
