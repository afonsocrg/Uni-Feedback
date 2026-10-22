import { toOrdinal } from '@uni-feedback/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
 */
export function DegreePlanSummary({
  offeredCourses,
  academicTerms,
  hasPastCourses,
  track
}: {
  offeredCourses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  /** Only courses no longer taught: the browser lists them, not the summary */
  hasPastCourses: boolean
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const years = useAvailableCurriculumYears(offeredCourses)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const showYears = years.length > 1
  const shownYear = showYears ? (selectedYear ?? years[0]) : null

  const filtered = offeredCourses
    .filter(
      (course) =>
        shownYear === null ||
        course.offerings.some((o) => o.curriculumYear === shownYear)
    )
    .sort(compareCourses('reviews'))
  const sections = useCourseSections(filtered, shownYear, null, academicTerms)

  if (offeredCourses.length === 0) {
    return hasPastCourses ? null : (
      <p className="text-muted-foreground">{t('degree_page.no_courses')}</p>
    )
  }

  return (
    <>
      {showYears && (
        <div
          className="mb-4 flex flex-wrap gap-2"
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
      <CourseTable sections={sections} headingLevel="h3" />
    </>
  )
}
