import { CourseReportService } from '@services'
import { NotFoundError } from '@services/errors'
import { OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const GenerateCourseReportBodySchema = z.object({
  courseId: z.number().int().positive(),
  schoolYear: z.number().int().min(2020).max(2030)
})

export class GenerateCourseReport extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Reports'],
    summary: 'Generate PDF report for a course',
    description:
      'Generates a comprehensive PDF report including AI-powered analysis of student feedback. Returns a presigned URL to download the PDF. Uses R2 caching for cost optimization.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: GenerateCourseReportBodySchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'PDF report generated successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              presignedUrl: z.string(),
              expiresIn: z.number(),
              message: z.string()
            })
          }
        }
      },
      '404': {
        description: 'Course not found',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '409': {
        description: 'Report generation already in progress',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '500': {
        description: 'Report generation failed',
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
      const data = await request.json()
      const validatedBody = GenerateCourseReportBodySchema.parse(data)
      const { courseId, schoolYear } = validatedBody

      const reportService = new CourseReportService(env)
      const presignedUrl = await reportService.generateReportWithCache(
        courseId,
        schoolYear
        // true
      )

      return Response.json({
        success: true,
        presignedUrl: presignedUrl,
        expiresIn: 3600,
        message: 'Report generated successfully'
      })
    } catch (error: any) {
      console.error('Generate course report error:', error)

      if (error instanceof NotFoundError) {
        return Response.json({ error: error.message }, { status: 404 })
      }

      // Handle race condition (409 Conflict)
      if (error.message && error.message.includes('already in progress')) {
        return Response.json(
          {
            error:
              'Report generation already in progress. Please try again in a few moments.'
          },
          { status: 409 }
        )
      }

      return Response.json(
        { error: 'Failed to generate report. Please try again later.' },
        { status: 500 }
      )
    }
  }
}
