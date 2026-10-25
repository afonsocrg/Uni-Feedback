import type { CourseOffering } from '@uni-feedback/api-client'
import type { Course } from '@uni-feedback/db/schema'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  Breadcrumb,
  CourseAssessment,
  CourseBibliography,
  CourseDescription,
  CourseInfoCard
} from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { analytics, type CourseSectionId } from '~/utils/analytics'
import type { CrumbUniversity } from '~/utils/breadcrumbs'
import { COURSE_SECTION_IDS, CourseReviews, type CourseContentField } from '.'
import { DegreeTocBar, DegreeTocSidebar } from '../../degree/DegreeToc'
import {
  scrollToSection,
  useScrollSpy,
  type TocSection
} from '../../degree/scrollSpy'

export interface CourseDetail extends Course {
  offerings: CourseOffering[]
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
    slug: string | null
  } | null
  faculty?: {
    id: number
    name: string
    shortName: string
    slug: string | null
    logo: string | null
  } | null
  university?: CrumbUniversity | null
}

interface CourseDetailContentProps {
  course: CourseDetail
  feedback: CourseFeedback[]
}

const CONTENT_SECTIONS: Partial<Record<CourseSectionId, CourseContentField>> = {
  sobre: 'description',
  avaliacao: 'assessment',
  bibliografia: 'bibliography'
}

/**
 * The course page, laid out like the degree page (since 2026-10-25, when it
 * replaced tabs): a header of facts and stats, then every section in one
 * server-rendered page, with a sticky table of contents on the side (a "Nesta
 * página" bar and sheet on phones). Having every section in the HTML is also
 * what lets search engines read the assessment and bibliography.
 */
export function CourseDetailContent({
  course,
  feedback
}: CourseDetailContentProps) {
  const { t } = useTranslation('course')
  const { t: tBrowse } = useTranslation('browse')
  const [params] = useSearchParams()

  /**
   * A deep link asking for one field's correction editor.
   *
   * Comes from a chat answer that reported the field as missing. Validated
   * against the fields that actually have a section, so a hand-typed value
   * opens nothing.
   */
  const requested = params.get('correct')
  const correctField = (
    ['description', 'assessment', 'bibliography'] as const
  ).find((field) => field === requested)

  const sections: TocSection<CourseSectionId>[] = [
    { id: COURSE_SECTION_IDS.feedback, label: t('sections.feedback') },
    { id: COURSE_SECTION_IDS.description, label: t('sections.description') },
    { id: COURSE_SECTION_IDS.assessment, label: t('sections.assessment') },
    { id: COURSE_SECTION_IDS.bibliography, label: t('sections.bibliography') }
  ]
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  // Entry event. Keyed on the course so a client-side navigation to another
  // course counts as a new view.
  useEffect(() => {
    analytics.course.pageViewed({
      courseId: course.id,
      feedbackCount: feedback.length,
      sections: sectionsRef.current.map((section) => section.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id])

  // The editor a `?correct=` link asks for opens over its section
  useEffect(() => {
    if (correctField) scrollToSection(COURSE_SECTION_IDS[correctField])
  }, [correctField])

  const current = useScrollSpy<CourseSectionId>(
    sections,
    { facultySlug: course.faculty?.slug ?? null, degreeSlug: null },
    (section) => {
      analytics.course.sectionViewed({ courseId: course.id, section })
      // The contribution funnel's denominator: its prompt was seen
      const field = CONTENT_SECTIONS[section]
      if (field) {
        analytics.correction.contributePromptViewed({
          courseId: course.id,
          field,
          hasExistingContent: Boolean(course[field]?.trim())
        })
      }
    }
  )
  const onToc =
    (surface: 'sidebar' | 'mobile_sheet') => (section: CourseSectionId) =>
      analytics.course.tocClicked({ courseId: course.id, section, surface })

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb
          surface="course"
          university={course.university}
          faculty={course.faculty}
          degree={course.degree}
          courses={tBrowse('courses_page.breadcrumb')}
          current={course.acronym || course.name}
          currentName={course.name}
        />
      </div>

      <DegreeTocBar<CourseSectionId>
        sections={sections}
        current={current}
        onNavigate={onToc('mobile_sheet')}
        onOpen={() => analytics.course.tocOpened({ courseId: course.id })}
      />

      <div className="container mx-auto px-4 pb-16 pt-4 md:pt-6">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
          <div className="min-w-0">
            <CourseInfoCard course={course} />

            <CourseReviews course={course} feedback={feedback} />
            <CourseDescription
              course={course}
              autoOpen={correctField === 'description'}
            />
            <CourseAssessment
              course={course}
              autoOpen={correctField === 'assessment'}
            />
            <CourseBibliography
              course={course}
              autoOpen={correctField === 'bibliography'}
            />
          </div>

          <aside className="hidden lg:block">
            <DegreeTocSidebar<CourseSectionId>
              sections={sections}
              current={current}
              onNavigate={onToc('sidebar')}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
