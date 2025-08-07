import { PaginationControls } from '@components'
import { useDebouncedSearch, useAdminFilters } from '@hooks'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@uni-feedback/ui'
import {
  getAllTerms,
  getAdminCoursesNew,
  getDegreeSuggestions,
  getFaculties,
  type AdminCoursesQuery
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import { BookOpen, Check, ChevronsUpDown, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function CoursesPage() {
  const navigate = useNavigate()

  // Local state for pagination and filters
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const { facultyId, degreeId, setFaculty, setDegree } = useAdminFilters()
  const [selectedTerm, setSelectedTerm] = useState('all')

  const selectedFacultyId = facultyId?.toString() ?? 'all'
  const selectedDegreeId = degreeId?.toString() ?? 'all'
  const [degreePopoverOpen, setDegreePopoverOpen] = useState(false)
  const [termPopoverOpen, setTermPopoverOpen] = useState(false)

  // Debounced search functionality
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useDebouncedSearch(
    '',
    300
  )

  // Build query object using debounced search and current filters
  const query: AdminCoursesQuery = {
    page,
    limit,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(facultyId !== null && {
      faculty_id: facultyId
    }),
    ...(degreeId !== null && {
      degree_id: degreeId
    }),
    ...(selectedTerm !== 'all' && { term: selectedTerm })
  }

  // Fetch data
  const {
    data: coursesResponse,
    isLoading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses
  } = useQuery({
    queryKey: ['admin-courses', query],
    queryFn: () => getAdminCoursesNew(query)
  })

  const { data: faculties = [] } = useQuery({
    queryKey: ['faculties'],
    queryFn: getFaculties
  })

  const { data: degrees = [] } = useQuery({
    queryKey: [
      'degree-suggestions',
      facultyId
    ],
    queryFn: () =>
      getDegreeSuggestions(
        facultyId ?? undefined
      ),
    enabled: facultyId !== null
  })

  const { data: termsResponse } = useQuery({
    queryKey: [
      'all-terms',
      facultyId
    ],
    queryFn: () =>
      getAllTerms(
        facultyId ?? undefined
      )
  })

  const courses = coursesResponse?.data || []
  const terms = termsResponse?.terms || []

  // Handle faculty change
  const handleFacultyChange = (newFacultyId: string) => {
    setFaculty(newFacultyId === 'all' ? null : parseInt(newFacultyId, 10))
    // Reset term selection when faculty changes since available options may change
    setSelectedTerm('all')
    setPage(1) // Reset to first page when changing filters
  }

  // Handle degree change
  const handleDegreeChange = (newDegreeId: string) => {
    setDegree(newDegreeId === 'all' ? null : parseInt(newDegreeId, 10))
    setPage(1) // Reset to first page when changing filters
  }

  // Handle term change
  const handleTermChange = (newTerm: string) => {
    setSelectedTerm(newTerm)
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
  const handleCourseClick = (courseId: number) => {
    navigate(`/courses/${courseId}`)
  }

  const handleFacultyClick = (e: React.MouseEvent, facultyId: number) => {
    e.stopPropagation() // Prevent course row click
    navigate(`/faculties/${facultyId}`)
  }

  const handleDegreeClick = (e: React.MouseEvent, degreeId: number) => {
    e.stopPropagation() // Prevent course row click
    navigate(`/degrees/${degreeId}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page when changing search term
  }

  if (coursesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Failed to load courses
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {coursesError instanceof Error
              ? coursesError.message
              : 'An error occurred'}
          </p>
          <Button onClick={() => refetchCourses()} className="mt-4">
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
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Course Management</h1>
          <Badge variant="secondary" className="ml-2">
            {coursesResponse?.total || 0} courses
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Courses</CardTitle>
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
            <Popover
              open={degreePopoverOpen}
              onOpenChange={setDegreePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={degreePopoverOpen}
                  className="w-full sm:w-48 justify-between font-normal"
                  disabled={facultyId === null}
                >
                  {selectedDegreeId === 'all'
                    ? facultyId === null
                      ? 'Select faculty first'
                      : 'All degrees'
                    : (degrees.find((d) => d.id.toString() === selectedDegreeId)
                        ?.acronym ?? 'Select degree')}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search degrees..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No degrees found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleDegreeChange('all')
                          setDegreePopoverOpen(false)
                        }}
                      >
                        All degrees
                        <Check
                          className={cn(
                            'ml-auto',
                            selectedDegreeId === 'all'
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                      {degrees.map((degree) => (
                        <CommandItem
                          value={`${degree.acronym} - ${degree.name}`}
                          key={degree.id}
                          onSelect={() => {
                            handleDegreeChange(degree.id.toString())
                            setDegreePopoverOpen(false)
                          }}
                        >
                          {degree.acronym} - {degree.name}
                          <Check
                            className={cn(
                              'ml-auto',
                              degree.id.toString() === selectedDegreeId
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover open={termPopoverOpen} onOpenChange={setTermPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={termPopoverOpen}
                  className="w-full sm:w-48 justify-between font-normal"
                >
                  {selectedTerm === 'all' ? 'All terms' : selectedTerm}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search terms..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No terms found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleTermChange('all')
                          setTermPopoverOpen(false)
                        }}
                      >
                        All terms
                        <Check
                          className={cn(
                            'ml-auto',
                            selectedTerm === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                      {terms.map((term) => (
                        <CommandItem
                          value={term}
                          key={term}
                          onSelect={() => {
                            handleTermChange(term)
                            setTermPopoverOpen(false)
                          }}
                        >
                          {term}
                          <Check
                            className={cn(
                              'ml-auto',
                              term === selectedTerm
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
          {coursesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                {debouncedSearchTerm ||
                selectedFacultyId !== 'all' ||
                selectedDegreeId !== 'all' ||
                selectedTerm !== 'all'
                  ? 'No courses found'
                  : 'No courses yet'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {debouncedSearchTerm ||
                selectedFacultyId !== 'all' ||
                selectedDegreeId !== 'all' ||
                selectedTerm !== 'all'
                  ? 'Try adjusting your search terms or filters'
                  : 'No courses have been added to the system'}
              </p>
            </div>
          ) : (
            /* Courses Table */
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Degree</TableHead>
                      <TableHead>Acronym</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>ECTS</TableHead>
                      <TableHead>Terms</TableHead>
                      <TableHead className="text-right">Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow
                        key={course.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCourseClick(course.id)}
                      >
                        <TableCell>
                          <Chip
                            label={course.facultyShortName}
                            onClick={(e) =>
                              handleFacultyClick(e, course.facultyId)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={course.degreeAcronym}
                            onClick={(e) =>
                              handleDegreeClick(e, course.degreeId)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {course.acronym}
                        </TableCell>
                        <TableCell className="font-medium">
                          {course.name}
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

              {/* Pagination */}
              {coursesResponse && (
                <PaginationControls
                  currentPage={coursesResponse.page}
                  totalPages={coursesResponse.totalPages}
                  pageSize={coursesResponse.limit}
                  total={coursesResponse.total}
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
