import { zodResolver } from '@hookform/resolvers/zod'
import {
  editFeedback,
  getFeedbackRecommendations,
  MeicFeedbackAPIError,
  type DuplicateFeedbackDetail,
  type FeedbackRecommendation
} from '@uni-feedback/api-client'
import { database } from '@uni-feedback/db'
import { courses, feedback } from '@uni-feedback/db/schema'
import { and, eq } from 'drizzle-orm'
import type { TFunction } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { redirect, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { SubmitFeedbackSuccess, UpdateFeedbackSuccess } from '~/components'
import { CourseSpecificFeedbackForm } from '~/components/CourseSpecificFeedbackForm'
import { DuplicateFeedbackResolution } from '~/components/feedback/DuplicateFeedbackResolution'
import { useAuth, useLang } from '~/hooks'
import { useSubmitFeedback } from '~/hooks/queries'
import { getCurrentUserId } from '~/lib/auth.server'
import { redirectIfCourseMoved } from '~/lib/courseRedirect.server'
import { analytics, getPageName, toFeedbackEntryPoint } from '~/utils/analytics'
import {
  detectLang,
  getFeedbackEditPath,
  getReviewPath
} from '~/utils/i18n-routes'
import { buildMeta } from '~/utils/meta'

import type { Route } from './+types/course.$courseId.feedback'

// Form schema for feedback submission (reuse from feedback.new.tsx)
const createFeedbackSchema = (t: TFunction<'feedback'>) =>
  z.object({
    // No default in the form: the student must actively assert the year. The
    // giveaway only counts the current year, so a preselected current year would
    // make passivity pay and honesty cost.
    schoolYear: z
      .number({ error: t('form.error_school_year') })
      .min(2000, t('form.error_school_year')),
    courseId: z.number().min(1, 'Course is required'),
    facultyId: z.number().min(1, 'Faculty is required'),
    degreeId: z.number().min(1, 'Degree is required'),
    rating: z.number().min(1, t('form.error_rating')).max(5),
    workloadRating: z.number().min(1, t('form.error_workload')).max(5),
    comment: z.string().optional()
  })

export type FeedbackFormData = z.infer<ReturnType<typeof createFeedbackSchema>>

export function meta({ loaderData, matches }: Route.MetaArgs) {
  if (!loaderData.course) {
    return buildMeta({
      matches,
      title: 'Course Not Found - Uni Feedback',
      description: 'The requested course was not found.',
      // Thin submission form: keep out of the index, but follow links so
      // equity flows to the course detail page.
      robots: 'noindex, follow'
    })
  }

  const { course } = loaderData

  return buildMeta({
    matches,
    title: `Give Feedback for ${course.name} - Uni Feedback`,
    description: `Share your experience with ${course.name} (${course.acronym}) at ${course.degree?.faculty?.shortName ?? ''}. Your anonymous feedback helps fellow students make informed decisions.`,
    // Thin submission form (near-identical across courses): keep out of the
    // index to avoid duplicate/doorway signals and cannibalizing the
    // content-rich course detail page. `follow` preserves link equity.
    robots: 'noindex, follow'
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const courseId = parseInt(params.courseId, 10)
  if (isNaN(courseId)) {
    throw new Response('Invalid course ID', { status: 400 })
  }

  const db = database()

  // If the user is authenticated and already has feedback for this course,
  // redirect them to the edit page directly.
  const userId = await getCurrentUserId(request)
  if (userId) {
    const [existing] = await db
      .select({ id: feedback.id })
      .from(feedback)
      .where(and(eq(feedback.userId, userId), eq(feedback.courseId, courseId)))
      .limit(1)

    if (existing) {
      const lang = detectLang(new URL(request.url).pathname)
      throw redirect(`${getFeedbackEditPath(lang, existing.id)}?redirected=1`)
    }
  }

  // Fetch course with degree and faculty
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      degree: {
        with: {
          faculty: true
        }
      }
    }
  })

  if (!course) await redirectIfCourseMoved(request, courseId)
  if (!course || !course.degree || !course.degree.faculty) {
    throw new Response('Course not found', { status: 404 })
  }

  // TypeScript doesn't narrow the variable type after property null-checks,
  // so we assert the narrowed shape for the component props. `emailSuffixes` is
  // a jsonb column Drizzle types as `unknown`; the whole codebase treats it as
  // `string[]` (see the API's `as string[]` casts), so we assert that here too.
  const narrowedCourse = course as typeof course & {
    degree: NonNullable<(typeof course)['degree']> & {
      faculty: NonNullable<
        NonNullable<(typeof course)['degree']>['faculty']
      > & { emailSuffixes: string[] }
    }
  }

  return { course: narrowedCourse }
}

