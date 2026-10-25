import { toOrdinal } from '@uni-feedback/utils'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { ToggleChip } from '../common/ToggleChip'
import { CourseTable } from '../course/CourseTable'
import {
  compareCourses,
  useAvailableCurriculumYears,
  useCourseSections,
  type AcademicTermInfo
} from '../course/courseSections'
import type { CourseWithFeedback } from '../course/types'
import type { DegreeTrack } from './DegreeSections'

/**
 * The degree page's "Plano curricular": a summary of the plan, one curriculum
 * year at a time (the first by default, no "all years" here), with the same
 * course rows as the full browser. Searching, sorting and filtering live on the
 * degree's course page (`/cadeiras`), which the section links to.
 *
 * Degrees with no curriculum years (most mestrados, Nova SBE) show every course
 * grouped by term, with no chips.
 *
 * A summary has to stay short, and some years don't: Nova SBE masters list 150+
 * electives in their one year, IST's GENI 168 courses in its 3rd. So a year
 * shows its mandatory courses and folds the electives into one "N optativas"
 * link to the browser, opened on that year and type. Where courses aren't
 * marked mandatory or optional (null, about half the data), each term is capped
 * to its most reviewed courses (MEIC: 30 in S1), ending in a "Ver mais N
 * cadeiras" link so the cut-down list doesn't read as the whole term. The cap is
 * per term, not per year, so a long term can't crowd out the others.
 *
 * There is no search box here: searching lives on `/cadeiras`, even though on
 * the old degree page 36% of sessions searched
 * (notes/20261023_course_discovery_journeys.md).
 */
/**
 * A term with more courses than this is cut down to this many, the most
 * reviewed. One number, not a "cap at N, show M": that made a 6-course term
 * show 4 next to a 5-course term showing 5.
 */
const MAX_TERM_COURSES = 4

export function DegreePlanSummary({
  offeredCourses,
  academicTerms,
  hasPastCourses,
  track,
  coursesPath
}: {
  offeredCourses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  /** Only courses no longer taught: the browser lists them, not the summary */
  hasPastCourses: boolean
  track: DegreeTrack
  /** The degree's course browser, for the "N optativas" / "other N" links */
  coursesPath: string | null
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const years = useAvailableCurriculumYears(offeredCourses)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const showYears = years.length > 1
  const shownYear = showYears ? (selectedYear ?? years[0]) : null

  const inYear = offeredCourses
    .filter(
      (course) =>
        shownYear === null ||
        course.offerings.some((o) => o.curriculumYear === shownYear)
    )
    .sort(compareCourses('reviews'))
  const optional = inYear.filter((course) => course.isMandatory === false)
  const rest = inYear.filter((course) => course.isMandatory !== false)
  // Only fold electives when something stays listed: a year that is all
  // electives (or a degree that marks every course optional) keeps its list,
  // capped like an unmarked one.
  const foldOptional = optional.length > 0 && rest.length > 0
  const candidates = foldOptional ? rest : inYear
  const linkTo = (type: 'optional' | null) => {
    if (!coursesPath) return null
    const params = new URLSearchParams()
    if (shownYear !== null) params.set('year', String(shownYear))
    if (type) params.set('type', type)
    const query = params.toString()
    return query ? `${coursesPath}?${query}` : coursesPath
  }
  const trackLink = (
    surface: 'plan_section' | 'plan_optional' | 'plan_more'
  ) => {
    if (!track.facultySlug || !track.degreeSlug) return
    analytics.discovery.degreeCoursesCtaClicked({
      facultySlug: track.facultySlug,
      degreeSlug: track.degreeSlug,
      surface,
      curriculumYear: shownYear ?? undefined
    })
  }
  const moreLink = linkTo(null)

  const sections = useCourseSections(
    candidates,
    shownYear,
    null,
    academicTerms
  ).map((section) => {
    if (section.entries.length <= MAX_TERM_COURSES) return section
    // Keep the most reviewed, in the order the section lists them
    const kept = new Set(
      section.entries
        .map((entry) => entry.course)
        .sort(compareCourses('reviews'))
        .slice(0, MAX_TERM_COURSES)
    )
    const hidden = section.entries.length - kept.size
    return {
      ...section,
      entries: section.entries.filter((entry) => kept.has(entry.course)),
      // Says the term goes on, so four rows don't read as the whole semester
      footer: moreLink && (
        <Link
          to={moreLink}
          onClick={() => trackLink('plan_more')}
          className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {t('degree_page.plan_term_more', { count: hidden })}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      )
    }
  })

  const yearLabel =
    shownYear === null ? '' : lang === 'en' ? toOrdinal(shownYear) : shownYear
  const optionalLink = foldOptional ? linkTo('optional') : null

  if (offeredCourses.length === 0) {
    return hasPastCourses ? null : (
      <p className="text-muted-foreground">{t('degree_page.no_courses')}</p>
    )
  }

  return (
    <>
      {/* The whole list sits beside the year chips, where the eye already is
          when picking what to look at; with no chips it still heads the plan */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {showYears && (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('degree_page.year_label')}
          >
            {years.map((year) => (
              <ToggleChip
                key={year}
                label={t('degree_page.year_option', {
                  year: lang === 'en' ? toOrdinal(year) : year
                })}
                isActive={shownYear === year}
                onClick={() => {
                  setSelectedYear(year)
                  if (track.facultySlug && track.degreeSlug) {
                    analytics.discovery.degreePlanYearSelected({
                      facultySlug: track.facultySlug,
                      degreeSlug: track.degreeSlug,
                      curriculumYear: year
                    })
                  }
                }}
              />
            ))}
          </div>
        )}
        {coursesPath && (
          <Link
            to={coursesPath}
            onClick={() => trackLink('plan_section')}
            className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('degree_page.plan_all_courses')}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>
      <CourseTable sections={sections} headingLevel="h3" showExamTag={false} />
      {optionalLink && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          {shownYear === null
            ? t('degree_page.plan_optional_count', { count: optional.length })
            : t('degree_page.plan_optional_more', {
                count: optional.length,
                year: yearLabel
              })}
          <Link
            to={optionalLink}
            onClick={() => trackLink('plan_optional')}
            className="inline-flex items-center gap-1 font-semibold text-primaryBlue hover:underline"
          >
            {t('degree_page.plan_optional_cta')}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </p>
      )}
    </>
  )
}
