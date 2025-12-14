import type {
  Course,
  CourseGroup,
  Degree,
  Faculty
} from '@uni-feedback/db/schema'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { toOrdinal } from '@uni-feedback/utils'
import { useMemo, useState } from 'react'
import { useLocalStorage } from '~/hooks'
import { insensitiveMatch, STORAGE_KEYS } from '~/utils'
import { BrowsePageLayout, CourseCard } from '.'
import { FilterChip } from './common/FilterChip'
import { SearchInput } from './common/SearchInput'

interface CourseWithFeedback extends Course {
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
}

interface CourseGroupWithIds extends CourseGroup {
  courseIds: number[]
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
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedCurriculumYear, setSelectedCurriculumYear] = useLocalStorage<
    number | null
  >(STORAGE_KEYS.FILTER_CURRICULUM_YEAR, null)
  const [selectedTerm, setSelectedTerm] = useLocalStorage<string | null>(
    STORAGE_KEYS.FILTER_TERM,
    null
  )
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useLocalStorage<
    number | null
  >(STORAGE_KEYS.FILTER_COURSE_GROUP_ID, null)
  const [mandatoryExamFilter, setMandatoryExamFilter] = useLocalStorage<
    boolean | null
  >(STORAGE_KEYS.FILTER_HAS_MANDATORY_EXAM, null)
  const [sortBy, setSortBy] = useLocalStorage<SortOption>(
    STORAGE_KEYS.FILTER_SORT_BY,
    'reviews'
  )

  // Available curriculum years for filtering
  const availableCurriculumYears = useMemo(() => {
    const years = new Set<number>()
    courses.forEach((course) => {
      if (
        course.curriculumYear !== null &&
        course.curriculumYear !== undefined
      ) {
        years.add(course.curriculumYear)
      }
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [courses])

  // Available terms for filtering
  const availableTerms = useMemo(() => {
    const terms = new Set<string>()
    courses.forEach((course) => {
      if (Array.isArray(course.terms)) {
        course.terms.forEach((term) => terms.add(term))
      } else if (typeof course.terms === 'string') {
        // Handle string format like "1,2,3"
        course.terms.split(',').forEach((term) => terms.add(term.trim()))
      }
    })
    return Array.from(terms).sort()
  }, [courses])

  // Check if any course has exam information
  const hasExamFilterOptions = useMemo(() => {
    return courses.some((course) => course.hasMandatoryExam !== null)
  }, [courses])

  // Filter options
  const curriculumYearOptions = availableCurriculumYears.map((year) => ({
    value: year.toString(),
    label: `${toOrdinal(year)} year`
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
    { value: 'true', label: 'Exam: Mandatory' },
    { value: 'false', label: 'Exam: Optional' }
  ]

  const sortOptions = [
    { value: 'rating', label: 'Highest Rating' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'reviews', label: 'Most Reviews' },
    { value: 'workload', label: 'Workload Rating' }
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
          course.curriculumYear === selectedCurriculumYear

        const matchesTerm =
          !selectedTerm ||
          (Array.isArray(course.terms)
            ? course.terms.includes(selectedTerm)
            : typeof course.terms === 'string'
              ? course.terms
                  .split(',')
                  .map((t) => t.trim())
                  .includes(selectedTerm)
              : false)

        const matchesCourseGroup =
          !selectedCourseGroupId ||
          courseGroups
            .find((g) => g.id === selectedCourseGroupId)
            ?.courseIds.includes(course.id)

        const matchesMandatoryExam =
          mandatoryExamFilter === null ||
          course.hasMandatoryExam === mandatoryExamFilter

        return (
          matchesSearch &&
          matchesCurriculumYear &&
          matchesTerm &&
          matchesCourseGroup &&
          matchesMandatoryExam
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
    mandatoryExamFilter
  ])

  const getCourseUrl = (course: CourseWithFeedback) => {
    return `/courses/${course.id}`
  }

  return (
    <BrowsePageLayout
      title={degree.name}
      faculty={faculty}
      degree={degree}
      searchBar={
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or acronym..."
        />
      }
      filterChips={
        <div className="flex flex-wrap gap-2 items-center">
          <FilterChip
            label="Sort By"
            options={sortOptions}
            selectedValue={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
            placeholder="Most Reviews"
            variant="sort"
          />
          {curriculumYearOptions.length > 0 && (
            <FilterChip
              label="Year"
              options={curriculumYearOptions}
              selectedValue={selectedCurriculumYear?.toString() ?? null}
              onValueChange={(value) =>
                setSelectedCurriculumYear(value ? Number(value) : null)
              }
              placeholder="All Years"
            />
          )}
          {termOptions.length > 0 && (
            <FilterChip
              label="Term"
              options={termOptions}
              selectedValue={selectedTerm}
              onValueChange={setSelectedTerm}
              placeholder="All Terms"
            />
          )}
          {courseGroupOptions.length > 0 && (
            <FilterChip
              label="Course Group"
              options={courseGroupOptions}
              selectedValue={selectedCourseGroupId?.toString() ?? null}
              onValueChange={(value) =>
                setSelectedCourseGroupId(value ? Number(value) : null)
              }
              placeholder="All Groups"
            />
          )}
          {hasExamFilterOptions && (
            <FilterChip
              label="Exam"
              options={examTypeOptions}
              selectedValue={mandatoryExamFilter?.toString() ?? null}
              onValueChange={(value) =>
                setMandatoryExamFilter(value === null ? null : value === 'true')
              }
              placeholder="Exam: Any"
            />
          )}
        </div>
      }
      actions={
        <WarningAlert
          message={
            <>
              Missing a course?{' '}
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
                  Request it here
                </a>
              </Button>
            </>
          }
        />
      }
    >
      {!courses || courses.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No courses found for this degree.
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No courses match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              courseId={course.id}
              acronym={course.acronym}
              name={course.name}
              averageRating={course.averageRating}
              averageWorkload={course.averageWorkload}
              totalFeedbackCount={course.totalFeedbackCount}
              hasMandatoryExam={course.hasMandatoryExam}
              href={getCourseUrl(course)}
            />
          ))}
        </div>
      )}
    </BrowsePageLayout>
  )
}
