import { DatabaseService } from '@services/databaseService'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class GetAdminStats extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Get dashboard statistics',
    responses: {
      '200': {
        description: 'Dashboard statistics',
        content: {
          'application/json': {
            schema: z.object({
              totalUsers: z.number(),
              totalCourses: z.number(),
              totalFeedback: z.number(),
              totalDegrees: z.number(),
              totalFaculties: z.number(),
              recentFeedbackCount: z.number()
            })
          }
        }
      }
    }
  }

  async handle(request: Request, env: any, context: any) {
    try {
      const dbService = new DatabaseService(env)
      
      // Get counts for all entities
      const [
        totalUsers,
        totalCourses, 
        totalFeedback,
        totalDegrees,
        totalFaculties,
        recentFeedbackCount
      ] = await Promise.all([
        dbService.getUserCount(),
        dbService.getCourseCount(),
        dbService.getFeedbackCount(),
        dbService.getDegreeCount(),
        dbService.getFacultyCount(),
        dbService.getRecentFeedbackCount(7) // Last 7 days
      ])

      return Response.json({
        totalUsers,
        totalCourses,
        totalFeedback, 
        totalDegrees,
        totalFaculties,
        recentFeedbackCount
      })
    } catch (error) {
      console.error('Get admin stats error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}