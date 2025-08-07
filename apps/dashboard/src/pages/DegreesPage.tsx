import { PaginationControls } from '@components'
import { useDebouncedSearch, useAdminFilters } from '@hooks'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminDegrees,
  getAdminDegreeTypes,
  getFaculties,
  type AdminDegreesQuery
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { GraduationCap, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function DegreesPage() {
  const navigate = useNavigate()

  // Local state for pagination and filters
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const { facultyId, setFaculty } = useAdminFilters()
  const [selectedType, setSelectedType] = useState('all')

  const selectedFacultyId = facultyId?.toString() ?? 'all'

  // Debounced search functionality
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useDebouncedSearch(
    '',
    300
  )

  // Build query object using debounced search and current filters
  const query: AdminDegreesQuery = {
    page,
    limit,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(facultyId !== null && {
      faculty_id: facultyId
    }),
    ...(selectedType !== 'all' && { type: selectedType })
  }

  // Fetch data
  const {
    data: degreesResponse,
    isLoading: degreesLoading,
    error: degreesError,
    refetch: refetchDegrees
  } = useQuery({
    queryKey: ['admin-degrees', query],
    queryFn: () => getAdminDegrees(query)
  })

  const { data: faculties = [] } = useQuery({
    queryKey: ['faculties'],
    queryFn: getFaculties
  })

  const { data: degreeTypesResponse } = useQuery({
    queryKey: ['degree-types', facultyId],
    queryFn: () => getAdminDegreeTypes(facultyId ?? undefined)
  })

  const degrees = degreesResponse?.data || []
  const degreeTypes = degreeTypesResponse?.types || []

  // Handle faculty change
  const handleFacultyChange = (newFacultyId: string) => {
    setFaculty(newFacultyId === 'all' ? null : parseInt(newFacultyId, 10))
    // Reset type selection when faculty changes since available types may change
    setSelectedType('all')
    setPage(1) // Reset to first page when changing filters
  }

  // Handle type change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType)
    setPage(1) // Reset to first page when changing filters
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newLimit: number) => {
    setPage(1)
    setLimit(newLimit)
  }

  // Handle row clicks
  const handleDegreeClick = (degreeId: number) => {
    navigate(`/degrees/${degreeId}`)
  }

  const handleFacultyClick = (e: React.MouseEvent, facultyId: number) => {
    e.stopPropagation() // Prevent degree row click
    navigate(`/faculties/${facultyId}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page when changing search term
  }

  if (degreesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Failed to load degrees
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {degreesError instanceof Error
              ? degreesError.message
              : 'An error occurred'}
          </p>
          <Button onClick={() => refetchDegrees()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Degree Management</h1>
          <Badge variant="secondary" className="ml-2">
            {degreesResponse?.total || 0} degrees
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Degrees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select
              value={selectedFacultyId}
              onValueChange={handleFacultyChange}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All faculties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All faculties</SelectItem>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id.toString()}>
                    <Chip label={faculty.shortName} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {degreeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or acronym..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {degreesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : degrees.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                {debouncedSearchTerm ||
                selectedFacultyId !== 'all' ||
                selectedType !== 'all'
                  ? 'No degrees found'
                  : 'No degrees yet'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {debouncedSearchTerm ||
                selectedFacultyId !== 'all' ||
                selectedType !== 'all'
                  ? 'Try adjusting your search terms or filters'
                  : 'No degrees have been added to the system'}
              </p>
            </div>
          ) : (
            /* Degrees Table */
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Acronym</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Courses</TableHead>
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
                          <Chip
                            label={degree.facultyShortName}
                            onClick={(e) =>
                              handleFacultyClick(e, degree.facultyId)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{degree.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {degree.acronym}
                        </TableCell>
                        <TableCell className="font-medium">
                          {degree.name}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {degree.courseCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {degreesResponse && (
                <PaginationControls
                  currentPage={degreesResponse.page}
                  totalPages={degreesResponse.totalPages}
                  pageSize={degreesResponse.limit}
                  total={degreesResponse.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
