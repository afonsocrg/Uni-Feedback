import type { Degree, Faculty } from '@uni-feedback/db/schema'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  CHIP_COLOR_KEYS
} from '@uni-feedback/ui'
import {
  getCurrentSchoolYear,
  isDiscontinued,
  toOrdinal
} from '@uni-feedback/utils'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce, useLang, useWorkloadLabel } from '~/hooks'
import { insensitiveMatch } from '~/utils'
import { analytics, type DegreeSectionId } from '~/utils/analytics'
import { loadCourseFilters, saveCourseFilters } from '~/utils/filterStorage'
import { Breadcrumb, CourseTable } from '.'
import { AskChatButton } from './chat/AskChatButton'
import { FilterChip } from './common/FilterChip'
import { FilterRow } from './common/FilterRow'
import { MissingItemNote } from './common/MissingItemNote'
import { ReportErrorNote } from './common/ReportErrorNote'
import { SearchInput } from './common/SearchInput'
import type { CourseSection, CourseWithFeedback } from './course/types'
import { AskChatPrompt } from './degree/AskChatPrompt'
import { buildFaq, computeHighlights } from './degree/content'
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
import {
  scrollToSection,
  useScrollSpy,
  type TocSection
} from './degree/scrollSpy'

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

function compareCourses(sortBy: SortOption) {
  return (a: CourseWithFeedback, b: CourseWithFeedback) => {
    switch (sortBy) {
      case 'rating':
        return Number(b.averageRating || 0) - Number(a.averageRating || 0)
      case 'alphabetical':
        return a.name.localeCompare(b.name)
      case 'reviews':
        return (
          Number(b.totalFeedbackCount || 0) - Number(a.totalFeedbackCount || 0)
        )
      case 'workload':
        return Number(b.averageWorkload || 0) - Number(a.averageWorkload || 0)
      default:
        return 0
    }
  }
}

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

interface DegreePageContentProps {
  faculty: Faculty
  degree: Degree
  /** Our reviewed description (markdown) in the page's language */
  about?: string | null
  courses: CourseWithFeedback[]
  academicTerms: AcademicTermInfo[]
  courseGroups: CourseGroupWithIds[]
  /** Campus, admission, fees, outcomes and related degrees (v2) */
  extras: DegreePageExtras
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
  courseGroups,
  extras
}: DegreePageContentProps) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
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
  const faqItems = buildFaq(t, lang, {
    acronym: degree.acronym,
    admissions: extras.admissions,
    fees: extras.fees,
    outcomes: extras.outcomes,
    highlights,
    workloadLabel,
    isRetired
  })

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
    (surface: 'sidebar' | 'mobile_sheet' | 'header_button') =>
    (section: DegreeSectionId) => {
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
    offeredCourses.forEach((course) => {
      course.offerings.forEach((offering) => {
        if (offering.curriculumYear !== null) {
          years.add(offering.curriculumYear)
        }
      })
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [offeredCourses])

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
      surface: 'degree_page'
    })
  }, [debouncedSearch, filteredCourses.length, filteredPastCourses.length])

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

  const totalFeedback = courses.reduce(
    (sum, course) => sum + Number(course.totalFeedbackCount || 0),
    0
  )
  const scopeLabel = degree.acronym

  const plan = (
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
              campuses={extras.campuses}
              courseCount={offeredCourses.length}
              feedbackCount={totalFeedback}
              isRetired={isRetired}
              onViewCourses={() => {
                trackTocClick('header_button')('plano')
                scrollToSection('plano')
              }}
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
                track={track}
              />
            )}

            {showOutcomes && (
              <OutcomesSection
                outcomes={extras.outcomes}
                showFallback={expectsOutcomes}
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

            {faqItems.length > 0 && <FaqSection items={faqItems} />}

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
