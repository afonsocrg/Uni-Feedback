import { type CourseSearchResult, type Faculty } from '@uni-feedback/api-client'
import { StarRating } from '@uni-feedback/ui'
import { ChevronRight, Loader2, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useFacultyDegrees, useSearchCourses } from '~/hooks/queries'
import { useDebounce } from '~/hooks/useDebounce'
import { storage } from '~/utils/storage'
import { FilterChip } from './common/FilterChip'
import { SearchableFilterChip } from './common/SearchableFilterChip'
import { SearchInput } from './common/SearchInput'

interface CourseBrowserProps {
  faculties: Faculty[]
  onCourseSelect?: (courseId: number) => void
  onCourseSelectWithDetails?: (course: CourseSearchResult) => void
  compact?: boolean
}

export function CourseBrowser({
  faculties,
  onCourseSelect,
  onCourseSelectWithDetails,
  compact = false
}: CourseBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFacultyId, setSelectedFacultyId] = useState<
    number | undefined
  >()
  const [selectedDegreeId, setSelectedDegreeId] = useState<number | undefined>()
  const [offset, setOffset] = useState(0)
  const [isLoadingInitialFilters, setIsLoadingInitialFilters] = useState(true)
  const limit = 10

  // Track if this is the first render to avoid saving on mount
  const hasMounted = useRef(false)

  // Load saved filter values from storage on mount
  useEffect(() => {
    const facultyId = storage.getSelectedFacultyId()
    const degreeId = storage.getSelectedDegreeId()

    if (facultyId !== undefined) {
      setSelectedFacultyId(facultyId)
    }
    if (degreeId !== undefined) {
      setSelectedDegreeId(degreeId)
    }

    setIsLoadingInitialFilters(false)
    hasMounted.current = true
  }, [])

  // Debounce search query (300ms)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Allow search with any number of characters
  const hasValidSearch = debouncedSearch.length > 0

  // Fetch degrees for selected faculty
  const { data: degrees = [] } = useFacultyDegrees(selectedFacultyId || null)

  // Search courses with filters (always fetch, even with no filters)
  const { data: results, isLoading } = useSearchCourses({
    q: hasValidSearch ? debouncedSearch : undefined,
    faculty_id: selectedFacultyId,
    degree_id: selectedDegreeId,
    limit,
    offset
  })

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0)
  }, [debouncedSearch, selectedFacultyId, selectedDegreeId])

  // Save faculty selection using storage wrapper (skip on initial mount)
  useEffect(() => {
    // Skip on first render to avoid saving during initial load from storage
    if (!hasMounted.current) {
      return
    }

    storage.setSelectedFacultyId(selectedFacultyId)
  }, [selectedFacultyId])

  // Save degree selection using storage wrapper (skip on initial mount)
  useEffect(() => {
    // Skip on first render to avoid saving during initial load from storage
    if (!hasMounted.current) {
      return
    }

    if (selectedDegreeId !== undefined) {
      storage.setSelectedDegreeId(selectedDegreeId)
    }
  }, [selectedDegreeId])

  const handleCourseClick = (course: CourseSearchResult) => {
    if (onCourseSelectWithDetails) {
      onCourseSelectWithDetails(course)
    } else if (onCourseSelect) {
      onCourseSelect(course.id)
    }
  }

  return (
    <div
      className={
        compact
          ? 'py-1 px-3 pb-4 md:px-6 md:pb-6'
          : 'max-w-3xl mx-auto px-4 py-8'
      }
    >
      <div className={compact ? 'space-y-6' : 'space-y-8 pt-[15vh]'}>
        {/* Header - hidden in compact mode */}
        {!compact && (
          <div className="text-center space-y-2">
            <h1 className="text-xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Find a course to give feedback
            </h1>
            <p className="text-gray-500 text-base md:text-lg">
              Search or browse to find your course.
            </p>
          </div>
        )}

        {/* Search Bar and Filters */}
        <div className="space-y-3 mb-8">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search course by name or acronym..."
          />

          <div className="flex flex-wrap gap-2 items-center">
            <FilterChip
              label="University"
              options={faculties.map((f) => ({
                value: f.id.toString(),
                label: f.shortName
              }))}
              selectedValue={selectedFacultyId?.toString() || null}
              onValueChange={(val) => {
                const newFacultyId = val ? Number(val) : undefined
                if (newFacultyId !== selectedFacultyId) {
                  setSelectedDegreeId(undefined)
                }
                setSelectedFacultyId(newFacultyId)
              }}
              placeholder="All Universities"
            />

            {selectedFacultyId && degrees.length > 0 && (
              <SearchableFilterChip
                label="Degree"
                options={degrees.map((d) => ({
                  value: d.id.toString(),
                  label: `${d.acronym} - ${d.name}`
                }))}
                selectedValue={selectedDegreeId?.toString() || null}
                onValueChange={(val) =>
                  setSelectedDegreeId(val ? Number(val) : undefined)
                }
                placeholder="All Degrees"
                searchPlaceholder="Search degree..."
              />
            )}

            {isLoadingInitialFilters && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        {/* Results Section */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primaryBlue" />
            <p className="text-gray-600">Searching courses...</p>
          </div>
        ) : results?.courses.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No courses found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* Results List */}
            <div className="space-y-3">
              {results?.courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="w-full p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-xl hover:border-primaryBlue hover:-translate-y-0.5 transition-all text-left group cursor-pointer overflow-hidden"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1 break-words">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                        {course.faculty.shortName} › {course.degree.name}
                      </p>
                      <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-primaryBlue transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-500">{course.acronym}</p>
                      {course.hasUserFeedback && course.userRating && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">
                            Your rating:
                          </span>
                          <StarRating value={course.userRating} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {course.hasUserFeedback ? (
                        <Pencil className="w-5 h-5 text-primaryBlue group-hover:scale-110 transition-transform" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-primaryBlue group-hover:translate-x-1 transition-transform" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination - Minimal UI */}
            {results && results.total > limit && (
              <div className="flex justify-center items-center gap-6 pt-6 text-sm">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="text-gray-600 hover:text-primaryBlue disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-gray-400 text-xs">
                  {offset + 1}-{Math.min(offset + limit, results.total)} of{' '}
                  {results.total}
                </span>
                <button
                  disabled={offset + limit >= results.total}
                  onClick={() => setOffset(offset + limit)}
                  className="text-gray-600 hover:text-primaryBlue disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
