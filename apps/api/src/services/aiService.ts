export interface FeedbackCategories {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
}

/**
 * AIService handles all AI-powered operations using OpenRouter.
 * Currently supports feedback categorization with openai/gpt-4o-mini.
 */
export class AIService {
  private env: Env
  private apiKey: string | null

  constructor(env: Env) {
    this.env = env
    this.apiKey = env.OPENROUTER_API_KEY || null
  }

  /**
   * Makes an API call to OpenRouter with proper headers and error handling.
   *
   * @param payload - The request payload for OpenRouter API
   * @returns The parsed JSON response from OpenRouter
   * @throws Error if API key is not configured or API call fails
   */
  private async callOpenRouter(payload: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.env.WEBSITE_URL,
          'X-Title': 'Uni Feedback'
        },
        body: JSON.stringify(payload)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return await response.json()
  }

  /**
   * Categorize student feedback into predefined categories using AI.
   *
   * @param comment - The feedback comment to analyze
   * @returns Category flags indicating which topics the feedback discusses
   * @throws Error if API key is not configured, API call fails, or response is invalid
   */
  async categorizeFeedback(comment: string): Promise<FeedbackCategories> {
    const payload = {
      model: '@preset/uni-feedback-fast',
      messages: [
        {
          role: 'system',
          content:
            'You are a feedback analyzer that categorizes student course reviews into specific topics: teaching quality, assessment methods, study materials, and course tips.'
        },
        {
          role: 'user',
          content: `Analyze this course feedback and determine which categories it discusses:\n\n${comment}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'feedback_categorization',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              hasTeaching: {
                type: 'boolean',
                description:
                  'Mentions professor, teaching style, lecture quality, engagement, office hours, or responsiveness'
              },
              hasAssessment: {
                type: 'boolean',
                description:
                  'Mentions grading, exams, projects, fairness, deadlines, workload, or difficulty of tests'
              },
              hasMaterials: {
                type: 'boolean',
                description:
                  'Mentions slides, textbooks, past exams, practice exercises, or specific study resources'
              },
              hasTips: {
                type: 'boolean',
                description:
                  'Mentions specific advice for future students, insider tips, or things to know before starting'
              }
            },
            required: [
              'hasTeaching',
              'hasAssessment',
              'hasMaterials',
              'hasTips'
            ],
            additionalProperties: false
          }
        }
      }
    }

    const data = await this.callOpenRouter(payload)

    // Parse the structured output from the AI response
    if (!data.choices?.[0]?.message?.content) {
      throw new Error(
        `OpenRouter API returned unexpected response format: ${JSON.stringify(data)}`
      )
    }

    const content = JSON.parse(data.choices[0].message.content)

    // Validate and return with fallback for missing fields
    return {
      hasTeaching: content.hasTeaching ?? false,
      hasAssessment: content.hasAssessment ?? false,
      hasMaterials: content.hasMaterials ?? false,
      hasTips: content.hasTips ?? false
    }
  }
}
