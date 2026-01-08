import { authenticateUser } from '@middleware'
import { AIService, PointService } from '@services'
import { sendCourseReviewReceived } from '@services/telegram'
import { database } from '@uni-feedback/db'
import {
  courses,
  degrees,
  faculties,
  feedback,
  feedbackAnalysis,
  users
} from '@uni-feedback/db/schema'
import { countWords, getCurrentSchoolYear } from '@uni-feedback/utils'
import { contentJson, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { BusinessLogicError, NotFoundError, withErrorHandling } from '../utils'

const FeedbackRequestSchema = z
  .object({
    schoolYear: z.number().int(),
    rating: z.number().int().min(1).max(5),
    workloadRating: z.number().int().min(1).max(5),
    comment: z.string().optional()
  })
  .strict()

export class SubmitFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Feedback', 'Courses'],
    summary: 'Submit feedback about a course',
    description: 'Submit feedback about a course',
    request: {
      params: z.object({
        id: z.number()
      }),
      body: contentJson(FeedbackRequestSchema)
    },
    responses: {
      '201': {
        description: 'Feedback submitted successfully'
      },
      '400': {
        description: 'Invalid input data'
      },
      '404': {
        description: 'Course not found'
      }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      const courseId = parseInt(request.params.id)
      const { body } = await this.getValidatedData<typeof this.schema>()

      // Authenticate user (required for feedback submission)
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck

      // Use authenticated user's info
      const userId = context.user.id
      const email = context.user.email

      // Validate school year
      const currentSchoolYear = getCurrentSchoolYear()
      if (body.schoolYear > currentSchoolYear) {
        throw new BusinessLogicError(
          'Cannot submit feedback for a future school year'
        )
      }

      // Check if course exists
      const courseResult = await database()
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1)

      if (courseResult.length === 0) {
        throw new NotFoundError('Course not found')
      }
      const course = courseResult[0]

      if (!course.degreeId) {
        throw new NotFoundError('Course has no associated degree')
      }

      const degreeResult = await database()
        .select()
        .from(degrees)
        .where(eq(degrees.id, course.degreeId))
        .limit(1)

      if (degreeResult.length === 0) {
        throw new NotFoundError('Degree not found')
      }
      const degree = degreeResult[0]

      // Fetch faculty to validate email suffix
      if (!degree.facultyId) {
        throw new NotFoundError('Degree has no associated faculty')
      }

      const facultyResult = await database()
        .select()
        .from(faculties)
        .where(eq(faculties.id, degree.facultyId))
        .limit(1)

      if (facultyResult.length === 0) {
        throw new NotFoundError('Faculty not found')
      }
      const faculty = facultyResult[0]

      // Validate email suffix if faculty has restrictions (controlled by feature flag)
      const validateEmailSuffix = env.VALIDATE_EMAIL_SUFFIX
      if (
        validateEmailSuffix &&
        faculty.emailSuffixes &&
        Array.isArray(faculty.emailSuffixes) &&
        faculty.emailSuffixes.length > 0
      ) {
        const emailDomain = email.split('@')[1]?.toLowerCase()
        const emailSuffixes = faculty.emailSuffixes as string[]
        const isValidDomain = emailSuffixes.some(
          (suffix: string) => emailDomain === suffix.toLowerCase()
        )

        if (!isValidDomain) {
          const suffixesWithAt = emailSuffixes.map((suffix) => `@${suffix}`)
          const errorMessage =
            suffixesWithAt.length === 1
              ? `Email must end with ${suffixesWithAt[0]}`
              : `Email must end with one of: ${suffixesWithAt.join(', ')}`

          throw new BusinessLogicError(errorMessage)
        }
      }

      // Ignore empty comments
      const comment = body.comment?.trim() || null

      // Insert feedback
      const feedbackData = {
        userId: userId,
        email: userId === null ? email : null,
        schoolYear: body.schoolYear,
        courseId: courseId,
        rating: body.rating,
        workloadRating: body.workloadRating,
        comment: comment,
        originalComment: comment,
        approvedAt: new Date('1999-12-16T04:30:00.000Z') // Auto-approved marker (birthday easter egg!) Dec 16, 1999 04:30 UTC
      }

      const insertResult = await database()
        .insert(feedback)
        .values(feedbackData)
        .returning()

      if (!insertResult || insertResult.length === 0 || !insertResult[0].id) {
        throw new Error('Failed to insert feedback into database')
      }

      const feedbackId = insertResult[0].id

      // Award points for feedback submission (best-effort)
      let feedbackPoints = 0
      try {
        const pointService = new PointService(env)

        // 1. Analyze comment with AI (fallback to conservative defaults on error)
        let analysis
        if (comment) {
          const aiService = new AIService(env)
          try {
            const categories = await aiService.categorizeFeedback(comment)
            const wordCount = countWords(comment)
            analysis = { ...categories, wordCount }
          } catch (aiError) {
            console.warn(
              'AI categorization failed, using conservative defaults:',
              aiError
            )
            analysis = {
              hasTeaching: false,
              hasAssessment: false,
              hasMaterials: false,
              hasTips: false,
              wordCount: countWords(comment)
            }
          }
        } else {
          analysis = {
            hasTeaching: false,
            hasAssessment: false,
            hasMaterials: false,
            hasTips: false,
            wordCount: 0
          }
        }

        // 2. Insert analysis record
        await database()
          .insert(feedbackAnalysis)
          .values({
            feedbackId,
            ...analysis
          })

        // 3. Calculate and award feedback points
        feedbackPoints = pointService.calculateFeedbackPoints(analysis)
        if (feedbackPoints > 0) {
          await pointService.awardFeedbackPoints(
            userId,
            feedbackId,
            feedbackPoints
          )
        }

        // 4. Check for referral bonus (first feedback only)
        const isFirstFeedback = await pointService.isUserFirstFeedback(
          userId,
          feedbackId
        )
        if (isFirstFeedback) {
          const [user] = await database()
            .select({ referredByUserId: users.referredByUserId })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

          if (user?.referredByUserId) {
            const alreadyAwarded =
              await pointService.hasReceivedReferralPointsFor(
                user.referredByUserId,
                userId
              )

            if (!alreadyAwarded) {
              const referralCount = await pointService.getReferralCount(
                user.referredByUserId
              )
              const referralPoints =
                pointService.calculateReferralPoints(referralCount)
              await pointService.awardReferralPoints(
                user.referredByUserId,
                userId,
                referralPoints
              )
            }
          }
        }
      } catch (pointError) {
        console.error(
          'Failed to award points for feedback:',
          feedbackId,
          pointError
        )
        // Continue - feedback was saved, points can be fixed later
      }

      await sendCourseReviewReceived(env, {
        id: feedbackId,
        email: email,
        schoolYear: body.schoolYear,
        degree,
        rating: body.rating,
        workloadRating: body.workloadRating,
        course: {
          ...course,
          terms: course.terms as string[] | null
        },
        comment
      })

      return Response.json(
        {
          message: 'Feedback submitted successfully',
          pointsEarned: feedbackPoints
        },
        { status: 201 }
      )
    })
  }
}
