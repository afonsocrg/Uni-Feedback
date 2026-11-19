import type { CourseOffering } from '@uni-feedback/api-client'
import type { Degree, Faculty } from '@uni-feedback/db/schema'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Markdown,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@uni-feedback/ui'
import { isDiscontinued, toOrdinal } from '@uni-feedback/utils'
import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce, useLang, useTermLabel } from '~/hooks'
import type { DegreePlanData, PlanItem } from '~/lib/degreePlan.server'
import { cn, insensitiveMatch } from '~/utils'
import { analytics } from '~/utils/analytics'
import { loadCourseFilters, saveCourseFilters } from '~/utils/filterStorage'
import { AskChatButton } from './chat/AskChatButton'
import { FilterChip, type FilterOption } from './common/FilterChip'
import { FilterRow } from './common/FilterRow'
import { InfoPopover } from './common/InfoPopover'
import { MissingItemNote } from './common/MissingItemNote'
import { SearchInput } from './common/SearchInput'
import { ToggleChip } from './common/ToggleChip'
import { CourseRow, CourseTable } from './course/CourseTable'
import {
  compareCourses,
  useAvailableCurriculumYears,
  useCourseSections,
  yearAnchorId,
  type AcademicTermInfo,
  type CourseGroupWithIds,
  type SortOption
} from './course/courseSections'
import type { CourseWithFeedback } from './course/types'
import {
  PlanCourseList,
  usePlanListing,
  type PlanFilter
} from './degree/PlanCourseList'
import { itemsOfVersion, planRows } from './degree/planLayout'
import {
  scrollToSection,
  useHeaderHeight,
  useScrollSpy,
  type TocSection
} from './degree/scrollSpy'

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

/** Before the sticky bar is measured: header plus a two-row bar on a phone */
const FALLBACK_STICKY_OFFSET = 180

/**
 * The full course browser of a degree (`/:faculty/:degree/cadeiras`): every
 * year listed in turn, with search, year tabs and the filters in a bar that
 * sticks under the site header. The year tabs jump between years (and follow
 * the scroll) rather than filter, so the whole plan stays one scroll. Term,
 * group, mandatory and exam filters and the sort are persisted per degree
 * (filterStorage); on phones they fold behind one button into a bottom sheet.
 * Courses no longer taught sit in a collapsed section at the end.
 *
 * A degree with a curricular plan lists its plan instead (`PlanCourseList`):
 * years, a column per semester, and the choices as pools, with the ratings.
 * There the term and course-group filters give way to the plan's own (fixed
 * course or choice, a track), the sort orders each list (a semester, a pool's
 * group) rather than the whole page, and the degree's courses the plan
 * doesn't name follow under "Outras cadeiras".
 */
