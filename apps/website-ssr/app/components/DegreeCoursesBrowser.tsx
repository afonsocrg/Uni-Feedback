import type { Degree, Faculty } from '@uni-feedback/db/schema'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@uni-feedback/ui'
import { isDiscontinued, toOrdinal } from '@uni-feedback/utils'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce, useLang } from '~/hooks'
import { insensitiveMatch } from '~/utils'
import { analytics } from '~/utils/analytics'
import { loadCourseFilters, saveCourseFilters } from '~/utils/filterStorage'
import { AskChatButton } from './chat/AskChatButton'
import { FilterChip } from './common/FilterChip'
import { FilterRow } from './common/FilterRow'
import { MissingItemNote } from './common/MissingItemNote'
import { SearchInput } from './common/SearchInput'
import { ToggleChip } from './common/ToggleChip'
import { CourseTable } from './course/CourseTable'
import {
  compareCourses,
  useAvailableCurriculumYears,
  useCourseSections,
  type AcademicTermInfo,
  type CourseGroupWithIds,
  type SortOption
} from './course/courseSections'
import type { CourseWithFeedback } from './course/types'

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

/**
 * The full course browser of a degree (`/:faculty/:degree/cadeiras`): search,
 * sort, one year at a time (or all), term, group, mandatory and exam filters,
 * persisted per degree (filterStorage), and the collapsed section of courses no
 * longer taught. This is the degree page's listing from before v2, moved here
 * when the degree page became "learn about the degree".
 */
