import { PaginationControls } from '@components'
import { useDebounced } from '@hooks'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminCoursesNew,
  type AdminCoursesQuery
} from '@uni-feedback/api-client'
import {
  Chip,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { BookOpen, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface CoursesSearchBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearchReset: () => void
}

function CoursesSearchBar({ searchValue, onSearchChange, onSearchReset }: CoursesSearchBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchValue}
          onChange={(e) => {
            onSearchChange(e.target.value)
            onSearchReset()
          }}
          className="pl-10"
        />
      </div>
    </div>
  )
}

interface CoursesTabContentProps {
  degreeId: number
}
export function CoursesTabContent({ degreeId }: CoursesTabContentProps) {
  const navigate = useNavigate()

  const [coursesSearch, setCoursesSearch] = useState('')

  // Debounce search term to avoid too many API calls
  const debouncedCoursesSearch = useDebounced(coursesSearch, 300)

  // Courses tab pagination (using local state to avoid conflicts with other tabs)
  const [coursesPage, setCoursesPage] = useState(1)
  const [coursesLimit, setCoursesLimit] = useState(20)

  // Build query object using debounced search and current filters
  const coursesQuery: AdminCoursesQuery = {
    page: coursesPage,
    limit: coursesLimit,
    ...(debouncedCoursesSearch && { search: debouncedCoursesSearch }),
    degree_id: degreeId
  }

  const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses', coursesQuery],
    queryFn: () => getAdminCoursesNew(coursesQuery),
    enabled: !!degreeId
  })

  if (coursesLoading) {
    return (
      <>
        <CoursesSearchBar
          searchValue={coursesSearch}
          onSearchChange={setCoursesSearch}
          onSearchReset={() => setCoursesPage(1)}
        />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </>
    )
  }

  if (!coursesResponse?.data.length) {
    return (
      <>
        <CoursesSearchBar
          searchValue={coursesSearch}
          onSearchChange={setCoursesSearch}
          onSearchReset={() => setCoursesPage(1)}
        />
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {coursesSearch
              ? 'No courses found matching your search'
              : 'No courses found for this degree'}
          </p>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <CoursesSearchBar
        searchValue={coursesSearch}
        onSearchChange={setCoursesSearch}
        onSearchReset={() => setCoursesPage(1)}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>ECTS</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead className="text-right">Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coursesResponse.data.map((course) => (
              <TableRow
                key={course.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{course.name}</div>
                    <div className="font-mono text-sm text-muted-foreground">
                      {course.acronym}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{course.ects || 'N/A'}</TableCell>
                <TableCell>
                  {course.terms?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {course.terms.map((term, index) => (
                        <Chip key={index} label={term} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {course.feedbackCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {coursesResponse && (
        <PaginationControls
          currentPage={coursesResponse.page}
          totalPages={coursesResponse.totalPages}
          pageSize={coursesResponse.limit}
          total={coursesResponse.total}
          onPageChange={(page) => {
            setCoursesPage(page)
          }}
          onPageSizeChange={(limit) => {
            setCoursesPage(1)
            setCoursesLimit(limit)
          }}
        />
      )}
    </div>
  )
}
