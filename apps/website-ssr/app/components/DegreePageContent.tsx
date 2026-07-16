import type { CourseOffering } from '@uni-feedback/api-client'
import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { toOrdinal } from '@uni-feedback/utils'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { insensitiveMatch } from '~/utils'
import { analytics } from '~/utils/analytics'
import { loadCourseFilters, saveCourseFilters } from '~/utils/filterStorage'
import { getCoursePath } from '~/utils/i18n-routes'
import { BrowsePageLayout, CourseCard } from '.'
import { FilterChip } from './common/FilterChip'
import { SearchInput } from './common/SearchInput'

interface CourseWithFeedback {
  id: number
  name: string
  acronym: string
  offerings: CourseOffering[]
  hasMandatoryExam: boolean | null
  isMandatory: boolean | null
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
}

interface CourseGroupWithIds {
  id: number
  name: string
  courseIds: number[]
}

interface CourseBucket {
  key: string
  curriculumYear: number | null
  termName: string
  startTick: number
  endTick: number
  courses: CourseWithFeedback[]
}

type SortOption = 'rating' | 'alphabetical' | 'reviews' | 'workload'

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

interface DegreePageContentProps {
  faculty: Faculty
  degree: Degree
  courses: CourseWithFeedback[]
  courseGroups: CourseGroupWithIds[]
}

