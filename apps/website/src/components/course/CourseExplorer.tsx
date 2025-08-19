import { type SortOption } from '@/context/NavigationContext'
import { insensitiveMatch } from '@/utils'
import { CourseGrid, SearchCourses } from '@components'
import { useDegreeCourseGroups, useDegreeCourses, useNavigationState } from '@hooks'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

interface CourseExplorerProps {
  degreeId: number
}

export function CourseExplorer({ degreeId }: CourseExplorerProps) {
  const [searchParams] = useSearchParams()
  const initialValues = getInitialValues(searchParams)

  const [searchQuery, setSearchQuery] = useState(initialValues.searchQuery)

  // Use navigation context for course filters and sortBy
  const {
    selectedTerm,
    setSelectedTerm,
    selectedCourseGroupId,
    setSelectedCourseGroupId,
    mandatoryExamFilter,
    setMandatoryExamFilter,
    sortBy,
    setSortBy
  } = useNavigationState()

  const { data: courses, isLoading: isCoursesLoading } =
    useDegreeCourses(degreeId)
  const { data: courseGroups } = useDegreeCourseGroups(degreeId)

  // Ensure selected Course Group exists!
  useEffect(() => {
    if (
      selectedCourseGroupId !== null &&
      (!courseGroups ||
        courseGroups.find((s) => s.id === selectedCourseGroupId) === undefined)
    ) {
      setSelectedCourseGroupId(null)
    }
  }, [courseGroups, selectedCourseGroupId, setSelectedCourseGroupId])

  const availableTerms = useMemo(() => {
    return [...new Set(courses?.flatMap((course) => course.terms) ?? [])].sort()
  }, [courses])

  // Load filters from search params
  useEffect(() => {
    // Initialize term filter from URL params
    const term = searchParams.get('term')
    if (term && availableTerms.length > 0) {
      const foundTerm = availableTerms.find(
        (t) => t.toLowerCase() === term.toLowerCase()
      )
      if (foundTerm) {
        setSelectedTerm(foundTerm)
      }
    }

    // Initialize mandatory exam filter from URL params
    const mandatoryExamValue = searchParams.get('mandatoryExam')
    if (mandatoryExamValue !== null) {
      const mandatoryExam =
        mandatoryExamValue === 'true'
          ? true
          : mandatoryExamValue === 'false'
            ? false
            : null
      setMandatoryExamFilter(mandatoryExam)
    }

    // Initialize sortBy from URL params
    const sortValue = searchParams.get('sort')
    if (sortValue && ['rating', 'alphabetical', 'reviews'].includes(sortValue)) {
      setSortBy(sortValue as any)
    }
  }, [availableTerms, searchParams, setSelectedTerm, setMandatoryExamFilter, setSortBy])

  const filteredCourses = useMemo(
    () =>
      courses
        ?.filter((course) => {
          const matchesSearch = insensitiveMatch(
            `${course.name} ${course.acronym}`,
            searchQuery
          )
          const matchesTerm =
            !selectedTerm || course.terms.includes(selectedTerm)
          const matchesCourseGroup =
            !selectedCourseGroupId ||
            courseGroups
              ?.find((s) => s.id === selectedCourseGroupId)
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
          switch (sortBy as SortOption) {
            case 'rating':
              return (b.averageRating || 0) - (a.averageRating || 0)
            case 'alphabetical':
              return a.name.localeCompare(b.name)
            case 'reviews':
              return (b.totalFeedbackCount || 0) - (a.totalFeedbackCount || 0)
            default:
              return 0
          }
        }) ?? [],
    [
      courses,
      searchQuery,
      selectedTerm,
      selectedCourseGroupId,
      sortBy,
      courseGroups,
      mandatoryExamFilter
    ]
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300 }
    }
  }

  return (
    <>
      <motion.main
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {degreeId && (
          <>
            <motion.div
              variants={itemVariants}
              id="course-list"
              className="space-y-2"
            >
              <SearchCourses
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                availableTerms={availableTerms}
                selectedTerm={selectedTerm || ''}
                setSelectedTerm={(term: string) => setSelectedTerm(term || null)}
                selectedCourseGroupId={selectedCourseGroupId}
                setSelectedCourseGroupId={setSelectedCourseGroupId}
                sortBy={sortBy}
                setSortBy={setSortBy}
                degreeId={degreeId}
                mandatoryExamFilter={mandatoryExamFilter}
                setMandatoryExamFilter={setMandatoryExamFilter}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6">
              {isCoursesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-6 animate-pulse"
                    >
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <CourseGrid courses={filteredCourses} />
              ) : (
                <div className="text-gray-600 text-center py-8">
                  {searchQuery || selectedTerm
                    ? 'No courses match your filters.'
                    : 'No courses loaded yet. Please try again later.'}
                </div>
              )}
            </motion.div>
          </>
        )}
      </motion.main>
    </>
  )
}

function getInitialValues(searchParams: URLSearchParams) {
  const searchQuery = searchParams.get('q') || ''

  return {
    searchQuery
  }
}
