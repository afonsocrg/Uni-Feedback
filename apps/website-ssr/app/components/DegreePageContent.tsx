import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { CHIP_COLOR_KEYS } from '@uni-feedback/ui'
import { toOrdinal } from '@uni-feedback/utils'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { insensitiveMatch } from '~/utils'
import type { ViewMode } from '~/utils/analytics'
import { analytics } from '~/utils/analytics'
import { loadCourseFilters, saveCourseFilters } from '~/utils/filterStorage'
import { BrowsePageLayout, CourseCardGrid, CourseTable } from '.'
import { FilterChip } from './common/FilterChip'
import { FilterRow } from './common/FilterRow'
import { MissingItemNote } from './common/MissingItemNote'
import { SearchInput } from './common/SearchInput'
import { DEFAULT_VIEW_MODE, ViewModeToggle } from './common/ViewModeToggle'
import type { CourseSection, CourseWithFeedback } from './course/types'

interface CourseGroupWithIds {
  id: number
  name: string
  courseIds: number[]
}

/** Just enough of a term to order and label a run or a bucket. */
interface TermLabel {
  name: string
  startTick: number
  endTick: number
}

interface AcademicTermInfo extends TermLabel {
  id: number
  parentId: number | null
}

/** One course in a bucket, with the terms it runs in there. */
interface BucketEntry {
  course: CourseWithFeedback
  terms: TermLabel[]
}

/** All the courses of one curriculum year and one term. */
interface CourseBucket extends TermLabel {
  key: string
  curriculumYear: number | null
  entries: BucketEntry[]
}

/** A `CourseBucket` mid-build, its entries still keyed by course for lookup. */
type BucketAccumulator = Omit<CourseBucket, 'entries'> & {
  entries: Map<number, BucketEntry>
}

/**
 * The term a course is bucketed under: its offering's own term, or that term's
 * parent when it has one (P1 buckets under S1, a half-semester under its
 * semester).
 *
 * The parent is read, never inferred from the ticks. Containment can't tell a
 * parent from a mere container: Nova FCT's "Full Year" spans both semesters
 * without being their heading, and its interim term sits between them, inside
 * neither. Both are top-level, so both keep a bucket of their own.
 *
 * Offerings carry a term's name but not its id, and `(faculty_id, name)` is
 * unique, so the name is what resolves an offering to the faculty's term. A term
 * we can't resolve buckets under itself.
 */
function bucketTermOf(
  term: TermLabel,
  academicTerms: AcademicTermInfo[]
): TermLabel {
  const self = academicTerms.find((t) => t.name === term.name)
  if (!self?.parentId) return term
  return academicTerms.find((t) => t.id === self.parentId) ?? term
}

/**
 * Earlier terms first; on a tie, longer terms first. This is the ordering
 * convention the terms are stored under, and it puts a container (S1, 1-4) ahead
 * of the periods nested in it (P1, 1-2).
 */
const byTerm = (a: TermLabel, b: TermLabel) =>
  a.startTick !== b.startTick
    ? a.startTick - b.startTick
    : b.endTick - a.endTick

type SortOption = 'rating' | 'alphabetical' | 'reviews' | 'workload'

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

interface DegreePageContentProps {
  faculty: Faculty
  degree: Degree
  courses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  courseGroups: CourseGroupWithIds[]
}

