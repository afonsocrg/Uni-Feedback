import { type Faculty } from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { ChevronRight, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useFacultyDegrees, useSearchCourses } from '~/hooks/queries'
import { useDebounce } from '~/hooks/useDebounce'
import { storage } from '~/utils/storage'
import { FilterChip } from './common/FilterChip'
import { SearchableFilterChip } from './common/SearchableFilterChip'
import { SearchInput } from './common/SearchInput'

interface CourseBrowserProps {
  faculties: Faculty[]
  initialFacultyId?: number
  initialDegreeId?: number
  onCourseSelect: (courseId: number) => void
}

export function CourseBrowser({
  faculties,
  initialFacultyId,
  initialDegreeId,
  onCourseSelect
}: CourseBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFacultyId, setSelectedFacultyId] = useState<
    number | undefined
  >(initialFacultyId)
  const [selectedDegreeId, setSelectedDegreeId] = useState<number | undefined>(
    initialDegreeId
  )
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Track if this is the first render to avoid saving on mount
  const hasMounted = useRef(false)

  // Debounce search query (300ms)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Minimum characters required for search
  const MIN_SEARCH_LENGTH = 3
  const hasValidSearch = debouncedSearch.length >= MIN_SEARCH_LENGTH

  // Fetch degrees for selected faculty
  const { data: degrees = [] } = useFacultyDegrees(selectedFacultyId || null)

  // Determine if we should fetch courses (either search query OR filters selected)
  const hasFiltersSelected =
    selectedFacultyId !== undefined || selectedDegreeId !== undefined
  const shouldFetchCourses = hasValidSearch || hasFiltersSelected

  // Search courses with filters
  const { data: results, isLoading } = useSearchCourses(
    shouldFetchCourses
      ? {
          q: hasValidSearch ? debouncedSearch : undefined,
          faculty_id: selectedFacultyId,
          degree_id: selectedDegreeId,
          limit,
          offset
        }
      : null
  )

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0)
  }, [debouncedSearch, selectedFacultyId, selectedDegreeId])

  // Save faculty selection using storage wrapper (skip on initial mount)
  useEffect(() => {
    // Skip on first render to avoid overwriting during SSR hydration
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }

    if (selectedFacultyId !== undefined) {
      storage.setSelectedFacultyId(selectedFacultyId)
    }
  }, [selectedFacultyId])

  // Save degree selection using storage wrapper (skip on initial mount)
  useEffect(() => {
    // Skip on first render (hasMounted is already set to true by faculty effect)
    if (!hasMounted.current) {
      return
    }

    if (selectedDegreeId !== undefined) {
      storage.setSelectedDegreeId(selectedDegreeId)
    }
  }, [selectedDegreeId])

  const hasResults = shouldFetchCourses && !isLoading && results && results.courses.length > 0

  return (
    <div className={`max-w-3xl mx-auto px-4 ${hasResults ? 'py-8' : 'min-h-screen flex flex-col justify-center py-8'}`}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Which course do you want to review?
          </h1>
          <p className="text-gray-500 text-base md:text-lg">
            Search or browse to find your course.
          </p>
        </div>

        {/* Search Bar and Filters */}
        <div className="space-y-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search course by name or acronym..."
          />

          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        {/* Results Section */}
        {!shouldFetchCourses ? (
          <div className="text-center py-16 text-gray-500">
            <p className="mb-2 text-base md:text-lg">
              Select a university or degree to browse courses
            </p>
            <p className="text-sm">
              Or type at least {MIN_SEARCH_LENGTH} characters to search
            </p>
          </div>
        ) : isLoading ? (
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
                  onClick={() => onCourseSelect(course.id)}
                  className="w-full p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-xl hover:border-primaryBlue hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide truncate">
                        {course.faculty.shortName} › {course.degree.name}
                      </p>
                      <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-primaryBlue transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-500">{course.acronym}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <ChevronRight className="w-6 h-6 text-primaryBlue group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {results && results.total > limit && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {Math.floor(offset / limit) + 1} of{' '}
                  {Math.ceil(results.total / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + limit >= results.total}
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