export default function CourseSpecificFeedbackPage({
  loaderData
}: Route.ComponentProps) {
  const lang = useLang()
  const { course } = loaderData
  const [searchParams] = useSearchParams()
  const submitFeedbackMutation = useSubmitFeedback()
  const { isAuthenticated, user } = useAuth()
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)
  const [isEditSuccess, setIsEditSuccess] = useState(false)
  const [pointsEarned, setPointsEarned] = useState<number | undefined>(
    undefined
  )
  const [referralBonusEarned, setReferralBonusEarned] = useState<number>(0)
  const [submittedCourseId, setSubmittedCourseId] = useState<
    number | undefined
  >(undefined)
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<
    number | undefined
  >(undefined)
  const [duplicateFeedback, setDuplicateFeedback] =
    useState<DuplicateFeedbackDetail | null>(null)
  const [formLoadTime] = useState<number>(() => Date.now())
  const [recommendations, setRecommendations] = useState<
    FeedbackRecommendation[]
  >([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false)

  const { t } = useTranslation('feedback')
  const feedbackSchema = useMemo(() => createFeedbackSchema(t), [t])

  // Create form with course pre-selected
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    // Don't flag a field while it's being filled in: first check on blur, then live.
    mode: 'onTouched',
    defaultValues: {
      // schoolYear is intentionally unset — see createFeedbackSchema.
      courseId: course.id,
      facultyId: course.degree.faculty.id,
      degreeId: course.degree.id,
      rating: 0,
      workloadRating: 0,
      comment: ''
    }
  })

  // Track feedback form view
  useEffect(() => {
    analytics.feedback.formViewed({
      courseId: course.id,
      isAuthenticated,
      entryPoint: toFeedbackEntryPoint(searchParams.get('from'))
    })
  }, [course.id, isAuthenticated, searchParams])

  const submitFeedback = async (values: FeedbackFormData) => {
    try {
      const response = await submitFeedbackMutation.mutateAsync({
        schoolYear: values.schoolYear,
        courseId: values.courseId,
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment
      })

      analytics.feedback.submitted({
        courseId: values.courseId,
        schoolYear: values.schoolYear,
        hasComment: !!values.comment,
        commentLength: values.comment?.length
      })

      setPointsEarned(response.pointsEarned)
      setReferralBonusEarned(response.referralBonusEarned ?? 0)
      setSubmittedCourseId(values.courseId)
      setSubmittedFeedbackId(response.feedbackId)
      toast.success(t('form.toast_submitted'))
      setIsSubmitSuccess(true)

      // Fetch recommendations immediately after successful submission
      if (isAuthenticated) {
        setIsLoadingRecommendations(true)
        try {
          const data = await getFeedbackRecommendations()
          setRecommendations(data.recommendations)
        } catch (err) {
          console.error('Failed to fetch recommendations:', err)
          // Graceful degradation - show success without recommendations
          setRecommendations([])
        } finally {
          setIsLoadingRecommendations(false)
        }
      }
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        if (error.status === 409 && error.data.feedback) {
          setDuplicateFeedback(error.data.feedback)
          toast.info(
            t('form.toast_duplicate_title', {
              courseName: error.data.feedback.course.name
            }),
            { description: t('form.toast_duplicate_desc') }
          )
          analytics.feedback.duplicateShown({
            courseId: values.courseId,
            existingFeedbackId: error.data.feedback.id
          })
          return
        }

        analytics.feedback.failed({
          courseId: values.courseId,
          errorType: error.status === 400 ? 'validation' : 'api_error',
          errorMessage: error.message
        })

        toast.error(error.message)
      } else {
        analytics.feedback.failed({
          courseId: values.courseId,
          errorType: 'network',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })

        console.error('Failed to submit feedback:', error)
        toast.error(t('form.toast_submit_failed'))
      }
      throw error
    }
  }

  const handleSubmit = async (values: FeedbackFormData) => {
    const formCompletionTime = Math.round((Date.now() - formLoadTime) / 1000)
    analytics.feedback.submitClicked({
      courseId: values.courseId,
      formCompletionTime,
      isAuthenticated
    })

    submitFeedback(values)
  }

  const handleEdit = async (values: {
    rating: number
    workloadRating: number
    comment?: string
  }) => {
    if (!duplicateFeedback) {
      console.error('No duplicate feedback to edit')
      return
    }
    try {
      const response = await editFeedback(duplicateFeedback.id, {
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment
      })

      const createdAt = new Date(duplicateFeedback.createdAt)
      const daysSinceOriginal = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      analytics.feedback.existingUpdated({
        feedbackId: duplicateFeedback.id,
        daysSinceOriginal,
        ratingChanged: values.rating !== duplicateFeedback.rating,
        commentChanged: values.comment !== duplicateFeedback.comment
      })

      toast.success(t('edit.toast_updated'))
      setSubmittedCourseId(duplicateFeedback.courseId)
      setSubmittedFeedbackId(duplicateFeedback.id)
      setDuplicateFeedback(null)
      setPointsEarned(response.points)

      // Fetch recommendations immediately after successful edit
      if (isAuthenticated) {
        setIsLoadingRecommendations(true)
        try {
          const data = await getFeedbackRecommendations()
          setRecommendations(data.recommendations)
        } catch (err) {
          console.error('Failed to fetch recommendations:', err)
          // Graceful degradation - show success without recommendations
          setRecommendations([])
        } finally {
          setIsLoadingRecommendations(false)
        }
      }

      setIsEditSuccess(true)
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        toast.error(error.message)
      } else {
        toast.error(t('form.toast_update_failed'))
      }
    }
  }

  const handleSubmitAnother = () => {
    analytics.navigation.feedbackFormLinkClicked({
      source: 'success_modal',
      referrerPage: getPageName(window.location.pathname)
    })

    setIsSubmitSuccess(false)
    setIsEditSuccess(false)
    setPointsEarned(undefined)
    setReferralBonusEarned(0)
    setSubmittedCourseId(undefined)
    setSubmittedFeedbackId(undefined)
    setDuplicateFeedback(null)

    // Redirect to feedback browser to select another course
    window.location.href = getReviewPath(lang)
  }

  // Dev-only: preview the success screen without submitting feedback (which is
  // otherwise the only way to reach it, making the design painful to iterate on).
  // Stripped from production builds via `import.meta.env.DEV`. Toggle branches
  // with query params, e.g.
  //   ?preview=success              -> default (20 pts, 2 recommendations)
  //   ?preview=success&bonus=15     -> show the invite-bonus banner
  //   ?preview=success&recs=0       -> "all reviewed" branch
  if (import.meta.env.DEV && searchParams.get('preview') === 'success') {
    const recCount = Number(searchParams.get('recs') ?? '2')
    const mockRecommendations: FeedbackRecommendation[] = Array.from(
      { length: Math.max(0, recCount) },
      (_, i) => ({
        id: i + 1,
        acronym: `SAMPLE${i + 1}`,
        name: `Sample Course ${i + 1}`
      })
    )
    return (
      <SubmitFeedbackSuccess
        pointsEarned={Number(searchParams.get('points') ?? '20')}
        referralBonusEarned={Number(searchParams.get('bonus') ?? '0')}
        referralCode={user?.referralCode ?? 'PREVIEW1'}
        courseId={course.id}
        recommendations={mockRecommendations}
        isLoadingRecommendations={false}
        // Real handler, so the "choose another course" row is actually
        // clickable in the preview instead of silently doing nothing.
        onSubmitAnother={handleSubmitAnother}
      />
    )
  }

  // Show submit success screen
  if (isSubmitSuccess) {
    return (
      <SubmitFeedbackSuccess
        key={`success-${course.id}`}
        pointsEarned={pointsEarned}
        referralBonusEarned={referralBonusEarned}
        referralCode={user?.referralCode ?? null}
        courseId={submittedCourseId}
        recommendations={recommendations}
        isLoadingRecommendations={isLoadingRecommendations}
        onSubmitAnother={handleSubmitAnother}
      />
    )
  }

  // Show edit success screen
  if (isEditSuccess) {
    return (
      <UpdateFeedbackSuccess
        key={`edit-success-${course.id}`}
        points={pointsEarned}
        courseId={submittedCourseId}
        feedbackId={submittedFeedbackId}
        onSubmitAnother={handleSubmitAnother}
      />
    )
  }

  // Show duplicate feedback resolution screen
  if (duplicateFeedback) {
    return (
      <DuplicateFeedbackResolution
        key={`duplicate-${course.id}`}
        existingFeedback={duplicateFeedback}
        form={form}
        onSubmit={handleEdit}
        onCancel={() => {
          setDuplicateFeedback(null)
        }}
        isSubmitting={submitFeedbackMutation.isPending}
      />
    )
  }

  return (
    <CourseSpecificFeedbackForm
      key={`form-${course.id}`}
      course={course}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={submitFeedbackMutation.isPending}
    />
  )
}