export function DegreeCoursesBrowser({
  faculty,
  degree,
  courses,
  academicTerms,
  courseGroups,
  plan,
  planCourses
}: {
  faculty: Faculty
  degree: Degree
  courses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  courseGroups: CourseGroupWithIds[]
  plan: DegreePlanData | null
  /** Courses the plan names that belong to other degrees, with their ratings */
  planCourses: CourseWithFeedback[]
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const termLabel = useTermLabel()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<
    number | null
  >(null)
  const [mandatoryExamFilter, setMandatoryExamFilter] = useState<
    boolean | null
  >(null)
  const [courseTypeFilter, setCourseTypeFilter] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('reviews')
  // The plan-shaped listing's own state: the plan version shown (Nova SBE's
  // A/B) and a track narrowing it
  const [versionId, setVersionId] = useState<number | null>(
    plan?.versions[0]?.id ?? null
  )
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())
  // Saving waits for the saved filters to be read back, so the defaults of the
  // first render never overwrite them (React runs the mount effects twice in
  // development, and the save would land between the two reads)
  const [filtersRestored, setFiltersRestored] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
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
      setSelectedTerm(savedFilters.term)
      setSelectedCourseGroupId(savedFilters.courseGroupId)
      setMandatoryExamFilter(savedFilters.hasMandatoryExam)
      // Filters saved before this option existed have no `isMandatory` key.
      setCourseTypeFilter(savedFilters.isMandatory ?? null)
      setSortBy(savedFilters.sortBy as SortOption)
      setSelectedTrackId(savedFilters.trackId ?? null)
      // Every year folded is a page that looks empty on return (a student
      // who folded each to skim the headings): that one isn't restored
      const planYearCount = plan
        ? planRows(itemsOfVersion(plan, plan.versions[0]?.id ?? null)).length
        : 0
      const savedCollapsed = savedFilters.collapsedYears ?? []
      setCollapsedYears(
        new Set(
          planYearCount > 0 && savedCollapsed.length >= planYearCount
            ? []
            : savedCollapsed
        )
      )
    }

    // A link from the degree page's plan summary ("N optativas no 3.º ano")
    // names the year and course type to open on. The year is scrolled to, the
    // type filters, and the term and group are cleared so the list isn't
    // narrowed by a filter the link didn't ask for.
    const params = new URLSearchParams(window.location.search)
    const linkedYear = Number(params.get('year'))
    const linkedType = params.get('type')
    if (Number.isInteger(linkedYear) && linkedYear > 0) {
      setSelectedTerm(null)
      setSelectedCourseGroupId(null)
      // A link to a year opens it, even if the student had folded it
      setCollapsedYears((prev) => {
        const next = new Set(prev)
        next.delete(linkedYear)
        return next
      })
      // After the cleared filters have re-rendered the listing
      requestAnimationFrame(() => scrollToSection(yearAnchorId(linkedYear)))
    }
    if (linkedType === 'optional' || linkedType === 'mandatory') {
      setCourseTypeFilter(linkedType === 'mandatory')
    }
    setFiltersRestored(true)
  }, [faculty.slug, degree.slug])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (!faculty.slug || !degree.slug || !filtersRestored) return

    saveCourseFilters(faculty.slug, degree.slug, {
      // Years are no longer a filter: every year is listed
      curriculumYear: null,
      term: selectedTerm,
      courseGroupId: selectedCourseGroupId,
      hasMandatoryExam: mandatoryExamFilter,
      isMandatory: courseTypeFilter,
      sortBy,
      trackId: selectedTrackId,
      collapsedYears: [...collapsedYears]
    })
  }, [
    filtersRestored,
    selectedTrackId,
    collapsedYears,
    faculty.slug,
    degree.slug,
    selectedTerm,
    selectedCourseGroupId,
    mandatoryExamFilter,
    courseTypeFilter,
    sortBy
  ])

  // Available curriculum years (from offerings), one tab each
  const availableCurriculumYears = useAvailableCurriculumYears(offeredCourses)

  // Available academic terms for filtering (from offerings), keyed by name
  const availableTerms = useMemo(() => {
    const terms = new Map<string, CourseOffering['academicTerm']>()
    offeredCourses.forEach((course) => {
      course.offerings.forEach((offering) => {
        terms.set(offering.academicTerm.name, offering.academicTerm)
      })
    })
    return Array.from(terms.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
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

  // With a plan, the listing follows it: its years, its fixed courses and
  // choices, its tracks. The terms and course groups are then the columns and
  // pools on the page, so their chips go.
  const hasPlan = plan !== null
  const planItems = useMemo(
    () => (plan ? itemsOfVersion(plan, versionId) : []),
    [plan, versionId]
  )
  const planYears = useMemo(
    () => planRows(planItems).map((row) => row.year),
    [planItems]
  )
  const planHasBoth =
    planItems.some((item) => item.kind === 'course') &&
    planItems.some((item) => item.kind === 'pool')
  const planTracks = useMemo(
    () =>
      (plan?.tracks ?? []).filter((track) =>
        track.courses.some((entry) => entry.course !== null)
      ),
    [plan]
  )

  const tabYears = hasPlan ? planYears : availableCurriculumYears
  const showYearTabs = tabYears.length > 1
  const showTermFilter = !hasPlan && availableTerms.length > 1
  const showGroupFilter = !hasPlan && courseGroups.length > 0
  // A plan says which courses are fixed and which are choices, whatever the
  // courses' own `isMandatory` holds
  const showTypeFilter = hasPlan ? planHasBoth : showCourseTypeFilter

  // A hidden chip keeps whatever selection localStorage saved for this degree,
  // but must not filter on it: a value saved before the degree's data narrowed
  // to one answer would otherwise cut courses with no chip left to undo it.
  // Same for a saved term the degree no longer has, e.g. one saved before the
  // faculty's terms were renamed ("1.º Semestre" to "S1").
  const activeTerm =
    showTermFilter && availableTerms.some((term) => term.name === selectedTerm)
      ? selectedTerm
      : null
  const activeCourseGroupId =
    showGroupFilter && courseGroups.some((g) => g.id === selectedCourseGroupId)
      ? selectedCourseGroupId
      : null
  const activeCourseType = showTypeFilter ? courseTypeFilter : null
  const activeExamFilter = showExamFilter ? mandatoryExamFilter : null
  const activeTrack =
    planTracks.find((track) => track.id === selectedTrackId) ?? null
  const activeFilterCount = [
    activeTerm,
    activeCourseGroupId,
    activeCourseType,
    activeExamFilter,
    activeTrack?.id ?? null
  ].filter((value) => value !== null).length

  // Filter options
  const termOptions = availableTerms.map((term) => ({
    value: term.name,
    label: termLabel(term, 'long')
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

  const trackOptions = planTracks.map((track) => ({
    value: track.id.toString(),
    label: track.name
  }))

  // The default first, then by how often students pick each (autocapture,
  // Feb to Nov 2026: workload 137 picks, rating 114, by name 66)
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'reviews', label: t('degree_page.sort_most_reviews') },
    { value: 'workload', label: t('degree_page.sort_workload') },
    { value: 'rating', label: t('degree_page.sort_highest_rating') },
    { value: 'alphabetical', label: t('degree_page.sort_alphabetical') }
  ]
  const changeSort = (value: string) => {
    setSortBy(value as SortOption)
    analytics.discovery.filterApplied({
      filterType: 'sort',
      filterValue: value
    })
  }

  // One setter per filter, shared by the desktop chips and the phone sheet
  const changeCourseType = (value: string | null) => {
    setCourseTypeFilter(value === null ? null : value === 'true')
    if (value !== null) {
      analytics.discovery.filterApplied({
        filterType: 'is_mandatory',
        filterValue: value === 'true' ? 'mandatory' : 'optional'
      })
    }
  }
  const changeCourseGroup = (value: string | null) =>
    setSelectedCourseGroupId(value ? Number(value) : null)
  const changeExam = (value: string | null) =>
    setMandatoryExamFilter(value === null ? null : value === 'true')
  const changeTrack = (value: string | null) => {
    setSelectedTrackId(value ? Number(value) : null)
    const track = planTracks.find((item) => item.id.toString() === value)
    if (track)
      analytics.discovery.filterApplied({
        filterType: 'plan_track',
        filterValue: track.name
      })
  }
  const clearFilters = () => {
    setSelectedTerm(null)
    setSelectedCourseGroupId(null)
    setCourseTypeFilter(null)
    setMandatoryExamFilter(null)
    setSelectedTrackId(null)
  }

  // The filters in the order both surfaces show them, sort aside
  const filters: {
    key: string
    label: string
    options: FilterOption[]
    selected: string | null
    placeholder: string
    onChange: (value: string | null) => void
  }[] = [
    ...(showTermFilter
      ? [
          {
            key: 'term',
            label: t('degree_page.term_label'),
            options: termOptions,
            selected: activeTerm,
            placeholder: t('degree_page.all_terms'),
            onChange: setSelectedTerm
          }
        ]
      : []),
    ...(showGroupFilter && courseGroupOptions.length > 0
      ? [
          {
            key: 'group',
            label: t('degree_page.group_label'),
            options: courseGroupOptions,
            selected: activeCourseGroupId?.toString() ?? null,
            placeholder: t('degree_page.all_groups'),
            onChange: changeCourseGroup
          }
        ]
      : []),
    ...(showTypeFilter
      ? [
          {
            key: 'type',
            label: t('degree_page.mandatory_label'),
            options: courseTypeOptions,
            selected: activeCourseType?.toString() ?? null,
            placeholder: t('degree_page.mandatory_any'),
            onChange: changeCourseType
          }
        ]
      : []),
    ...(trackOptions.length > 0
      ? [
          {
            key: 'track',
            label: t('degree_courses.track_label'),
            options: trackOptions,
            selected: activeTrack?.id.toString() ?? null,
            placeholder: t('degree_courses.track_any'),
            onChange: changeTrack
          }
        ]
      : []),
    ...(showExamFilter
      ? [
          {
            key: 'exam',
            label: t('degree_page.exam_label'),
            options: examTypeOptions,
            selected: activeExamFilter?.toString() ?? null,
            placeholder: t('degree_page.exam_any'),
            onChange: changeExam
          }
        ]
      : [])
  ]

  // Filtered courses based on search and filters
  const filteredCourses = useMemo(() => {
    const group = courseGroups.find((g) => g.id === activeCourseGroupId)
    return offeredCourses
      .filter((course) => {
        const matchesSearch = insensitiveMatch(
          `${course.name} ${course.acronym} ${course.altName ?? ''}`,
          searchQuery
        )

        const matchesTerm =
          !activeTerm ||
          course.offerings.some((o) => o.academicTerm.name === activeTerm)

        const matchesCourseGroup = !group || group.courseIds.includes(course.id)

        const matchesMandatoryExam =
          activeExamFilter === null ||
          course.hasMandatoryExam === activeExamFilter

        const matchesCourseType =
          activeCourseType === null || course.isMandatory === activeCourseType

        return (
          matchesSearch &&
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
    activeTerm,
    activeCourseGroupId,
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
          insensitiveMatch(
            `${course.name} ${course.acronym} ${course.altName ?? ''}`,
            searchQuery
          )
        )
        .sort(compareCourses(sortBy)),
    [pastCourses, searchQuery, sortBy]
  )

  // A degree with a plan: the plan, filtered in place, then the degree's
  // courses it doesn't name. Plan courses of other degrees bring their ratings.
  const coursesById = useMemo(
    () =>
      new Map(
        [...courses, ...planCourses].map((course) => [course.id, course])
      ),
    [courses, planCourses]
  )
  const planFilter = useMemo<PlanFilter>(
    () => ({
      query: searchQuery,
      trackCourseIds: activeTrack
        ? new Set(
            activeTrack.courses.flatMap((entry) =>
              entry.course ? [entry.course.id] : []
            )
          )
        : null,
      hasMandatoryExam: activeExamFilter,
      fixed: activeCourseType
    }),
    [searchQuery, activeTrack, activeExamFilter, activeCourseType]
  )
  const planListing = usePlanListing({
    plan,
    versionId,
    academicTerms,
    coursesById,
    filter: planFilter,
    sortBy
  })
  // Taught in the degree but not in its plan (an old option, a course the plan
  // hasn't caught up with). Not a fixed course nor a choice of the plan, so a
  // type filter leaves them out.
  const otherCourses = useMemo(
    () =>
      !hasPlan || activeCourseType !== null
        ? []
        : offeredCourses
            .filter(
              (course) =>
                !planListing.planCourseIds.has(course.id) &&
                insensitiveMatch(
                  `${course.name} ${course.acronym} ${course.altName ?? ''}`,
                  searchQuery
                ) &&
                (activeExamFilter === null ||
                  course.hasMandatoryExam === activeExamFilter) &&
                (planFilter.trackCourseIds === null ||
                  planFilter.trackCourseIds.has(course.id))
            )
            .sort(compareCourses(sortBy)),
    [
      hasPlan,
      activeCourseType,
      offeredCourses,
      planListing.planCourseIds,
      searchQuery,
      activeExamFilter,
      planFilter.trackCourseIds,
      sortBy
    ]
  )
  const listedCount = hasPlan
    ? planListing.count + otherCourses.length
    : filteredCourses.length

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
      resultsCount: listedCount + filteredPastCourses.length,
      surface: 'degree_courses_page'
    })
  }, [debouncedSearch, listedCount, filteredPastCourses.length])

  const sections = useCourseSections(
    filteredCourses,
    null,
    activeTerm,
    academicTerms,
    { groupByYear: showYearTabs }
  )

  // The years the listing shows right now: a search or a filter can empty one,
  // and its tab then has nothing to jump to
  const listedYears = new Set(
    hasPlan
      ? planListing.years.map((year) => year.year)
      : sections.flatMap((section) =>
          section.group ? [section.group.year] : []
        )
  )
  const yearTabs: TocSection<string>[] = tabYears
    .filter((year) => listedYears.has(year))
    .map((year) => ({ id: yearAnchorId(year), label: '' }))

  // The bar sticks under the site header; a year counts as current once its
  // heading passes under the bar, and a jump lands its heading just below it
  const headerHeight = useHeaderHeight()
  const barRef = useRef<HTMLDivElement>(null)
  const [barHeight, setBarHeight] = useState<number | null>(null)
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const measure = () => setBarHeight(bar.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])
  const stickyOffset =
    headerHeight !== null && barHeight !== null
      ? headerHeight + barHeight
      : FALLBACK_STICKY_OFFSET
  const currentYearId = useScrollSpy<string>(
    yearTabs,
    { facultySlug: faculty.slug, degreeSlug: degree.slug },
    () => {},
    stickyOffset + 24
  )

  const planInfoOpened = (item: PlanItem | null) => {
    if (faculty.slug && degree.slug)
      analytics.discovery.degreeCoursesPlanInfoOpened({
        facultySlug: faculty.slug,
        degreeSlug: degree.slug,
        itemId: item?.id ?? null,
        label: item?.label ?? ''
      })
  }

  const toggleYear = (year: number) => {
    const expanded = collapsedYears.has(year)
    setCollapsedYears((prev) => {
      const next = new Set(prev)
      if (expanded) next.delete(year)
      else next.add(year)
      return next
    })
    if (faculty.slug && degree.slug)
      analytics.discovery.degreeCoursesYearToggled({
        facultySlug: faculty.slug,
        degreeSlug: degree.slug,
        curriculumYear: year,
        expanded
      })
  }

  const jumpToYear = (year: number) => {
    // A tab to a folded year opens it, then lands on it once it has rendered
    if (collapsedYears.has(year)) {
      setCollapsedYears((prev) => {
        const next = new Set(prev)
        next.delete(year)
        return next
      })
      requestAnimationFrame(() => scrollToSection(yearAnchorId(year)))
    } else scrollToSection(yearAnchorId(year))
    if (faculty.slug && degree.slug) {
      analytics.discovery.degreeCoursesYearJumped({
        facultySlug: faculty.slug,
        degreeSlug: degree.slug,
        curriculumYear: year
      })
    }
  }

  const resultCount = listedCount + filteredPastCourses.length

  return (
    <div
      style={{ '--sticky-offset': `${stickyOffset + 16}px` } as CSSProperties}
    >
      <div
        ref={barRef}
        style={headerHeight !== null ? { top: headerHeight } : undefined}
        className={cn(
          'sticky top-[69px] z-30 -mx-4 mb-5 border-b border-border bg-background px-4 pt-2 md:top-[71px] md:mx-0 md:px-0',
          !showYearTabs && 'pb-3'
        )}
      >
        <div className="flex items-center gap-1">
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
          <button
            type="button"
            onClick={() => {
              setFiltersOpen(true)
              if (faculty.slug && degree.slug) {
                analytics.discovery.degreeCoursesFiltersOpened({
                  facultySlug: faculty.slug,
                  degreeSlug: degree.slug,
                  activeFilterCount
                })
              }
            }}
            aria-label={t('degree_page.filters_button')}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
          >
            <SlidersHorizontal aria-hidden="true" className="size-5" />
            {activeFilterCount > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-brand-solid text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-3 hidden md:block">
          <FilterRow
            filters={
              <>
                <FilterChip
                  label={t('degree_page.sort_label')}
                  options={sortOptions}
                  selectedValue={sortBy}
                  onValueChange={(value) => value && changeSort(value)}
                  placeholder={t('degree_page.sort_default')}
                  variant="sort"
                />
                {filters.map((filter) => (
                  <FilterChip
                    key={filter.key}
                    label={filter.label}
                    options={filter.options}
                    selectedValue={filter.selected}
                    onValueChange={filter.onChange}
                    placeholder={filter.placeholder}
                  />
                ))}
              </>
            }
          />
        </div>

        {/* The year tabs, with how the plan works on their right: a (?) in
            the bar rather than a row of its own (just the icon on phones) */}
        {(showYearTabs || plan?.description) && (
          <div className="-mb-px mt-1 flex items-center gap-4 md:mt-2">
            {showYearTabs && (
              <nav
                aria-label={t('degree_page.year_nav_label')}
                className="flex min-w-0 flex-1 gap-6 overflow-x-auto scrollbar-hide"
              >
                {tabYears.map((year) => {
                  const id = yearAnchorId(year)
                  const listed = listedYears.has(year)
                  const current = listed && currentYearId === id
                  return (
                    <a
                      key={year}
                      href={`#${id}`}
                      aria-current={current ? 'location' : undefined}
                      aria-disabled={!listed || undefined}
                      tabIndex={listed ? undefined : -1}
                      onClick={(event) => {
                        event.preventDefault()
                        if (listed) jumpToYear(year)
                      }}
                      className={cn(
                        'shrink-0 border-b-2 py-2.5 text-sm font-medium transition-colors',
                        current
                          ? 'border-primaryBlue text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                        !listed && 'pointer-events-none opacity-40'
                      )}
                    >
                      {t('degree_page.year_option', {
                        year: lang === 'en' ? toOrdinal(year) : year
                      })}
                    </a>
                  )
                })}
              </nav>
            )}
            {plan?.description && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                <span className="hidden md:inline">
                  {t('degree_courses.plan_info')}
                </span>
                <InfoPopover
                  label={t('degree_courses.plan_info')}
                  onOpenChange={(open) => open && planInfoOpened(null)}
                  content={
                    <div className="max-h-80 overflow-y-auto">
                      <Markdown>{plan.description}</Markdown>
                    </div>
                  }
                />
              </span>
            )}
          </div>
        )}
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] gap-0 overflow-y-auto rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>{t('degree_page.filters_title')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('degree_page.filters_title')}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-2">
            <SheetFilterGroup
              label={t('degree_page.sort_label')}
              options={sortOptions}
              selected={sortBy}
              onChange={(value) => value && changeSort(value)}
            />
            {filters.map((filter) => (
              <SheetFilterGroup
                key={filter.key}
                label={filter.label}
                options={filter.options}
                selected={filter.selected}
                onChange={filter.onChange}
                anyLabel={t('degree_page.filter_any')}
              />
            ))}
          </div>
          <SheetFooter className="flex-row gap-2">
            {activeFilterCount > 0 && (
              <Button variant="ghost" className="flex-1" onClick={clearFilters}>
                {t('degree_page.filters_clear')}
              </Button>
            )}
            <Button
              className="flex-1 bg-brand-solid text-white"
              onClick={() => setFiltersOpen(false)}
            >
              {t('degree_page.filters_show', { count: resultCount })}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {plan && plan.versions.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {plan.versions.length > 1 && (
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={t('degree_page.plan.version_label')}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {t('degree_page.plan.version_label')}
              </span>
              {plan.versions.map((version) => (
                <ToggleChip
                  key={version.id}
                  label={version.name}
                  isActive={versionId === version.id}
                  onClick={() => {
                    setVersionId(version.id)
                    if (faculty.slug && degree.slug)
                      analytics.discovery.degreePlanVersionSelected({
                        facultySlug: faculty.slug,
                        degreeSlug: degree.slug,
                        versionId: version.id,
                        version: version.name
                      })
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {(!courses || courses.length === 0) && !hasPlan ? (
        <div className="text-center text-muted-foreground py-8">
          {t('degree_page.no_courses')}
        </div>
      ) : resultCount === 0 ? (
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
          {hasPlan ? (
            <>
              {planListing.years.length > 0 && (
                <PlanCourseList
                  listing={planListing}
                  onInfoOpened={planInfoOpened}
                  collapsedYears={collapsedYears}
                  onYearToggle={toggleYear}
                  onPoolToggled={(item, expanded) => {
                    if (faculty.slug && degree.slug)
                      analytics.discovery.degreeCoursesPoolToggled({
                        facultySlug: faculty.slug,
                        degreeSlug: degree.slug,
                        itemId: item.id,
                        label: item.label ?? '',
                        optionCount: item.options.length,
                        expanded
                      })
                  }}
                />
              )}
              {otherCourses.length > 0 && (
                <section>
                  <h2
                    id="other-courses"
                    className="scroll-mt-(--sticky-offset) text-base font-semibold text-foreground md:text-lg"
                  >
                    {t('degree_courses.other_courses')}
                  </h2>
                  <p className="mb-3 mt-1 text-sm text-muted-foreground">
                    {t('degree_courses.other_courses_hint')}
                  </p>
                  {otherCourses.map((course, i) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      terms={[]}
                      positionInList={planListing.count + i}
                      planSection="not_in_plan"
                      filtered={planListing.filtering}
                    />
                  ))}
                </section>
              )}
            </>
          ) : (
            filteredCourses.length > 0 && (
              <CourseTable sections={sections} headingLevel="h3" />
            )
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
    </div>
  )
}

/** One filter in the phone sheet: its label over a wrap of chips. */
function SheetFilterGroup({
  label,
  options,
  selected,
  onChange,
  anyLabel
}: {
  label: string
  options: FilterOption[]
  selected: string | null
  onChange: (value: string | null) => void
  /** Adds a first "any" chip that clears the filter; sorts have none */
  anyLabel?: string
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {anyLabel && (
          <ToggleChip
            label={anyLabel}
            isActive={selected === null}
            onClick={() => onChange(null)}
          />
        )}
        {options.map((option) => (
          <ToggleChip
            key={option.value}
            label={option.label}
            isActive={selected === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </fieldset>
  )
}