export function DegreePageContent({
  faculty,
  degree,
  courses,
  academicTerms,
  courseGroups
}: DegreePageContentProps) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<
    number | null
  >(null)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<
    number | null
  >(null)
  const [mandatoryExamFilter, setMandatoryExamFilter] = useState<
    boolean | null
  >(null)
  const [courseTypeFilter, setCourseTypeFilter] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('reviews')
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE)

  // Entry event of the discovery funnel. Keyed on the degree so a client-side
  // navigation to another degree page counts as a new view, and deliberately
  // not on `viewMode`: this records the page as *served*, so re-firing it on a
  // toggle would double-count the view and make the switch rate meaningless.
  useEffect(() => {
    if (!faculty.slug || !degree.slug) return

    analytics.discovery.degreePageViewed({
      facultySlug: faculty.slug,
      degreeSlug: degree.slug,
      courseCount: courses.length,
      defaultViewMode: DEFAULT_VIEW_MODE
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty.slug, degree.slug])

  // Load filters from localStorage on mount (only if faculty and degree match)
  useEffect(() => {
    if (!faculty.slug || !degree.slug) return

    const savedFilters = loadCourseFilters(faculty.slug, degree.slug)
    if (savedFilters) {
      setSelectedCurriculumYear(savedFilters.curriculumYear)
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
      curriculumYear: selectedCurriculumYear,
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
  const availableCurriculumYears = useMemo(() => {
    const years = new Set<number>()
    courses.forEach((course) => {
      course.offerings.forEach((offering) => {
        if (offering.curriculumYear !== null) {
          years.add(offering.curriculumYear)
        }
      })
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [courses])

  // Available academic term names for filtering (from offerings)
  const availableTerms = useMemo(() => {
    const terms = new Set<string>()
    courses.forEach((course) => {
      course.offerings.forEach((offering) => {
        terms.add(offering.academicTerm.name)
      })
    })
    return Array.from(terms).sort()
  }, [courses])

  // A property every course answers the same way makes for a chip that can only
  // be a no-op or a way to empty the list, so it stays hidden. "Unknown" counts
  // as an answer of its own: a degree split between mandatory and unset courses
  // can still be narrowed, one where every course is mandatory cannot.
  //
  // Read off the whole course set, never `filteredCourses`, so chips don't
  // disappear as the list narrows and take their own selection with them.
  const showExamFilter = useMemo(
    () => new Set(courses.map((course) => course.hasMandatoryExam)).size > 1,
    [courses]
  )

  const showCourseTypeFilter = useMemo(
    () => new Set(courses.map((course) => course.isMandatory)).size > 1,
    [courses]
  )

  const showCurriculumYearFilter = availableCurriculumYears.length > 1
  const showTermFilter = availableTerms.length > 1

  // A hidden chip keeps whatever selection localStorage saved for this degree,
  // but must not filter on it: a value saved before the degree's data narrowed
  // to one answer would otherwise cut courses with no chip left to undo it.
  const activeCurriculumYear = showCurriculumYearFilter
    ? selectedCurriculumYear
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
    return courses
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
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return Number(b.averageRating || 0) - Number(a.averageRating || 0)
          case 'alphabetical':
            return a.name.localeCompare(b.name)
          case 'reviews':
            return (
              Number(b.totalFeedbackCount || 0) -
              Number(a.totalFeedbackCount || 0)
            )
          case 'workload':
            return (
              Number(b.averageWorkload || 0) - Number(a.averageWorkload || 0)
            )
          default:
            return 0
        }
      })
  }, [
    courses,
    searchQuery,
    activeCurriculumYear,
    activeTerm,
    selectedCourseGroupId,
    sortBy,
    courseGroups,
    activeExamFilter,
    activeCourseType
  ])

  // Group the filtered courses into (curriculum year, parent term) buckets, each
  // split into runs of courses sharing a term.
  //
  // Bucketing a sub-term under its parent rather than by raw term is what keeps
  // the listing readable: faculties that cut a semester into periods would
  // otherwise strand 1-2 courses under every heading (LEIC: 17 headings for 30
  // courses, against 6 here), and a listing that breaks every other row is hard
  // to read. Each course keeps a tag naming its own term, which is what tells P1
  // and P2 courses apart inside the merged bucket.
  //
  // A course offered in several of a bucket's terms is one entry carrying both,
  // not two near-identical rows; offered in several *buckets*, it appears in
  // each (all linking to the same page). A course with no offerings, or none
  // matching the active year/term filters, falls into a trailing "Other" bucket
  // so nothing is silently dropped. `filteredCourses` is already sorted by
  // `sortBy`, and we preserve that order while bucketing, so each bucket stays
  // sorted within a term.
  const courseBuckets = useMemo(() => {
    const buckets = new Map<string, BucketAccumulator>()
    const other: CourseWithFeedback[] = []

    for (const course of filteredCourses) {
      const offerings = course.offerings.filter((o) => {
        const matchesYear =
          activeCurriculumYear === null ||
          o.curriculumYear === activeCurriculumYear
        const matchesTerm = !activeTerm || o.academicTerm.name === activeTerm
        return matchesYear && matchesTerm
      })

      if (offerings.length === 0) {
        other.push(course)
        continue
      }

      for (const o of offerings) {
        const term = o.academicTerm
        const bucketTerm = bucketTermOf(term, academicTerms)
        const year = o.curriculumYear ?? 'x'
        const bucketKey = `${year}|${bucketTerm.name}`

        let bucket = buckets.get(bucketKey)
        if (!bucket) {
          bucket = {
            key: bucketKey,
            curriculumYear: o.curriculumYear,
            name: bucketTerm.name,
            startTick: bucketTerm.startTick,
            endTick: bucketTerm.endTick,
            entries: new Map()
          }
          buckets.set(bucketKey, bucket)
        }

        let entry = bucket.entries.get(course.id)
        if (!entry) {
          entry = { course, terms: [] }
          bucket.entries.set(course.id, entry)
        }
        // A course may list the same year/term twice; tag it once.
        if (!entry.terms.some((t) => t.name === term.name)) {
          entry.terms.push(term)
        }
      }
    }

    // A course sits at its earliest term, so one offered in both P1 and P2 sorts
    // with the P1 courses rather than drifting to the end of the bucket.
    const earliestTerm = (entry: BucketEntry) =>
      entry.terms.reduce((a, b) => (byTerm(a, b) <= 0 ? a : b))

    const ordered = Array.from(buckets.values()).sort((a, b) => {
      // Curriculum year ascending, unknown year last.
      const ay = a.curriculumYear ?? Infinity
      const by = b.curriculumYear ?? Infinity
      if (ay !== by) return ay - by
      return byTerm(a, b)
    })

    const withEntries = ordered.map((bucket) => ({
      ...bucket,
      // Term first, then known electives (isMandatory === false) last within a
      // term, keeping core and unknown courses up front. The sort is stable and
      // entries were inserted in `filteredCourses` order, so each tier keeps the
      // `sortBy` order it inherited.
      entries: Array.from(bucket.entries.values()).sort((a, b) => {
        const byT = byTerm(earliestTerm(a), earliestTerm(b))
        if (byT !== 0) return byT
        return (
          Number(a.course.isMandatory === false) -
          Number(b.course.isMandatory === false)
        )
      })
    }))

    const electivesLast = (courses: CourseWithFeedback[]) =>
      courses.sort(
        (a, b) =>
          Number(a.isMandatory === false) - Number(b.isMandatory === false)
      )

    return { buckets: withEntries, other: electivesLast(other) }
  }, [filteredCourses, activeCurriculumYear, activeTerm, academicTerms])

  // One hue per term, fixed for the whole faculty.
  //
  // Colour walks the palette in timeline order rather than hashing the term
  // name, because the terms that need telling apart are exactly the ones next to
  // each other: hashing put IST's P1 and P2 on indigo and blue, ΔE 3.5 apart
  // (indistinguishable), and those two share every S1 section. Walking in order
  // means neighbouring terms take neighbouring hues, which the palette orders to
  // be distant. Still deterministic, so a term keeps its colour across pages.
  const termColors = useMemo(() => {
    const ordered = [...academicTerms].sort(byTerm)
    return new Map(
      ordered.map((term, i) => [
        term.name,
        CHIP_COLOR_KEYS[i % CHIP_COLOR_KEYS.length]
      ])
    )
  }, [academicTerms])

  const bucketHeading = (bucket: CourseBucket) => {
    if (bucket.curriculumYear === null) return bucket.name
    const yearLabel = t('degree_page.year_option', {
      year:
        lang === 'en' ? toOrdinal(bucket.curriculumYear) : bucket.curriculumYear
    })
    return `${yearLabel} · ${bucket.name}`
  }

  // The sections every listing component renders. Degrees with no
  // curriculum-year data group by term alone, under bare "S1"/"Fall" headings:
  // the term is the only structure their offerings carry, and dropping it left
  // every IST master's and all of Nova SBE as one undifferentiated list (MEIC:
  // 60 courses, MIEI: 174). The split costs some duplication, since a course
  // offered in both terms is listed under each (Nova SBE BE: 50 courses over 90
  // rows), but that is what year-based degrees already do across years.
  //
  // Only when nothing buckets at all, every filtered course lacking an offering,
  // do we fall back to a single unheaded section holding the flat sorted list.
  const sections: CourseSection[] =
    courseBuckets.buckets.length === 0
      ? [
          {
            key: 'all',
            heading: null,
            entries: filteredCourses.map((course) => ({ course, terms: [] }))
          }
        ]
      : [
          ...courseBuckets.buckets.map((bucket) => ({
            key: bucket.key,
            heading: bucketHeading(bucket),
            entries: bucket.entries.map((entry) => ({
              course: entry.course,
              // A course running the bucket's whole term earns no tag: the
              // section heading already names that term.
              terms: entry.terms
                .filter((term) => term.name !== bucket.name)
                .map((term) => ({
                  label: term.name,
                  color: termColors.get(term.name) ?? 'gray'
                }))
            }))
          })),
          ...(courseBuckets.other.length > 0
            ? [
                {
                  key: 'other',
                  heading: t('degree_page.other_courses'),
                  entries: courseBuckets.other.map((course) => ({
                    course,
                    terms: []
                  }))
                }
              ]
            : [])
        ]

  return (
    <BrowsePageLayout
      title={degree.name}
      faculty={faculty}
      degree={degree}
      searchBar={
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('degree_page.search_placeholder')}
        />
      }
      filterChips={
        <FilterRow
          trailing={
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              surface="degree_page"
            />
          }
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
              {showCurriculumYearFilter && (
                <FilterChip
                  label={t('degree_page.year_label')}
                  options={curriculumYearOptions}
                  selectedValue={selectedCurriculumYear?.toString() ?? null}
                  onValueChange={(value) =>
                    setSelectedCurriculumYear(value ? Number(value) : null)
                  }
                  placeholder={t('degree_page.all_years')}
                />
              )}
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
      }
      actions={
        <MissingItemNote
          text={t('degree_page.missing_course')}
          linkLabel={t('degree_page.request_link')}
          href={ADD_COURSE_FORM_URL}
        />
      }
    >
      {!courses || courses.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('degree_page.no_courses')}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('degree_page.no_results')}
        </div>
      ) : viewMode === 'cards' ? (
        <CourseCardGrid sections={sections} />
      ) : (
        <CourseTable sections={sections} />
      )}
    </BrowsePageLayout>
  )
}
