import type { Teacher } from '@uni-feedback/db/schema'
import { Button, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { formatSchoolYearString } from '@uni-feedback/utils'
import { Mail, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useFetcher, useLocation } from 'react-router'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { CoursePageFeedbackCard } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { useLang } from '~/hooks'
import { getCoursePath } from '~/utils/i18n-routes'

interface TeacherCourse {
  id: number
  name: string
  acronym: string
  degreeName: string | null
  degreeAcronym: string | null
  taughtSchoolYears: number[]
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
}

interface TeacherProfileContentProps {
  teacher: Teacher
  currentCourses: TeacherCourse[]
  pastCourses: TeacherCourse[]
  relevantFeedback: TeacherRelevantFeedback[]
  relevantFeedbackHasMore: boolean
  relevantFeedbackOffset: number
  relevantFeedbackLimit: number
}

interface TeacherRelevantFeedback extends CourseFeedback {
  course: {
    id: number
    name: string
    acronym: string
  }
}

interface TeacherFeedbackPageData {
  relevantFeedback: TeacherRelevantFeedback[]
  relevantFeedbackHasMore: boolean
  relevantFeedbackOffset: number
  relevantFeedbackLimit: number
}

export function TeacherProfileContent({
  teacher,
  currentCourses,
  pastCourses,
  relevantFeedback,
  relevantFeedbackHasMore,
  relevantFeedbackOffset,
  relevantFeedbackLimit
}: TeacherProfileContentProps) {
  const { t } = useTranslation('course')
  const { t: tCommon } = useTranslation('common')
  const lang = useLang()
  const workloadLabels = tCommon('workload_ratings', {
    returnObjects: true
  }) as string[]

  return (
    <main className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primaryBlue/10 text-primaryBlue">
              <UserRound className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">
                {t('teachers.profile_label')}
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-gray-900">
                {teacher.name}
              </h1>

              {teacher.email ? (
                <a
                  href={`mailto:${teacher.email}`}
                  className="mt-4 inline-flex items-center gap-2 text-primaryBlue hover:underline"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {teacher.email}
                </a>
              ) : (
                <p className="mt-4 text-gray-600 italic">
                  {t('teachers.no_email')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <TeacherCoursesSection
            title={t('teachers.current_courses')}
            courses={currentCourses}
            emptyText={t('teachers.no_current_courses')}
            lang={lang}
            workloadLabels={workloadLabels}
          />
          <TeacherCoursesSection
            title={t('teachers.past_courses')}
            courses={pastCourses}
            emptyText={t('teachers.no_past_courses')}
            lang={lang}
            workloadLabels={workloadLabels}
          />
          <TeacherFeedbackSection
            title={t('teachers.relevant_feedback')}
            feedback={relevantFeedback}
            initialHasMore={relevantFeedbackHasMore}
            initialOffset={relevantFeedbackOffset}
            pageSize={relevantFeedbackLimit}
            emptyText={t('teachers.no_relevant_feedback')}
            lang={lang}
          />
        </div>
      </div>
    </main>
  )
}

function TeacherFeedbackSection({
  title,
  feedback,
  initialHasMore,
  initialOffset,
  pageSize,
  emptyText,
  lang
}: {
  title: string
  feedback: TeacherRelevantFeedback[]
  initialHasMore: boolean
  initialOffset: number
  pageSize: number
  emptyText: string
  lang: ReturnType<typeof useLang>
}) {
  const { t } = useTranslation('course')
  const fetcher = useFetcher<TeacherFeedbackPageData>()
  const location = useLocation()
  const [visibleFeedback, setVisibleFeedback] = useState(feedback)
  const [nextOffset, setNextOffset] = useState(initialOffset + feedback.length)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const isLoadingMore = fetcher.state !== 'idle'

  useEffect(() => {
    setVisibleFeedback(feedback)
    setNextOffset(initialOffset + feedback.length)
    setHasMore(initialHasMore)
  }, [feedback, initialHasMore, initialOffset])

  useEffect(() => {
    const pageData = fetcher.data
    if (!pageData) return

    setVisibleFeedback((currentFeedback) => {
      const existingIds = new Set(currentFeedback.map((review) => review.id))
      const newFeedback = pageData.relevantFeedback.filter(
        (review) => !existingIds.has(review.id)
      )

      return [...currentFeedback, ...newFeedback]
    })
    setNextOffset(
      pageData.relevantFeedbackOffset + pageData.relevantFeedback.length
    )
    setHasMore(pageData.relevantFeedbackHasMore)
  }, [fetcher.data])

  const loadMoreFeedback = () => {
    const searchParams = new URLSearchParams(location.search)
    searchParams.set('feedbackOffset', String(nextOffset))
    fetcher.load(`${location.pathname}?${searchParams.toString()}`)
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>

      {visibleFeedback.length > 0 ? (
        <div>
          <div className="space-y-5">
            {visibleFeedback.map((review) => (
              <article key={review.id}>
                <Link
                  to={getCoursePath(lang, review.course.id)}
                  className="mb-3 inline-flex max-w-full flex-wrap items-center gap-1 text-sm font-medium text-primaryBlue hover:underline"
                >
                  <span>{review.course.name}</span>
                  <span className="text-gray-500">
                    ({review.course.acronym})
                  </span>
                  {review.degree?.acronym && (
                    <span className="text-gray-500">
                      - {review.degree.acronym}
                    </span>
                  )}
                </Link>
                <CoursePageFeedbackCard feedback={review} />
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMoreFeedback}
                disabled={isLoadingMore || pageSize <= 0}
              >
                {isLoadingMore
                  ? t('teachers.loading_more_feedback')
                  : t('teachers.load_more_feedback')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600 italic">{emptyText}</p>
      )}
    </section>
  )
}

function TeacherCoursesSection({
  title,
  courses,
  emptyText,
  lang,
  workloadLabels
}: {
  title: string
  courses: TeacherCourse[]
  emptyText: string
  lang: ReturnType<typeof useLang>
  workloadLabels: string[]
}) {
  const { t } = useTranslation('course')

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>

      {courses.length > 0 ? (
        <div className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {courses.map((course) => {
            const schoolYears = formatSchoolYears(course.taughtSchoolYears)

            return (
              <Link
                key={course.id}
                to={getCoursePath(lang, course.id)}
                className="grid gap-4 px-4 py-4 transition-colors hover:bg-gray-50 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {course.name}{' '}
                    <span className="text-gray-500">({course.acronym})</span>
                  </p>
                  {(course.degreeName || course.degreeAcronym) && (
                    <p className="mt-1 text-sm text-gray-600">
                      {course.degreeAcronym && (
                        <span className="font-medium">
                          {course.degreeAcronym}
                        </span>
                      )}
                      {course.degreeAcronym && course.degreeName && ' - '}
                      {course.degreeName}
                    </p>
                  )}
                  {schoolYears && (
                    <p className="mt-1 text-sm text-gray-500">
                      {t('teachers.recorded_years', { years: schoolYears })}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        {t('info.feedback_label')}
                      </span>
                      {course.totalFeedbackCount > 0 && (
                        <span className="text-xs text-gray-400">
                          ({course.totalFeedbackCount})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {course.totalFeedbackCount > 0 ? (
                        <>
                          <StarRating
                            value={Number(course.averageRating) || 0}
                            showHalfStars
                            size="sm"
                          />
                          <span className="text-xs text-gray-400">
                            {(Number(course.averageRating) || 0).toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {t('info.no_reviews')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {t('info.workload_label')}
                    </span>
                    <div className="mt-1">
                      {Number(course.averageWorkload) > 0 ? (
                        <WorkloadRatingDisplay
                          rating={Number(course.averageWorkload)}
                          label={
                            workloadLabels[
                              Math.round(Number(course.averageWorkload)) - 1
                            ]
                          }
                        />
                      ) : (
                        <span className="text-xs text-gray-500">--</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-600 italic">{emptyText}</p>
      )}
    </section>
  )
}

function formatSchoolYears(schoolYears: number[]) {
  return schoolYears
    .map((schoolYear) =>
      formatSchoolYearString(schoolYear, { yearFormat: 'long' })
    )
    .join(', ')
}
