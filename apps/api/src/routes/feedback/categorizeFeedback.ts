import { AIService } from '@services'
import { contentJson, OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { withErrorHandling } from '../utils'

const CategorizeFeedbackRequestSchema = z
  .object({
    comment: z.string()
  })
  .strict()

export class CategorizeFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Feedback'],
    summary: 'Categorize feedback comment (preview)',
    description:
      'Analyze a feedback comment and return category flags without storing in database. Used for real-time categorization while writing feedback.',
    request: {
      body: contentJson(CategorizeFeedbackRequestSchema)
    },
    responses: {
      '200': {
        description: 'Comment categorized successfully',
        content: {
          'application/json': {
            schema: z.object({
              categories: z.object({
                hasTeaching: z.boolean(),
                hasAssessment: z.boolean(),
                hasMaterials: z.boolean(),
                hasTips: z.boolean()
              })
            })
          }
        }
      },
      '400': {
        description: 'Invalid input data (comment too short or missing)'
      },
      '401': {
        description: 'Authentication required'
      },
      '500': {
        description: 'AI service error'
      }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      // Authenticate user (required to prevent abuse)
      // const authCheck = await authenticateUser(request, env, context)
      // if (authCheck) return authCheck

      // Get validated request body
      const { body } = await this.getValidatedData<typeof this.schema>()

      // Validate minimum character count
      // if (body.comment.length < 50) {
      //   throw new BusinessLogicError(
      //     'Comment must be at least 50 characters for categorization'
      //   )
      // }

      // Call AI service to categorize feedback
      const aiService = new AIService(env)
      const categories = await aiService.categorizeFeedback(body.comment)

      // Return categories without storing in database
      return Response.json(
        {
          categories
        },
        { status: 200 }
      )
    })
  }
}
