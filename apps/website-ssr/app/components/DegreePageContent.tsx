import type {
  Course,
  CourseGroup,
  Degree,
  Faculty
} from '@uni-feedback/db/schema'
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  WarningAlert
} from '@uni-feedback/ui'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CourseCard, HeroSection } from '.'

interface CourseWithFeedback extends Course {
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
}

interface CourseGroupWithIds extends CourseGroup {
  courseIds: number[]
}

type SortOption = 'rating' | 'alphabetical' | 'reviews' | 'workload'

interface SearchCoursesProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  availableTerms: string[]
  selectedTerm: string | null
  setSelectedTerm: (term: string | null) => void
  selectedCourseGroupId: number | null
  setSelectedCourseGroupId: (courseGroupId: number | null) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  courseGroups: CourseGroupWithIds[]
  mandatoryExamFilter: boolean | null
  setMandatoryExamFilter: (filter: boolean | null) => void
}

function SearchCourses({
  searchQuery,
  setSearchQuery,
  availableTerms,
  selectedTerm,
  setSelectedTerm,
  selectedCourseGroupId,
  setSelectedCourseGroupId,
  sortBy,
  setSortBy,
  courseGroups,
  mandatoryExamFilter,
  setMandatoryExamFilter
}: SearchCoursesProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select
            value={selectedTerm || 'all'}
            onValueChange={(value) =>
              setSelectedTerm(value === 'all' ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {availableTerms.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select
            value={selectedCourseGroupId?.toString() || 'all'}
            onValueChange={(value) =>
              setSelectedCourseGroupId(value === 'all' ? null : Number(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Course Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Course Groups</SelectItem>
              {courseGroups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select
            value={
              mandatoryExamFilter === null
                ? 'all'
                : mandatoryExamFilter.toString()
            }
            onValueChange={(value) =>
              setMandatoryExamFilter(value === 'all' ? null : value === 'true')
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Exams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              <SelectItem value="true">Has Mandatory Exam</SelectItem>
              <SelectItem value="false">No Mandatory Exam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rating</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="workload">Workload Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function insensitiveMatch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase())
}

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
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<
    number | null
  >(null)
  const [mandatoryExamFilter, setMandatoryExamFilter] = useState<
    boolean | null
  >(null)
  const [sortBy, setSortBy] = useState<SortOption>('rating')

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

  // Filtered courses based on search and filters
  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        const matchesSearch = insensitiveMatch(
          `${course.name} ${course.acronym}`,
          searchQuery
        )

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
    selectedTerm,
    selectedCourseGroupId,
    sortBy,
    courseGroups,
    mandatoryExamFilter
  ])

  const getCourseUrl = (course: CourseWithFeedback) => {
    // For now, just return a placeholder URL since we haven't built individual course pages yet
    return `/courses/${course.id}`
  }

  return (
    <div>
      <HeroSection {...{ showBreadcrumb: true, faculty, degree }} />
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {degree.name}
            </h1>
            <p className="text-gray-600">
              Browse courses from {degree.name} at {faculty.name}
            </p>
          </div>

          <div className="mb-6">
            <SearchCourses
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              availableTerms={availableTerms}
              selectedTerm={selectedTerm}
              setSelectedTerm={setSelectedTerm}
              selectedCourseGroupId={selectedCourseGroupId}
              setSelectedCourseGroupId={setSelectedCourseGroupId}
              sortBy={sortBy}
              setSortBy={setSortBy}
              courseGroups={courseGroups}
              mandatoryExamFilter={mandatoryExamFilter}
              setMandatoryExamFilter={setMandatoryExamFilter}
            />
          </div>

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

          <div className="mt-8">
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
          </div>
        </div>
      </div>
    </div>
  )
}
