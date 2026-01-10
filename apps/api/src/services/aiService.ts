import { database } from '@uni-feedback/db'
import { aiCategorizationCache } from '@uni-feedback/db/schema'
import { eq, sql } from 'drizzle-orm'

export interface FeedbackCategories {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
}

/**
 * Normalizes comment text for consistent hashing.
 * - Trims whitespace
 * - Converts to lowercase
 * - Normalizes internal whitespace (multiple spaces/tabs/newlines → single space)
 */
function normalizeComment(comment: string): string {
  return comment.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Generates SHA-256 hash of normalized comment text.
 */
async function hashComment(comment: string): Promise<string> {
  const normalized = normalizeComment(comment)
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
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
   * Checks cache first, only calls OpenRouter API on cache miss.
   *
   * @param comment - The feedback comment to analyze
   * @returns Category flags indicating which topics the feedback discusses
   * @throws Error if API key is not configured, API call fails, or response is invalid
   */
  async categorizeFeedback(comment: string): Promise<FeedbackCategories> {
    // 1. Generate hash for cache lookup
    const commentHash = await hashComment(comment)

    // 2. Check cache
    try {
      const cached = await database()
        .select()
        .from(aiCategorizationCache)
        .where(eq(aiCategorizationCache.commentHash, commentHash))
        .limit(1)

      if (cached.length > 0) {
        const result = cached[0]

        // Update access tracking (fire-and-forget)
        database()
          .update(aiCategorizationCache)
          .set({
            lastAccessedAt: new Date(),
            hitCount: sql`${aiCategorizationCache.hitCount} + 1`
          })
          .where(eq(aiCategorizationCache.commentHash, commentHash))
          .execute()
          .catch((err) => console.warn('Failed to update cache metadata:', err))

        return {
          hasTeaching: result.hasTeaching,
          hasAssessment: result.hasAssessment,
          hasMaterials: result.hasMaterials,
          hasTips: result.hasTips
        }
      }
    } catch (cacheError) {
      console.warn('Cache lookup failed, falling back to API:', cacheError)
    }

    // 3. Cache miss - call OpenRouter API
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
                  'Mentions professor, teaching style, lecture quality and content, engagement, office hours, or responsiveness'
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

    // Validate and construct result
    const categories: FeedbackCategories = {
      hasTeaching: content.hasTeaching ?? false,
      hasAssessment: content.hasAssessment ?? false,
      hasMaterials: content.hasMaterials ?? false,
      hasTips: content.hasTips ?? false
    }

    // 4. Store in cache (fire-and-forget to avoid blocking response)
    database()
      .insert(aiCategorizationCache)
      .values({
        commentHash,
        ...categories,
        hitCount: 0
      })
      .onConflictDoNothing() // Handle race condition where multiple requests insert same hash
      .execute()
      .catch((err) => console.warn('Failed to cache categorization:', err))

    return categories
  }
}
