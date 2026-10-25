import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { getCurrentSchoolYear, isDiscontinued } from '@uni-feedback/utils'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang, useWorkloadLabel } from '~/hooks'
import { analytics, type DegreeSectionId } from '~/utils/analytics'
import {
  getDegreeAdmissionPath,
  getDegreeCareersPath,
  getDegreeCoursesPath
} from '~/utils/i18n-routes'
import type { Localized } from '~/utils/localizedContent'
import { Breadcrumb } from '.'
import { ReportErrorNote } from './common/ReportErrorNote'
import {
  useAvailableCurriculumYears,
  type AcademicTermInfo
} from './course/courseSections'
import type { CourseWithFeedback } from './course/types'
import { AskChatPrompt } from './degree/AskChatPrompt'
import {
  buildFaq,
  computeHighlights,
  mergeFaq,
  type CuratedFaq
} from './degree/content'
import { DegreePlanSummary } from './degree/DegreePlanSummary'
import {
  AboutSection,
  AdmissionSection,
  CampusSection,
  DegreeHeader,
  FaqSection,
  HighlightsSection,
  OutcomesSection,
  RelatedSection,
  SectionShell,
  type DegreeTrack
} from './degree/DegreeSections'
import { DegreeTocBar, DegreeTocSidebar } from './degree/DegreeToc'
import type { DegreePageExtras } from './degree/pageTypes'
import { useScrollSpy, type TocSection } from './degree/scrollSpy'
import { hasAdmissionPage, hasCareersPage } from './degree/subpages'

interface DegreePageContentProps {
  faculty: Faculty
  degree: Degree
  /** Our reviewed description (markdown) in the page's language */
  /** Reviewed "Sobre o curso" in the page's language, else the Portuguese one */
  about?: Localized<string> | null
  courses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  /** Campus, admission, fees, outcomes and related degrees (v2) */
  extras: DegreePageExtras
  /** Reviewed `degree_faqs` rows in the page's language, by position */
  curatedFaq: CuratedFaq[]
}

/** Types whose admission goes through the Concurso Nacional (DGES) */
const CNA_TYPES = new Set(['bachelor', 'integrated_master'])
/** Types InfoCursos covers */
const INFOCURSOS_TYPES = new Set(['bachelor', 'integrated_master', 'master'])
/** Types we expect a published fee for */
const FEE_TYPES = new Set([
  'bachelor',
  'integrated_master',
  'master',
  'postgraduate'
])

/**
 * The degree page (v2, prds/content_rich_pages.md decision 19): a header of
 * facts, then sections in one server-rendered page (no tabs), each rendered
 * only with data, with a sticky table of contents on the side (a "Nesta
 * página" bar and sheet on phones). The course plan keeps its search, filters
 * and past-courses section exactly as before.
 */