export function DegreeCoursesBrowser({
  faculty,
  degree,
  courses,
  academicTerms,
  courseGroups
}: {
  faculty: Faculty
  degree: Degree
  courses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  courseGroups: CourseGroupWithIds[]
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const [searchQuery, setSearchQuery] = useState('')
  // undefined = nothing chosen yet: the plan opens on its first year. null = all years.
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<
    number | null | undefined
  >(undefined)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<
    number | null
  >(null)
  const [mandatoryExamFilter, setMandatoryExamFilter] = useState<
    boolean | null
  >(null)
  const [courseTypeFilter, setCourseTypeFilter] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('reviews')
  // null until the student opens or closes it: the section then follows the
  // search, open while the query matches a course no longer taught
  const [pastExpandedByUser, setPastExpandedByUser] = useState<boolean | null>(
    null
  )

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

  // Load filters from localStorage on mount (only if faculty and degree match)
  useEffect(() => {
    if (!faculty.slug || !degree.slug) return

    const savedFilters = loadCourseFilters(faculty.slug, degree.slug)
    if (savedFilters) {
      setSelectedCurriculumYear(savedFilters.curriculumYear ?? undefined)
      setSelectedTerm(savedFilters.term)
      setSelectedCourseGroupId(savedFilters.courseGroupId)
      setMandatoryExamFilter(savedFilters.hasMandatoryExam)
      // Filters saved before this option existed have no `isMandatory` key.
      setCourseTypeFilter(savedFilters.isMandatory ?? null)
      setSortBy(savedFilters.sortBy as SortOption)
    }
  }, [faculty.slug, degree.slug])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (!faculty.slug || !degree.slug) return

    saveCourseFilters(faculty.slug, degree.slug, {
      curriculumYear: selectedCurriculumYear ?? null,
      term: selectedTerm,
      courseGroupId: selectedCourseGroupId,
      hasMandatoryExam: mandatoryExamFilter,
      isMandatory: courseTypeFilter,
      sortBy
    })
  }, [
    faculty.slug,
    degree.slug,
    selectedCurriculumYear,
    selectedTerm,
    selectedCourseGroupId,
    mandatoryExamFilter,
    courseTypeFilter,
    sortBy
  ])

  // Available curriculum years for filtering (from offerings)
  const availableCurriculumYears = useAvailableCurriculumYears(offeredCourses)

  // Available academic term names for filtering (from offerings)
  const availableTerms = useMemo(() => {
    const terms = new Set<string>()
    offeredCourses.forEach((course) => {
      course.offerings.forEach((offering) => {
        terms.add(offering.academicTerm.name)
      })
    })
    return Array.from(terms).sort()
  }, [offeredCourses])

  // A property every course answers the same way makes for a chip that can only
  // be a no-op or a way to empty the list, so it stays hidden. "Unknown" counts
  // as an answer of its own: a degree split between mandatory and unset courses
  // can still be narrowed, one where every course is mandatory cannot.
  //
  // Read off the whole course set, never `filteredCourses`, so chips don't
  // disappear as the list narrows and take their own selection with them.
  const showExamFilter = useMemo(
    () =>
      new Set(offeredCourses.map((course) => course.hasMandatoryExam)).size > 1,
    [offeredCourses]
  )

  const showCourseTypeFilter = useMemo(
    () => new Set(offeredCourses.map((course) => course.isMandatory)).size > 1,
    [offeredCourses]
  )

  const showCurriculumYearFilter = availableCurriculumYears.length > 1
  const showTermFilter = availableTerms.length > 1

  // A hidden chip keeps whatever selection localStorage saved for this degree,
  // but must not filter on it: a value saved before the degree's data narrowed
  // to one answer would otherwise cut courses with no chip left to undo it.
  // One year at a time (the first by default); a search looks across all years.
  const shownCurriculumYear =
    selectedCurriculumYear === undefined
      ? (availableCurriculumYears[0] ?? null)
      : selectedCurriculumYear
  const activeCurriculumYear =
    showCurriculumYearFilter && searchQuery.trim() === ''
      ? shownCurriculumYear
      : null
  const activeTerm = showTermFilter ? selectedTerm : null
  const activeCourseType = showCourseTypeFilter ? courseTypeFilter : null
  const activeExamFilter = showExamFilter ? mandatoryExamFilter : null

  // Filter options
  const curriculumYearOptions = availableCurriculumYears.map((year) => ({
    value: year.toString(),
    label: t('degree_page.year_option', {
      year: lang === 'en' ? toOrdinal(year) : year
    })
  }))

  const termOptions = availableTerms.map((term) => ({
    value: term,
    label: term
  }))

  const courseGroupOptions = courseGroups.map((group) => ({
    value: group.id.toString(),
    label: group.name
  }))

  const examTypeOptions = [
    { value: 'true', label: t('degree_page.exam_mandatory') },
    { value: 'false', label: t('degree_page.exam_optional') }
  ]

  const courseTypeOptions = [
    { value: 'true', label: t('degree_page.mandatory_only') },
    { value: 'false', label: t('degree_page.optional_only') }
  ]

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'rating', label: t('degree_page.sort_highest_rating') },
    { value: 'alphabetical', label: t('degree_page.sort_alphabetical') },
    { value: 'reviews', label: t('degree_page.sort_most_reviews') },
    { value: 'workload', label: t('degree_page.sort_workload') }
  ]

  // Filtered courses based on search and filters
  const filteredCourses = useMemo(() => {
    return offeredCourses
      .filter((course) => {
        const matchesSearch = insensitiveMatch(
          `${course.name} ${course.acronym}`,
          searchQuery
        )

        const matchesCurriculumYear =
          activeCurriculumYear === null ||
          course.offerings.some(
            (o) => o.curriculumYear === activeCurriculumYear
          )

        const matchesTerm =
          !activeTerm ||
          course.offerings.some((o) => o.academicTerm.name === activeTerm)

        const matchesCourseGroup =
          !selectedCourseGroupId ||
          courseGroups
            .find((g) => g.id === selectedCourseGroupId)
            ?.courseIds.includes(course.id)

        const matchesMandatoryExam =
          activeExamFilter === null ||
          course.hasMandatoryExam === activeExamFilter

        const matchesCourseType =
          activeCourseType === null || course.isMandatory === activeCourseType

        return (
          matchesSearch &&
          matchesCurriculumYear &&
          matchesTerm &&
          matchesCourseGroup &&
          matchesMandatoryExam &&
          matchesCourseType
        )
      })
      .sort(compareCourses(sortBy))
  }, [
    offeredCourses,
    searchQuery,
    activeCurriculumYear,
    activeTerm,
    selectedCourseGroupId,
    sortBy,
    courseGroups,
    activeExamFilter,
    activeCourseType
  ])

  // Courses no longer taught have no year, term or group to filter on, so only
  // the search narrows them
  const filteredPastCourses = useMemo(
    () =>
      pastCourses
        .filter((course) =>
          insensitiveMatch(`${course.name} ${course.acronym}`, searchQuery)
        )
        .sort(compareCourses(sortBy)),
    [pastCourses, searchQuery, sortBy]
  )

  // A new query hands the section back to the search
  useEffect(() => {
    setPastExpandedByUser(null)
  }, [searchQuery])

  const pastExpanded =
    pastExpandedByUser ??
    // A degree no longer taught has nothing else to list, so it starts open
    (offeredCourses.length === 0 ||
      (searchQuery.trim().length > 0 && filteredPastCourses.length > 0))

  // Fire the browse-side search event once the query settles. Unlike the
  // feedback course browser (which hits the API), this filters an in-memory
  // list, so `resultsCount` is what the student ends up seeing on the page.
  // Resetting the ref on an empty query lets the same term re-fire if searched
  // again later.
  const debouncedSearch = useDebounce(searchQuery, 400)
  const lastTrackedSearchRef = useRef<string | null>(null)
  useEffect(() => {
    if (debouncedSearch.trim().length === 0) {
      lastTrackedSearchRef.current = null
      return
    }
    if (lastTrackedSearchRef.current === debouncedSearch) return

    lastTrackedSearchRef.current = debouncedSearch
    analytics.discovery.searchPerformed({
      searchQuery: debouncedSearch,
      resultsCount: filteredCourses.length + filteredPastCourses.length,
      surface: 'degree_courses_page'
    })
  }, [debouncedSearch, filteredCourses.length, filteredPastCourses.length])

  const sections = useCourseSections(
    filteredCourses,
    activeCurriculumYear,
    activeTerm,
    academicTerms
  )

  return (
    <>
      <div className="mb-2">
        <SearchInput
          trailing={
            <AskChatButton
              name={degree.acronym}
              degreeId={degree.id}
              source="degree_page"
              variant="ghost"
              size="sm"
              compact
              label={t('chat_prompt', { ns: 'chat' })}
            />
          }
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('degree_page.search_placeholder')}
        />
      </div>
      {showCurriculumYearFilter && (
        <div
          className="mb-3 flex flex-wrap gap-2"
          role="group"
          aria-label={t('degree_page.year_label')}
        >
          {curriculumYearOptions.map((option) => (
            <ToggleChip
              key={option.value}
              label={option.label}
              isActive={shownCurriculumYear === Number(option.value)}
              onClick={() => {
                setSelectedCurriculumYear(Number(option.value))
                analytics.discovery.filterApplied({
                  filterType: 'curriculum_year',
                  filterValue: option.value
                })
              }}
            />
          ))}
          <ToggleChip
            label={t('degree_page.all_years')}
            isActive={shownCurriculumYear === null}
            onClick={() => {
              setSelectedCurriculumYear(null)
              analytics.discovery.filterApplied({
                filterType: 'curriculum_year',
                filterValue: 'all'
              })
            }}
          />
        </div>
      )}
      <div className="mb-4">
        <FilterRow
          filters={
            <>
              <FilterChip
                label={t('degree_page.sort_label')}
                options={sortOptions}
                selectedValue={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
                placeholder={t('degree_page.sort_default')}
                variant="sort"
              />
              {showTermFilter && (
                <FilterChip
                  label={t('degree_page.term_label')}
                  options={termOptions}
                  selectedValue={selectedTerm}
                  onValueChange={setSelectedTerm}
                  placeholder={t('degree_page.all_terms')}
                />
              )}
              {courseGroupOptions.length > 0 && (
                <FilterChip
                  label={t('degree_page.group_label')}
                  options={courseGroupOptions}
                  selectedValue={selectedCourseGroupId?.toString() ?? null}
                  onValueChange={(value) =>
                    setSelectedCourseGroupId(value ? Number(value) : null)
                  }
                  placeholder={t('degree_page.all_groups')}
                />
              )}
              {showCourseTypeFilter && (
                <FilterChip
                  label={t('degree_page.mandatory_label')}
                  options={courseTypeOptions}
                  selectedValue={courseTypeFilter?.toString() ?? null}
                  onValueChange={(value) => {
                    setCourseTypeFilter(
                      value === null ? null : value === 'true'
                    )
                    if (value !== null) {
                      analytics.discovery.filterApplied({
                        filterType: 'is_mandatory',
                        filterValue: value === 'true' ? 'mandatory' : 'optional'
                      })
                    }
                  }}
                  placeholder={t('degree_page.mandatory_any')}
                />
              )}
              {showExamFilter && (
                <FilterChip
                  label={t('degree_page.exam_label')}
                  options={examTypeOptions}
                  selectedValue={mandatoryExamFilter?.toString() ?? null}
                  onValueChange={(value) =>
                    setMandatoryExamFilter(
                      value === null ? null : value === 'true'
                    )
                  }
                  placeholder={t('degree_page.exam_any')}
                />
              )}
            </>
          }
        />
      </div>

      {!courses || courses.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('degree_page.no_courses')}
        </div>
      ) : filteredCourses.length === 0 && filteredPastCourses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
          {t('degree_page.no_results')}
          <AskChatButton
            name={degree.acronym}
            degreeId={degree.id}
            source="degree_page"
            variant="outline"
            size="sm"
            label={t('chat_no_results', { ns: 'chat' })}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCourses.length > 0 && (
            <CourseTable sections={sections} headingLevel="h3" />
          )}
          {filteredPastCourses.length > 0 && (
            <Accordion
              type="single"
              collapsible
              value={pastExpanded ? 'past' : ''}
              onValueChange={(value) => {
                const expanded = value === 'past'
                setPastExpandedByUser(expanded)
                if (faculty.slug && degree.slug) {
                  analytics.discovery.degreePastCoursesToggled({
                    facultySlug: faculty.slug,
                    degreeSlug: degree.slug,
                    expanded,
                    pastCourseCount: pastCourses.length
                  })
                }
              }}
            >
              <AccordionItem value="past" className="border-b-0">
                <AccordionTrigger className="border-b border-border pb-2 pt-0 text-lg font-semibold text-muted-foreground hover:no-underline hover:text-foreground">
                  {t('degree_page.past_courses', {
                    count: filteredPastCourses.length
                  })}
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <p className="mb-3 px-3 text-sm text-muted-foreground">
                    {t('degree_page.past_courses_hint')}
                  </p>
                  <CourseTable
                    headingLevel="h3"
                    sections={[
                      {
                        key: 'past',
                        heading: null,
                        entries: filteredPastCourses.map((course) => ({
                          course,
                          terms: []
                        }))
                      }
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      )}

      <div className="mt-6">
        <MissingItemNote
          text={t('degree_page.missing_course')}
          linkLabel={t('degree_page.request_link')}
          href={ADD_COURSE_FORM_URL}
        />
      </div>
    </>
  )
}
