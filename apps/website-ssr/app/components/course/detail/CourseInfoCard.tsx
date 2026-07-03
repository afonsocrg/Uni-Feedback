import type {
  CorrectionRequestField,
  CourseOffering
} from '@uni-feedback/api-client'
import { Chip, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { Clock, ExternalLink, FileCheck, Star } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CorrectionRequestDialog } from '.'

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
  const averageWorkload = Number(course.averageWorkload) || 0
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false)

  // Distinct academic term names this course is offered in.
  const termNames = Array.from(
    new Set(course.offerings.map((o) => o.academicTerm.name))
  )

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

        {/* Badges, link, and report button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {course.acronym}
          </span>
          {course.ects && (
            <>
              <span className="text-muted-foreground">•</span>
              <Chip label={`${course.ects} ECTS`} size="sm" color="gray" />
            </>
          )}
          {termNames.length > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              {termNames.map((name) => (
                <Chip key={name} label={name} color="gray" size="sm" />
              ))}
            </>
          )}
          {course.url && (
            <>
              <span className="text-muted-foreground">•</span>
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primaryBlue hover:underline inline-flex items-center gap-1"
              >
                {t('info.course_page')}
                <ExternalLink className="size-3" />
              </a>
            </>
          )}
          <span className="text-muted-foreground">•</span>
          <button
            onClick={() => setCorrectionDialogOpen(true)}
            className="text-sm text-muted-foreground hover:text-muted-foreground hover:underline cursor-pointer"
          >
            {t('info.report_incorrect')}
          </button>
        </div>

        {/* Stats Grid - 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {/* Feedback Stat */}
          <div className="flex items-center gap-2">
            <Star className="size-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  {t('info.feedback_label')}
                </span>
                {course.totalFeedbackCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({course.totalFeedbackCount})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {course.totalFeedbackCount === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {t('info.no_reviews')}
                  </span>
                ) : (
                  <>
                    <StarRating
                      value={Number(course.averageRating) || 0}
                      showHalfStars
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      {(Number(course.averageRating) || 0).toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Workload Stat */}
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  {t('info.workload_label')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {averageWorkload ? (
                  <>
                    <WorkloadRatingDisplay
                      rating={averageWorkload}
                      label={
                        (
                          tCommon('workload_ratings', {
                            returnObjects: true
                          }) as string[]
                        )[Math.round(averageWorkload) - 1]
                      }
                    />
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">--</span>
                )}
              </div>
            </div>
          </div>

          {/* Exam Stat */}
          <div className="flex items-center gap-2">
            <FileCheck className="size-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-sm font-medium text-foreground">
                  {t('info.exam_label')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {course.hasMandatoryExam !== null ? (
                  course.hasMandatoryExam ? (
                    <Chip
                      label={t('info.exam_mandatory')}
                      color="red"
                      size="xs"
                    />
                  ) : (
                    <Chip
                      label={t('info.exam_optional')}
                      color="green"
                      size="xs"
                    />
                  )
                ) : (
                  <Chip
                    label={t('info.exam_not_specified')}
                    size="xs"
                    color="gray"
                  />
                )}
              </div>
            </div>
          </div>
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