export function DegreePageContent({
  faculty,
  degree,
  about,
  courses,
  academicTerms,
  extras,
  curatedFaq
}: DegreePageContentProps) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
  // A course with `lastTaughtYear` set has left the degree's plan. It keeps its
  // page and its reviews, but listing it among the current courses would tell a
  // newcomer it can still be taken. So it stays out of the filters, the
  // year/term sections and "Other", and gets a collapsed section of its own.
  const { offeredCourses, pastCourses } = useMemo(
    () => ({
      offeredCourses: courses.filter((c) => !isDiscontinued(c.lastTaughtYear)),
      pastCourses: courses.filter((c) => isDiscontinued(c.lastTaughtYear))
    }),
    [courses]
  )

  // The sections that render, in page order. Each needs data (or, for a block
  // we expect, a fallback line inviting a contribution); the table of contents
  // lists exactly these.
  const highlights = useMemo(() => computeHighlights(courses), [courses])
  // Every course has left the plan: the degree is no longer taught. Its real
  // data stays, but nothing asks for what we don't have, and the FAQ asks
  // nothing that implies it is still open.
  const isRetired = offeredCourses.length === 0 && pastCourses.length > 0
  const expectsAdmission = !isRetired && CNA_TYPES.has(degree.type)
  const expectsFees = !isRetired && FEE_TYPES.has(degree.type)
  const expectsOutcomes = !isRetired && INFOCURSOS_TYPES.has(degree.type)
  const showAdmission =
    extras.admissions !== null ||
    extras.fees !== null ||
    expectsAdmission ||
    expectsFees
  const showOutcomes = extras.outcomes !== null || expectsOutcomes
  const faqItems = mergeFaq(
    curatedFaq,
    buildFaq(t, lang, {
      acronym: degree.acronym,
      admissions: extras.admissions,
      fees: extras.fees,
      outcomes: extras.outcomes,
      highlights,
      workloadLabel,
      isRetired
    })
  )

  const tocSections: TocSection[] = [
    ...(about
      ? [{ id: 'sobre' as const, label: t('degree_page.sections.about') }]
      : []),
    { id: 'plano', label: t('degree_page.sections.plan') },
    ...(showAdmission
      ? [
          {
            id: 'ingresso' as const,
            label: t('degree_page.sections.admission')
          }
        ]
      : []),
    ...(showOutcomes
      ? [{ id: 'depois' as const, label: t('degree_page.sections.outcomes') }]
      : []),
    ...(highlights
      ? [
          {
            id: 'destaques' as const,
            label: t('degree_page.sections.highlights_short')
          }
        ]
      : []),
    ...(!isRetired || extras.campuses.length > 0
      ? [{ id: 'campus' as const, label: t('degree_page.sections.campus') }]
      : []),
    ...(faqItems.length > 0
      ? [{ id: 'faq' as const, label: t('degree_page.sections.faq') }]
      : []),
    ...(extras.related.length > 0
      ? [
          {
            id: 'relacionados' as const,
            label: t('degree_page.sections.related')
          }
        ]
      : [])
  ]
  const tocSectionsRef = useRef(tocSections)
  tocSectionsRef.current = tocSections

  const track: DegreeTrack = {
    facultySlug: faculty.slug,
    degreeSlug: degree.slug,
    pageName: `${degree.acronym} (${faculty.shortName})`
  }
  const currentSection = useScrollSpy(tocSections, track)
  const trackTocClick =
    (surface: 'sidebar' | 'mobile_sheet') => (section: DegreeSectionId) => {
      if (!faculty.slug || !degree.slug) return
      analytics.discovery.degreeTocClicked({
        facultySlug: faculty.slug,
        degreeSlug: degree.slug,
        section,
        surface
      })
    }

  // Entry event of the discovery funnel. Keyed on the degree so a client-side
  // navigation to another degree page counts as a new view.
  useEffect(() => {
    if (!faculty.slug || !degree.slug) return

    analytics.discovery.degreePageViewed({
      facultySlug: faculty.slug,
      degreeSlug: degree.slug,
      courseCount: offeredCourses.length,
      pastCourseCount: pastCourses.length,
      sections: tocSectionsRef.current.map((section) => section.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty.slug, degree.slug])

  const totalFeedback = courses.reduce(
    (sum, course) => sum + Number(course.totalFeedbackCount || 0),
    0
  )
  const scopeLabel = degree.acronym

  const coursesPath =
    faculty.slug && degree.slug
      ? getDegreeCoursesPath(lang, faculty.slug, degree.slug)
      : null
  const trackCoursesCta = (surface: 'header') => {
    if (!faculty.slug || !degree.slug) return
    analytics.discovery.degreeCoursesCtaClicked({
      facultySlug: faculty.slug,
      degreeSlug: degree.slug,
      surface
    })
  }
  const availableCurriculumYears = useAvailableCurriculumYears(offeredCourses)

  const plan = (
    <>
      <DegreePlanSummary
        offeredCourses={offeredCourses}
        academicTerms={academicTerms}
        hasPastCourses={pastCourses.length > 0}
        track={track}
        coursesPath={coursesPath}
      />
      {totalFeedback > 0 && (
        <AskChatPrompt
          template="best_courses"
          section="plano"
          question={t('degree_page.ask.best_courses', {
            acronym: degree.acronym
          })}
          degreeId={degree.id}
          scopeLabel={scopeLabel}
        />
      )}
    </>
  )

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb faculty={faculty} degree={degree} />
      </div>

      <DegreeTocBar
        sections={tocSections}
        current={currentSection}
        onNavigate={trackTocClick('mobile_sheet')}
        onOpen={() => {
          if (faculty.slug && degree.slug) {
            analytics.discovery.degreeTocOpened({
              facultySlug: faculty.slug,
              degreeSlug: degree.slug
            })
          }
        }}
      />

      <div className="container mx-auto px-4 pb-16 pt-4 md:pt-6">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
          <div className="min-w-0">
            <DegreeHeader
              degree={degree}
              facultyName={faculty.name}
              universityName={extras.universityName}
              courseCount={offeredCourses.length}
              isRetired={isRetired}
              coursesHref={coursesPath}
              onCoursesClick={() => trackCoursesCta('header')}
            />

            {about && <AboutSection about={about} track={track} />}

            <SectionShell
              id="plano"
              title={t('degree_page.sections.plan')}
              first={!about}
            >
              {plan}
            </SectionShell>

            {showAdmission && (
              <AdmissionSection
                admissions={extras.admissions}
                fees={extras.fees}
                admissionExpected={expectsAdmission}
                feesExpected={expectsFees}
                schoolYear={getCurrentSchoolYear()}
                fullHref={
                  faculty.slug && degree.slug && hasAdmissionPage(degree.type)
                    ? getDegreeAdmissionPath(lang, faculty.slug, degree.slug)
                    : null
                }
                track={track}
              />
            )}

            {showOutcomes && (
              <OutcomesSection
                outcomes={extras.outcomes}
                showFallback={expectsOutcomes}
                fullHref={
                  faculty.slug && degree.slug && hasCareersPage(degree.type)
                    ? getDegreeCareersPath(lang, faculty.slug, degree.slug)
                    : null
                }
                track={track}
              />
            )}

            {highlights && (
              <HighlightsSection
                highlights={highlights}
                prompt={
                  availableCurriculumYears.length > 1 ? (
                    <AskChatPrompt
                      template="heaviest_year"
                      section="destaques"
                      question={t('degree_page.ask.heaviest_year', {
                        acronym: degree.acronym
                      })}
                      degreeId={degree.id}
                      scopeLabel={scopeLabel}
                    />
                  ) : (
                    <AskChatPrompt
                      template="hardest_course"
                      section="destaques"
                      question={t('degree_page.ask.hardest_course', {
                        acronym: degree.acronym
                      })}
                      degreeId={degree.id}
                      scopeLabel={scopeLabel}
                    />
                  )
                }
              />
            )}

            {(!isRetired || extras.campuses.length > 0) && (
              <CampusSection
                campuses={extras.campuses}
                degree={degree}
                showContribute={!isRetired}
                track={track}
              />
            )}

            {faqItems.length > 0 && (
              <FaqSection
                items={faqItems}
                surface="degree_page"
                chatScope={{ degreeId: degree.id, scopeLabel: degree.acronym }}
              />
            )}

            {extras.related.length > 0 && (
              <RelatedSection related={extras.related} track={track} />
            )}

            <div className="mt-12">
              <ReportErrorNote
                surface="degree_page"
                pageName={track.pageName}
                facultySlug={faculty.slug}
                degreeSlug={degree.slug}
              />
            </div>
          </div>

          <aside className="hidden lg:block">
            <DegreeTocSidebar
              sections={tocSections}
              current={currentSection}
              onNavigate={trackTocClick('sidebar')}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