export function DegreePageContent({
  faculty,
  degree,
  courses,
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

  // Check if any course has exam information
  const hasExamFilterOptions = useMemo(() => {
    return courses.some((course) => course.hasMandatoryExam !== null)
  }, [courses])

  // Check if any course says whether it is mandatory or optional
  const hasCourseTypeFilterOptions = useMemo(() => {
    return courses.some((course) => course.isMandatory !== null)
  }, [courses])

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
          selectedCurriculumYear === null ||
          course.offerings.some(
            (o) => o.curriculumYear === selectedCurriculumYear
          )

        const matchesTerm =
          !selectedTerm ||
          course.offerings.some((o) => o.academicTerm.name === selectedTerm)

        const matchesCourseGroup =
          !selectedCourseGroupId ||
          courseGroups
            .find((g) => g.id === selectedCourseGroupId)
            ?.courseIds.includes(course.id)

        const matchesMandatoryExam =
          mandatoryExamFilter === null ||
          course.hasMandatoryExam === mandatoryExamFilter

        const matchesCourseType =
          courseTypeFilter === null || course.isMandatory === courseTypeFilter

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
    selectedCurriculumYear,
    selectedTerm,
    selectedCourseGroupId,
    sortBy,
    courseGroups,
    mandatoryExamFilter,
    courseTypeFilter
  ])

  // Group the filtered courses into (curriculum year, academic term) buckets.
  // A course offered in several terms appears in each matching bucket (all
  // linking to the same page); a course with no offerings, or none matching the
  // active year/term filters, falls into a trailing "Other" bucket so nothing
  // is silently dropped. `filteredCourses` is already sorted by `sortBy`, and we
  // preserve that order while bucketing, so each bucket stays sorted.
  const courseBuckets = useMemo(() => {
    const buckets = new Map<string, CourseBucket>()
    const other: CourseWithFeedback[] = []

    for (const course of filteredCourses) {
      const offerings = course.offerings.filter((o) => {
        const matchesYear =
          selectedCurriculumYear === null ||
          o.curriculumYear === selectedCurriculumYear
        const matchesTerm =
          !selectedTerm || o.academicTerm.name === selectedTerm
        return matchesYear && matchesTerm
      })

      if (offerings.length === 0) {
        other.push(course)
        continue
      }

      // A course may list the same year/term twice; only place it once per bucket.
      const seen = new Set<string>()
      for (const o of offerings) {
        const { name, startTick, endTick } = o.academicTerm
        const key = `${o.curriculumYear ?? 'x'}|${name}|${startTick}|${endTick}`
        if (seen.has(key)) continue
        seen.add(key)

        let bucket = buckets.get(key)
        if (!bucket) {
          bucket = {
            key,
            curriculumYear: o.curriculumYear,
            termName: name,
            startTick,
            endTick,
            courses: []
          }
          buckets.set(key, bucket)
        }
        bucket.courses.push(course)
      }
    }

    // Within a bucket, push known electives (isMandatory === false) to the end,
    // keeping core and unknown courses up front. The sort is stable, so each
    // tier keeps the `sortBy` order it inherited from `filteredCourses`.
    const electivesLast = (courses: CourseWithFeedback[]) =>
      courses.sort(
        (a, b) =>
          Number(a.isMandatory === false) - Number(b.isMandatory === false)
      )

    const ordered = Array.from(buckets.values()).sort((a, b) => {
      // Curriculum year ascending, unknown year last.
      const ay = a.curriculumYear ?? Infinity
      const by = b.curriculumYear ?? Infinity
      if (ay !== by) return ay - by
      // Then earlier terms first; on a tie, longer terms (later end) first.
      if (a.startTick !== b.startTick) return a.startTick - b.startTick
      return b.endTick - a.endTick
    })
    ordered.forEach((bucket) => electivesLast(bucket.courses))

    return { buckets: ordered, other: electivesLast(other) }
  }, [filteredCourses, selectedCurriculumYear, selectedTerm])

  const getCourseUrl = (course: CourseWithFeedback) => {
    return getCoursePath(lang, course.id)
  }

  const bucketHeading = (bucket: CourseBucket) => {
    if (bucket.curriculumYear === null) return bucket.termName
    const yearLabel = t('degree_page.year_option', {
      year:
        lang === 'en' ? toOrdinal(bucket.curriculumYear) : bucket.curriculumYear
    })
    return `${yearLabel} · ${bucket.termName}`
  }

  const renderCourseCard = (course: CourseWithFeedback, key: string) => (
    <CourseCard
      key={key}
      courseId={course.id}
      acronym={course.acronym}
      name={course.name}
      averageRating={course.averageRating}
      averageWorkload={course.averageWorkload}
      totalFeedbackCount={course.totalFeedbackCount}
      hasMandatoryExam={course.hasMandatoryExam}
      isMandatory={course.isMandatory}
      href={getCourseUrl(course)}
    />
  )

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
        <div className="flex flex-wrap gap-2 items-center">
          <FilterChip
            label={t('degree_page.sort_label')}
            options={sortOptions}
            selectedValue={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
            placeholder={t('degree_page.sort_default')}
            variant="sort"
          />
          {curriculumYearOptions.length > 0 && (
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
          {termOptions.length > 0 && (
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
          {hasCourseTypeFilterOptions && (
            <FilterChip
              label={t('degree_page.mandatory_label')}
              options={courseTypeOptions}
              selectedValue={courseTypeFilter?.toString() ?? null}
              onValueChange={(value) => {
                setCourseTypeFilter(value === null ? null : value === 'true')
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
          {hasExamFilterOptions && (
            <FilterChip
              label={t('degree_page.exam_label')}
              options={examTypeOptions}
              selectedValue={mandatoryExamFilter?.toString() ?? null}
              onValueChange={(value) =>
                setMandatoryExamFilter(value === null ? null : value === 'true')
              }
              placeholder={t('degree_page.exam_any')}
            />
          )}
        </div>
      }
      actions={
        <WarningAlert
          message={
            <>
              {t('degree_page.missing_course')}{' '}
              <Button
                variant="link"
                size="xs"
                asChild
                className="p-0 h-auto text-sm underline"
              >
                <a
                  href={ADD_COURSE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('degree_page.request_link')}
                </a>
              </Button>
            </>
          }
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
      ) : availableCurriculumYears.length === 0 ||
        courseBuckets.buckets.length === 0 ? (
        // Term-only degrees (no curriculum-year data) group into bare
        // "Fall"/"Spring" headings with no year hierarchy while duplicating
        // courses offered in multiple terms, so grouping earns its keep only
        // when real curriculum years exist. Otherwise keep the flat sorted grid.
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) =>
            renderCourseCard(course, course.id.toString())
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {courseBuckets.buckets.map((bucket) => (
            <section key={bucket.key}>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {bucketHeading(bucket)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bucket.courses.map((course) =>
                  renderCourseCard(course, `${bucket.key}-${course.id}`)
                )}
              </div>
            </section>
          ))}
          {courseBuckets.other.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {t('degree_page.other_courses')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseBuckets.other.map((course) =>
                  renderCourseCard(course, `other-${course.id}`)
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </BrowsePageLayout>
  )
}
