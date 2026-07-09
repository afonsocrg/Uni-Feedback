import type {
  CorrectionRequestField,
  CourseOffering
} from '@uni-feedback/api-client'
import {
  Button,
  Chip,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { Clock, ExternalLink, Flag, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getCourseFeedbackPath } from '~/utils/i18n-routes'
import { CorrectionRequestDialog, FeedbackHistogram } from '.'

export interface CourseInfoCardProps {
  course: {
    id: number
    name: string
    acronym: string
    url?: string | null
    description?: string | null
    assessment?: string | null
    bibliography?: string | null
    offerings: CourseOffering[]
    ects?: number | null
    hasMandatoryExam?: boolean | null
    averageRating: number
    averageWorkload: number
    totalFeedbackCount: number
    /** Feedback counts per value, index 0 = value 1 … index 4 = value 5. */
    ratingDistribution: number[]
    workloadDistribution: number[]
    degree?: {
      id: number
      name: string
      acronym: string
      faculty?: {
        id: number
        name: string
        shortName: string
      }
    } | null
  }
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  const { t } = useTranslation('course')
  const { t: tCommon } = useTranslation('common')
  const lang = useLang()
  const averageWorkload = Number(course.averageWorkload) || 0
  const averageRating = Number(course.averageRating) || 0
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false)

  // `course_reviews` names the funnel step, not this component: the primary CTA
  // moved up here from <CourseReviews>, and it is still the same step. Renaming
  // it would strand the history on `feedback_form_viewed.entry_point`, and any
  // value outside FeedbackEntryPoint silently degrades to `direct`.
  const reviewFormUrl = useMemo(
    () => `${getCourseFeedbackPath(lang, course.id)}?from=course_reviews`,
    [lang, course.id]
  )

  const workloadLabels = tCommon('workload_ratings', {
    returnObjects: true
  }) as string[]

  // Distributions are indexed by value - 1; both histograms read best-to-worst,
  // so 5 stars and "very light" end up on top.
  const ratingRows = [5, 4, 3, 2, 1].map((value) => ({
    label: String(value),
    count: course.ratingDistribution[value - 1] ?? 0
  }))
  const workloadRows = [5, 4, 3, 2, 1].map((value) => ({
    label: workloadLabels[value - 1],
    count: course.workloadDistribution[value - 1] ?? 0
  }))

  // Workload is optional on a feedback, so it can trail the review count.
  const workloadCount = course.workloadDistribution.reduce((a, b) => a + b, 0)
  const hasFeedback = course.totalFeedbackCount > 0

  // Distinct academic term names this course is offered in.
  const termNames = Array.from(
    new Set(course.offerings.map((o) => o.academicTerm.name))
  )

  const examChip =
    course.hasMandatoryExam === null || course.hasMandatoryExam === undefined
      ? { label: t('info.exam_not_specified'), color: 'gray' as const }
      : course.hasMandatoryExam
        ? { label: t('info.exam_mandatory'), color: 'red' as const }
        : { label: t('info.exam_optional'), color: 'green' as const }

  const getCurrentValue = (
    field: CorrectionRequestField
  ): string | undefined => {
    switch (field) {
      case 'name':
        return course.name
      case 'acronym':
        return course.acronym
      case 'ects':
        return course.ects?.toString()
      case 'terms':
        return termNames.length > 0 ? termNames.join(', ') : undefined
      case 'url':
        return course.url ?? undefined
      case 'has_mandatory_exam':
        return course.hasMandatoryExam?.toString()
      case 'description':
        return course.description ?? undefined
      case 'assessment':
        return course.assessment ?? undefined
      case 'bibliography':
        return course.bibliography ?? undefined
      default:
        return undefined
    }
  }

  return (
    <div className="mb-12">
      {/* Hero Section */}
      <div className="space-y-3">
        {/* Course Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-primaryBlue leading-tight">
          {course.name}
        </h1>

        {/* Identity and actions */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground font-medium">
            {course.acronym}
          </span>
          {course.url && (
            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primaryBlue hover:underline inline-flex items-center gap-1.5"
            >
              {t('info.course_page')}
              <ExternalLink className="size-3.5" />
            </a>
          )}
          <button
            onClick={() => {
              analytics.correction.dialogOpened({ courseId: course.id })
              setCorrectionDialogOpen(true)
            }}
            className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer inline-flex items-center gap-1.5"
          >
            <Flag className="size-3.5" />
            {t('info.suggest_correction')}
          </button>
        </div>

        {/* Course facts */}
        <div className="flex flex-wrap items-center gap-2">
          {course.ects && (
            <Chip label={`${course.ects} ECTS`} size="sm" color="gray" />
          )}
          {termNames.map((name) => (
            <Chip key={name} label={name} color="gray" size="sm" />
          ))}
          <Chip
            label={`${t('info.exam_label')}: ${examChip.label}`}
            color={examChip.color}
            size="sm"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-6">
          {/* Feedback Stat */}
          <div className="flex items-start gap-2">
            <Star className="size-5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">
                {t('info.overall_label')}
              </div>
              {hasFeedback ? (
                <div className="flex items-center gap-4 mt-2">
                  <FeedbackHistogram
                    rows={ratingRows}
                    labelClassName="w-2 text-right"
                    className="flex-1 min-w-0"
                  />
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-24">
                    <span className="text-3xl font-semibold leading-none tabular-nums">
                      {averageRating.toFixed(1)}
                    </span>
                    <StarRating value={averageRating} showHalfStars size="sm" />
                    <span className="text-[11px] text-muted-foreground">
                      {t('info.ratings_count', {
                        count: course.totalFeedbackCount
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('info.no_reviews')}
                </span>
              )}
            </div>
          </div>

          {/* Workload Stat */}
          <div className="flex items-start gap-2">
            <Clock className="size-5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">
                {t('info.workload_label')}
              </div>
              {averageWorkload ? (
                <div className="flex items-center gap-4 mt-2">
                  <FeedbackHistogram
                    rows={workloadRows}
                    labelClassName="w-[4.5rem]"
                    className="flex-1 min-w-0"
                  />
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-24">
                    <WorkloadRatingDisplay
                      rating={averageWorkload}
                      label={workloadLabels[Math.round(averageWorkload) - 1]}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {t('info.ratings_count', { count: workloadCount })}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">--</span>
              )}
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-6">
          <Button asChild className="text-white max-sm:w-full">
            <Link
              to={reviewFormUrl}
              onClick={() => {
                // Same historical name as `?from=course_reviews` above.
                analytics.navigation.feedbackFormLinkClicked({
                  source: 'course_page_cta',
                  referrerPage: getPageName(window.location.pathname),
                  courseId: course.id
                })
              }}
            >
              {t('reviews.give_feedback')}
            </Link>
          </Button>
        </div>
      </div>

      <CorrectionRequestDialog
        courseId={course.id}
        courseName={course.name}
        getCurrentValue={getCurrentValue}
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
      />
    </div>
  )
}
