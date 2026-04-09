import { StatsService } from '@services'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

const RefreshStatsResponseSchema = z.object({
  success: z.boolean(),
  coursesUpdated: z.number(),
  degreesUpdated: z.number(),
  refreshedAt: z.string()
})

export class RefreshStats extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Stats'],
    summary: 'Refresh all statistics',
    description:
      'Refreshes all course and degree statistics. This endpoint is designed to be called by a cron job every 5 minutes.',
    responses: {
      '200': {
        description: 'Statistics refreshed successfully',
        content: {
          'application/json': {
            schema: RefreshStatsResponseSchema
          }
        }
      },
      '500': {
        description: 'Stats refresh failed',
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

  async handle() {
    const statsService = new StatsService()
    const result = await statsService.refreshAllStats()

    return Response.json({
      success: true,
      coursesUpdated: result.coursesUpdated,
      degreesUpdated: result.degreesUpdated,
      refreshedAt: new Date().toISOString()
    })
  }
}
