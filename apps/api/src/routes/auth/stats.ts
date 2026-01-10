import { authenticateUser } from '@middleware'
import { PointService } from '@services/pointService'
import { database } from '@uni-feedback/db'
import { feedback, pointRegistry } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, count, eq, sum } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

export class GetUserStats extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Get current user statistics',
    responses: {
      '200': {
        description: 'User statistics retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              stats: z.object({
                totalPoints: z.number(),
                feedbackCount: z.number(),
                feedbackPoints: z.number(),
                referralCount: z.number(),
                referralPoints: z.number()
              })
            })
          }
        }
      },
      '401': {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    try {
      // Authenticate user
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck

      const userId = context.user.id
      const pointService = new PointService(env)

      // Get total points
      const totalPoints = await pointService.getUserTotalPoints(userId)

      // Get feedback count
      const feedbackCountResult = await database()
        .select({ count: count() })
        .from(feedback)
        .where(eq(feedback.userId, userId))
      const feedbackCount = feedbackCountResult[0]?.count || 0

      // Get feedback points
      const feedbackPointsAmountResult = await database()
        .select({ amount: sum(pointRegistry.amount) })
        .from(pointRegistry)
        .where(
          and(
            eq(pointRegistry.userId, userId),
            eq(pointRegistry.sourceType, 'submit_feedback')
          )
        )
      const feedbackPoints = feedbackPointsAmountResult[0]?.amount || 0

      // Get referral count (completed referrals that earned points)
      const referralCount = await pointService.getReferralCount(userId)

      // Get referral points amount
      const referralPointsResult = await database()
        .select({ value: sum(pointRegistry.amount) })
        .from(pointRegistry)
        .where(
          and(
            eq(pointRegistry.userId, userId),
            eq(pointRegistry.sourceType, 'referral')
          )
        )
      const referralPoints = referralPointsResult[0]?.value || 0

      return Response.json({
        stats: {
          totalPoints,
          feedbackCount,
          feedbackPoints,
          referralCount,
          referralPoints
        }
      })
    } catch (error) {
      console.error('Get user stats error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
