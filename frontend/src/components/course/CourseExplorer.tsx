import { insensitiveMatch } from '@/utils'
import { CourseGrid, SearchCourses } from '@components'
import { useApp, useDegreeCourseGroups, useDegreeCourses } from '@hooks'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

type SortOption = 'rating' | 'alphabetical' | 'reviews'

export function CourseExplorer() {
  const [searchParams] = useSearchParams()
  const initialValues = getInitialValues(searchParams)

  const [searchQuery, setSearchQuery] = useState(initialValues.searchQuery)
  const [selectedTerm, setSelectedTerm] = useState(initialValues.term)
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<
    number | null
  >(initialValues.courseGroupId)
  const [sortBy, setSortBy] = useState<SortOption>(initialValues.sortBy)

  const {
    selectedDegreeId,
    selectedDegree,
    isDegreeSelectorOpen,
    setIsDegreeSelectorOpen
  } = useApp()

  const { data: courses, isLoading: isCoursesLoading } =
    useDegreeCourses(selectedDegreeId)
  const { data: courseGroups } = useDegreeCourseGroups(selectedDegreeId ?? 0)

  useEffect(() => {
    if (selectedDegreeId === null && !isDegreeSelectorOpen) {
      setIsDegreeSelectorOpen(true)
    }
  }, [selectedDegreeId, isDegreeSelectorOpen, setIsDegreeSelectorOpen])

  // Ensure selected Course Group exists!
  useEffect(() => {
    if (
      selectedCourseGroupId !== null &&
      (!courseGroups ||
        courseGroups.find((s) => s.id === selectedCourseGroupId) === undefined)
    ) {
      setSelectedCourseGroupId(null)
    }
  }, [courseGroups, selectedCourseGroupId])

  const availableTerms = useMemo(() => {
    return [...new Set(courses?.flatMap((course) => course.terms) ?? [])].sort()
  }, [courses])

  // Load filters from search params
  useEffect(() => {
    // Chrome converts search parameters to lowercase
    // So we need to do a case insensitive search
    // and then use the found term
    const term = searchParams.get('term')
    if (!term) return

    const foundTerm = availableTerms.find(
      (t) => t.toLowerCase() === term.toLowerCase()
    )
    if (foundTerm) {
      setSelectedTerm(foundTerm)
    }
  }, [availableTerms, searchParams])

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
          return matchesSearch && matchesTerm && matchesCourseGroup
        })
        .sort((a, b) => {
          switch (sortBy as SortOption) {
            case 'rating':
              return (b.rating || 0) - (a.rating || 0)
            case 'alphabetical':
              return a.name.localeCompare(b.name)
            case 'reviews':
              return (b.feedbackCount || 0) - (a.feedbackCount || 0)
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
      courseGroups
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
        {selectedDegree && (
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
                selectedTerm={selectedTerm}
                setSelectedTerm={setSelectedTerm}
                selectedCourseGroupId={selectedCourseGroupId}
                setSelectedCourseGroupId={setSelectedCourseGroupId}
                sortBy={sortBy}
                setSortBy={setSortBy}
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
  const term = searchParams.get('term') || ''
  const courseGroupId = null

  const sortValue = searchParams.get('sort')
  const sortBy = (
    sortValue && ['rating', 'alphabetical', 'reviews'].includes(sortValue)
      ? sortValue
      : 'alphabetical'
  ) as SortOption

  return {
    searchQuery,
    term,
    courseGroupId,
    sortBy
  }
}
