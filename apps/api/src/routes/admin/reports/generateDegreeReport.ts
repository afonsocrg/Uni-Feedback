import { ReportingService } from '@services'
import { OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const GenerateDegreeReportBodySchema = z.object({
  degreeId: z.number().int().positive(),
  schoolYear: z.number().int().min(2020).max(2030),
  curriculumYear: z.number().int().positive().optional(),
  terms: z.array(z.string()).optional()
})

export class GenerateDegreeReport extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Reports'],
    summary: 'Generate semester PDF report for a degree',
    description:
      'Generates a comprehensive semester PDF report with AI-powered insights across all courses in a degree. Returns a presigned URL to download the PDF.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: GenerateDegreeReportBodySchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Semester report generated successfully',
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
        description: 'Degree not found',
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
    const data = await this.getValidatedData<typeof this.schema>()
    const { degreeId, schoolYear, curriculumYear, terms } = data.body

    const filters = {
      ...(curriculumYear !== undefined ? { curriculumYear } : {}),
      ...(terms !== undefined ? { terms } : {})
    }

    const reportingService = new ReportingService(env)
    const presignedUrl = await reportingService.generateAndStoreDegreeReport(
      degreeId,
      schoolYear,
      Object.keys(filters).length > 0 ? filters : undefined,
      context.user?.id
    )

    return Response.json({
      success: true,
      presignedUrl,
      expiresIn: 3600,
      message: 'Semester report generated successfully'
    })
  }
}
