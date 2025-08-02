import { PaginationControls } from '@components'
import { useDebounced } from '@hooks'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminDegrees,
  getAdminDegreeTypes,
  type AdminDegreesQuery
} from '@uni-feedback/api-client'
import {
  Chip,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface FacultyDegreesCardProps {
  facultyId: number
}
export function FacultyDegreesCard({ facultyId }: FacultyDegreesCardProps) {
  const navigate = useNavigate()

  const [degreesSearch, setDegreesSearch] = useState('')
  const [degreesTypeFilter, setDegreesTypeFilter] = useState<string>('all')

  // Debounce search term to avoid too many API calls
  const debouncedDegreesSearch = useDebounced(degreesSearch, 300)

  // Degrees pagination state
  const [degreesPage, setDegreesPage] = useState(1)
  const [degreesLimit, setDegreesLimit] = useState(20)

  // Build query object using debounced search and current filters
  const degreesQuery: AdminDegreesQuery = {
    page: degreesPage,
    limit: degreesLimit,
    ...(debouncedDegreesSearch && { search: debouncedDegreesSearch }),
    faculty_id: facultyId,
    ...(degreesTypeFilter !== 'all' && { type: degreesTypeFilter })
  }

  const { data: degreesResponse, isLoading: degreesLoading } = useQuery({
    queryKey: ['admin-degrees', degreesQuery],
    queryFn: () => getAdminDegrees(degreesQuery),
    enabled: !!facultyId
  })

  const { data: degreeTypesResponse } = useQuery({
    queryKey: ['degree-types', facultyId],
    queryFn: () => getAdminDegreeTypes(facultyId),
    enabled: !!facultyId
  })

  const handleDegreeClick = (degreeId: number) => {
    navigate(`/degrees/${degreeId}`)
  }

  // Use server-side pagination and filtering
  const degrees = degreesResponse?.data || []
  const degreeTypes = degreeTypesResponse?.types || []

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search degrees..."
            value={degreesSearch}
            onChange={(e) => setDegreesSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={degreesTypeFilter} onValueChange={setDegreesTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {degreeTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <Chip label={type} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {degreesLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : degrees.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {degreesSearch || degreesTypeFilter !== 'all'
              ? 'No degrees found matching your search'
              : 'No degrees found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Acronym</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {degrees.map((degree) => (
                  <TableRow
                    key={degree.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleDegreeClick(degree.id)}
                  >
                    <TableCell>
                      <Chip label={degree.type} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {degree.acronym}
                    </TableCell>
                    <TableCell>{degree.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {degree.courseCount || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {degreesResponse && (
            <PaginationControls
              currentPage={degreesResponse.page}
              totalPages={degreesResponse.totalPages}
              pageSize={degreesResponse.limit}
              total={degreesResponse.total}
              onPageChange={(page) => {
                setDegreesPage(page)
              }}
              onPageSizeChange={(limit) => {
                setDegreesPage(1)
                setDegreesLimit(limit)
              }}
            />
          )}
        </div>
      )}
    </>
  )
}
