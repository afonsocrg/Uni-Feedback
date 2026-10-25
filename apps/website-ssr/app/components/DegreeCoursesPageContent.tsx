import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { isDiscontinued } from '@uni-feedback/utils'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import type { CrumbUniversity } from '~/utils/breadcrumbs'
import { getDegreePath } from '~/utils/i18n-routes'
import { Breadcrumb } from './common/Breadcrumb'
import { ReportErrorNote } from './common/ReportErrorNote'
import type {
  AcademicTermInfo,
  CourseGroupWithIds
} from './course/courseSections'
import type { CourseWithFeedback } from './course/types'
import { DegreeCoursesBrowser } from './DegreeCoursesBrowser'

/**
 * A degree's course browser page (`/:faculty/:degree/cadeiras`): a compact
 * header (breadcrumb, title, a link back to the degree page) over the full
 * listing. Entry of the course-discovery funnel (`degree_courses_page_viewed`).
 */
export function DegreeCoursesPageContent({
  faculty,
  degree,
  university,
  courses,
  academicTerms,
  courseGroups
}: {
  faculty: Faculty
  degree: Degree
  university: CrumbUniversity | null
  courses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  courseGroups: CourseGroupWithIds[]
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()

  // Keyed on the degree so a client-side move to another degree's courses
  // counts as a new view
  useEffect(() => {
    if (!faculty.slug || !degree.slug) return
    const past = courses.filter((c) => isDiscontinued(c.lastTaughtYear)).length
    analytics.discovery.degreeCoursesPageViewed({
      facultySlug: faculty.slug,
      degreeSlug: degree.slug,
      courseCount: courses.length - past,
      pastCourseCount: past
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty.slug, degree.slug])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb
          surface="degree_courses"
          university={university}
          faculty={faculty}
          degree={degree}
          current={t('courses_page.breadcrumb')}
        />
      </div>
      <section className="py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <header className="mb-5">
              <h1 className="text-xl font-bold leading-tight text-foreground text-balance md:text-2xl">
                {t('courses_page.title', { name: degree.name })}
              </h1>
              {faculty.slug && degree.slug && (
                <Link
                  to={getDegreePath(lang, faculty.slug, degree.slug)}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primaryBlue hover:underline"
                >
                  <ArrowLeft aria-hidden="true" className="size-3.5" />
                  {t('courses_page.back', { acronym: degree.acronym })}
                </Link>
              )}
            </header>

            <DegreeCoursesBrowser
              faculty={faculty}
              degree={degree}
              courses={courses}
              academicTerms={academicTerms}
              courseGroups={courseGroups}
            />

            <div className="mt-8">
              <ReportErrorNote
                surface="degree_courses_page"
                pageName={`${degree.acronym} (${faculty.shortName})`}
                facultySlug={faculty.slug}
                degreeSlug={degree.slug}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
