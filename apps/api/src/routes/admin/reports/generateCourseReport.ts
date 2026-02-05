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
      'Generates a comprehensive PDF report including AI-powered analysis of student feedback. Returns a PDF file as binary data.',
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
        description: 'PDF report generated successfully (binary data)',
        content: {
          'application/json': {
            schema: z.object({
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

  async handle(request: IRequest, env: any, context: any) {
    try {
      const data = await request.json()
      const validatedBody = GenerateCourseReportBodySchema.parse(data)
      const { courseId, schoolYear } = validatedBody

      const reportService = new CourseReportService(env)
      const pdfBuffer = await reportService.generateReport(courseId, schoolYear)

      // Convert Buffer to Uint8Array for Response
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Report_Course${courseId}_${schoolYear}.pdf"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      })
    } catch (error) {
      console.error('Generate course report error:', error)

      if (error instanceof NotFoundError) {
        return Response.json({ error: error.message }, { status: 404 })
      }

      return Response.json(
        { error: 'Failed to generate report. Please try again later.' },
        { status: 500 }
      )
    }
  }
}
