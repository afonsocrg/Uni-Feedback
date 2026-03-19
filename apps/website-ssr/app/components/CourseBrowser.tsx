import { type Faculty } from '@uni-feedback/api-client'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { ChevronRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFacultyDegrees, useSearchCourses } from '~/hooks/queries'
import { useDebounce } from '~/hooks/useDebounce'

interface CourseBrowserProps {
  faculties: Faculty[]
  initialFacultyId?: number
  onCourseSelect: (courseId: number) => void
}

export function CourseBrowser({
  faculties,
  initialFacultyId,
  onCourseSelect
}: CourseBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFacultyId, setSelectedFacultyId] = useState<
    number | undefined
  >(initialFacultyId)
  const [selectedDegreeId, setSelectedDegreeId] = useState<number | undefined>()
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Debounce search query (300ms)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch degrees for selected faculty
  const { data: degrees = [] } = useFacultyDegrees(
    selectedFacultyId || null
  )

  // Search courses with filters
  const { data: results, isLoading } = useSearchCourses(
    debouncedSearch || selectedFacultyId || selectedDegreeId
      ? {
          q: debouncedSearch || undefined,
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

  // Reset degree when faculty changes
  useEffect(() => {
    setSelectedDegreeId(undefined)
  }, [selectedFacultyId])

  const hasFilters = !!(
    debouncedSearch ||
    selectedFacultyId ||
    selectedDegreeId
  )

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <Input
          type="search"
          placeholder="Search by course name or acronym..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Inline Filters */}
      <div className="flex gap-4 flex-wrap">
        {/* University Filter */}
        <Select
          value={selectedFacultyId?.toString() || 'all'}
          onValueChange={(val) =>
            setSelectedFacultyId(val === 'all' ? undefined : Number(val))
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Universities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id.toString()}>
                {f.shortName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Degree Filter (only if faculty selected) */}
        {selectedFacultyId && degrees.length > 0 && (
          <Select
            value={selectedDegreeId?.toString() || 'all'}
            onValueChange={(val) =>
              setSelectedDegreeId(val === 'all' ? undefined : Number(val))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Degrees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Degrees</SelectItem>
              {degrees.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.acronym}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Results Section */}
      {!hasFilters ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">Start typing or select filters to find courses</p>
          <p className="text-sm">Search by course name or acronym</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Searching courses...</p>
        </div>
      ) : results?.courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No courses found. Try adjusting your search or filters.
        </div>
      ) : (
        <>
          {/* Result Count */}
          <p className="text-sm text-gray-600">
            Showing {results?.courses.length || 0} of {results?.total || 0}{' '}
            courses
          </p>

          {/* Results List */}
          <div className="space-y-2">
            {results?.courses.map((course) => (
              <button
                key={course.id}
                onClick={() => onCourseSelect(course.id)}
                className="w-full p-4 bg-white border rounded-lg hover:border-primaryBlue hover:shadow-sm transition text-left group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      {course.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {course.acronym}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {course.faculty.shortName} › {course.degree.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-sm text-primaryBlue font-medium">
                    <span className="hidden sm:inline">Give feedback</span>
                    <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {results && results.total > limit && (
            <div className="flex justify-center gap-2">
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
  )
}
