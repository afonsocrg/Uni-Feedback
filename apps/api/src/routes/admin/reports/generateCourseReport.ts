import { ReportingService } from '@services'
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
      'Generates a comprehensive PDF report including AI-powered analysis of student feedback. Returns a presigned URL to download the PDF.',
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

  async handle(request: IRequest, env: Env, context: RequestContext) {
    const data = await request.json()
    const validatedBody = GenerateCourseReportBodySchema.parse(data)
    const { courseId, schoolYear } = validatedBody

    const reportingService = new ReportingService(env)
    const presignedUrl = await reportingService.generateAndStoreCourseReport(
      courseId,
      schoolYear,
      context.user?.id
    )

    return Response.json({
      success: true,
      presignedUrl,
      expiresIn: 3600,
      message: 'Report generated successfully'
    })
  }
}
